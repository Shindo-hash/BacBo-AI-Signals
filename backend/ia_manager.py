"""
IA MANAGER - SISTEMA HÍBRIDO INTELIGENTE
=========================================
Gemini: Meta-análise manual (botão)
Groq: Validação rápida em tempo real
Fallback: Lógica manual quando Gemini esgota
"""

import os
import json
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / ".env")  # sempre le o .env da pasta backend/
from typing import Dict, List, Optional
import google.generativeai as genai
from groq_client import GroqClient

class IAManager:
    def __init__(self):
        # Gemini para meta-análise
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=self.gemini_key)
        self.gemini_modelo = 'gemini-2.5-flash'
        
        # Groq para validação (RÁPIDO!)
        self.groq = GroqClient()
        
        # Gatilhos do USUÁRIO — sempre ativos, nunca removidos
        self.gatilhos_usuario = [
            {
                "nome": "5B-INVERTE-P",
                "condicao": "5 Bankers consecutivos",
                "entrada": "Player",
                "confianca": 75,
                "ocorrencias": 0,
                "acertos": 0,
                "exemplo": "BBBBB→P",
                "tipo": "usuario"
            },
            {
                "nome": "5P-INVERTE-B",
                "condicao": "5 Players consecutivos",
                "entrada": "Banker",
                "confianca": 75,
                "ocorrencias": 0,
                "acertos": 0,
                "exemplo": "PPPPP→B",
                "tipo": "usuario"
            },
            {
                "nome": "3B-INVERTE-P",
                "condicao": "3 Bankers consecutivos",
                "entrada": "Player",
                "confianca": 65,
                "ocorrencias": 0,
                "acertos": 0,
                "exemplo": "BBB→P",
                "tipo": "usuario"
            },
            {
                "nome": "3P-INVERTE-B",
                "condicao": "3 Players consecutivos",
                "entrada": "Banker",
                "confianca": 65,
                "ocorrencias": 0,
                "acertos": 0,
                "exemplo": "PPP→B",
                "tipo": "usuario"
            },
            {
                "nome": "ALTERNA-BPB",
                "condicao": "Alternância B-P-B detectada",
                "entrada": "Player",
                "confianca": 68,
                "ocorrencias": 0,
                "acertos": 0,
                "exemplo": "BPB→P",
                "tipo": "usuario"
            },
            {
                "nome": "ALTERNA-PBP",
                "condicao": "Alternância P-B-P detectada",
                "entrada": "Banker",
                "confianca": 68,
                "ocorrencias": 0,
                "acertos": 0,
                "exemplo": "PBP→B",
                "tipo": "usuario"
            },
            {
                "nome": "MARGEM-1-TIE",
                "condicao": "2 dos últimos 3 resultados com margem de 1 ponto",
                "entrada": "Tie",
                "confianca": 45,
                "ocorrencias": 0,
                "acertos": 0,
                "exemplo": "P:5 B:6 → Tie próximo",
                "tipo": "usuario"
            },
            # === ESTRATÉGIA 321 ===
            {
                "nome": "321-PBP-B",
                "condicao": "Sequência 3 Players, 2 Bankers, 1 Player",
                "entrada": "Banker",
                "confianca": 72,
                "ocorrencias": 0,
                "acertos": 0,
                "exemplo": "PPPBBP→B",
                "tipo": "usuario"
            },
            {
                "nome": "321-BPB-P",
                "condicao": "Sequência 3 Bankers, 2 Players, 1 Banker",
                "entrada": "Player",
                "confianca": 72,
                "ocorrencias": 0,
                "acertos": 0,
                "exemplo": "BBBPPB→P",
                "tipo": "usuario"
            },
            # === ESTRATÉGIA 123 ===
            {
                "nome": "123-PBP-B",
                "condicao": "Sequência 1 Player, 2 Bankers, 3 Players",
                "entrada": "Banker",
                "confianca": 70,
                "ocorrencias": 0,
                "acertos": 0,
                "exemplo": "PBBPPP→B",
                "tipo": "usuario"
            },
            {
                "nome": "123-BPB-P",
                "condicao": "Sequência 1 Banker, 2 Players, 3 Bankers",
                "entrada": "Player",
                "confianca": 70,
                "ocorrencias": 0,
                "acertos": 0,
                "exemplo": "BPPBBB→P",
                "tipo": "usuario"
            },
            # === SURF (ride the wave) ===
            {
                "nome": "SURF-B",
                "condicao": "Sequência de 4+ Bankers — continuar na onda",
                "entrada": "Banker",
                "confianca": 68,
                "ocorrencias": 0,
                "acertos": 0,
                "exemplo": "BBBB→B (surfar)",
                "tipo": "usuario"
            },
            {
                "nome": "SURF-P",
                "condicao": "Sequência de 4+ Players — continuar na onda",
                "entrada": "Player",
                "confianca": 68,
                "ocorrencias": 0,
                "acertos": 0,
                "exemplo": "PPPP→P (surfar)",
                "tipo": "usuario"
            },
        ]
        
        # Gatilhos da IA (Gemini) — atualizados pelo botão
        self.gatilhos_ia = []
        
        # Compat: processar_resultado usa self.gatilhos_dinamicos
        # que é a união de ambos
        self._atualizar_gatilhos_dinamicos()
        
        # Controle de quota Gemini
        self.gemini_quota_esgotada = False
        self.gemini_uso_hoje = 0
        
        # Controle de resultados
        self.contador_resultados = 0
        self.ultima_analise = None
        
        # Status
        self.modo_atual = "aguardando"

    def _atualizar_gatilhos_dinamicos(self):
        """Une gatilhos do usuário + IA numa lista só para processamento"""
        self.gatilhos_dinamicos = self.gatilhos_usuario + self.gatilhos_ia
    
    def formatar_historico_para_gemini(self, historico: List[dict]) -> str:
        linhas = []
        for i, r in enumerate(historico, 1):
            winner = r["winner"][0]
            linhas.append(f"{i}. {winner} (P:{r['player']} B:{r['banker']})")
        return "\n".join(linhas)
    
    async def gemini_criar_gatilhos(self, historico: List[dict]) -> Dict:
        """
        Gemini analisa histórico e cria gatilhos dinâmicos.
        Chamado MANUALMENTE pelo botão "Pesquisar Padrões".
        
        Returns:
            {
                "sucesso": bool,
                "gatilhos": list,
                "erro": str (se falhou),
                "quota_esgotada": bool
            }
        """
        
        if len(historico) < 30:
            return {
                "sucesso": False,
                "gatilhos": [],
                "erro": f"Mínimo 30 resultados necessários (você tem {len(historico)})",
                "quota_esgotada": False
            }
        
        print("\n" + "="*60)
        print("🧠 GEMINI META-ANÁLISE INICIANDO...")
        print("="*60)
        
        historico_formatado = self.formatar_historico_para_gemini(historico)
        
        # Formata gatilhos do usuário para validação
        gatilhos_usuario_fmt = ""
        for g in self.gatilhos_usuario:
            gatilhos_usuario_fmt += f"- {g['nome']}: {g['condicao']} → {g['entrada']} (confiança atual: {g['confianca']}%)\n"

        prompt = f"""Você é um especialista em padrões de Baccarat (BacBo).

Analise estes {len(historico)} resultados:

{historico_formatado}

LEGENDA: P=Player, B=Banker, T=Tie

=== PARTE 1: VALIDE OS PADRÕES DO USUÁRIO ===
O usuário tem estes padrões predefinidos. Para cada um, verifique quantas vezes ocorreu no histórico e calcule a confiança REAL:

{gatilhos_usuario_fmt}
Para cada padrão acima, retorne com a confiança atualizada baseada no histórico real.
Se um padrão não ocorreu nenhuma vez, mantenha a confiança original.

=== PARTE 2: DETECTE NOVOS PADRÕES DA IA ===
Encontre padrões ADICIONAIS que se repetem (mínimo 3 ocorrências), especialmente:
- Padrões de Tie com margem de 1 ponto
- Alternâncias incomuns
- Sequências que o usuário não tem

RETORNE UM JSON com dois arrays:
{{
  "gatilhos_usuario_validados": [
    {{
      "nome": "5B-INVERTE-P",
      "condicao": "5 Bankers consecutivos",
      "entrada": "Player",
      "confianca": 82,
      "ocorrencias": 5,
      "acertos": 4,
      "exemplo": "BBBBB→P (4/5 vezes)",
      "tipo": "usuario"
    }}
  ],
  "gatilhos_ia": [
    {{
      "nome": "NOME-PADRAO",
      "condicao": "descrição da condição",
      "entrada": "Player ou Banker ou Tie",
      "confianca": 75,
      "ocorrencias": 6,
      "acertos": 5,
      "exemplo": "sequência→resultado (5/6 vezes)",
      "tipo": "ia"
    }}
  ]
}}

REGRAS:
- Padrões P/B: confiança ≥ 60%
- Padrões Tie: qualquer confiança
- Máximo 8 gatilhos da IA
- RESPONDA APENAS O JSON, SEM TEXTO ADICIONAL
"""

        try:
            model = genai.GenerativeModel(self.gemini_modelo)
            response = model.generate_content(prompt)
            
            texto = response.text.strip()
            
            # Remove markdown se tiver
            if texto.startswith("```json"):
                texto = texto.replace("```json", "").replace("```", "").strip()
            elif texto.startswith("```"):
                texto = texto.replace("```", "").strip()
            
            resposta = json.loads(texto)
            
            # Suporte ao novo formato com 2 arrays
            if isinstance(resposta, dict):
                # Atualiza confiança dos gatilhos do usuário com valores validados
                validados = {g["nome"]: g for g in resposta.get("gatilhos_usuario_validados", [])}
                for g in self.gatilhos_usuario:
                    if g["nome"] in validados:
                        v = validados[g["nome"]]
                        g["confianca"] = v.get("confianca", g["confianca"])
                        g["ocorrencias"] = v.get("ocorrencias", g["ocorrencias"])
                        g["acertos"] = v.get("acertos", g["acertos"])
                
                gatilhos_ia = resposta.get("gatilhos_ia", [])
            else:
                # Formato antigo (array) — fallback
                gatilhos_ia = resposta
            
            # Garante tipo ia
            for g in gatilhos_ia:
                g["tipo"] = "ia"
            
            self.gatilhos_ia = gatilhos_ia
            self._atualizar_gatilhos_dinamicos()
            self.gemini_uso_hoje += 1
            self.ultima_analise = self.contador_resultados
            self.modo_atual = "gemini"
            self.gemini_quota_esgotada = False
            
            print(f"Gemini: {len(self.gatilhos_usuario)} padroes usuario validados, {len(gatilhos_ia)} novos padroes IA")
            
            return {
                "sucesso": True,
                "gatilhos": self.gatilhos_dinamicos,
                "gatilhos_usuario": self.gatilhos_usuario,
                "gatilhos_ia": self.gatilhos_ia,
                "erro": None,
                "quota_esgotada": False
            }
        except Exception as e:
            erro_str = str(e)
            
            # Verifica se é quota esgotada
            if "429" in erro_str or "quota" in erro_str.lower() or "RESOURCE_EXHAUSTED" in erro_str:
                print("⚠️ QUOTA GEMINI ESGOTADA! Ativando fallback...")
                self.gemini_quota_esgotada = True
                self.modo_atual = "fallback"
                
                # Ativa gatilhos do fallback manual
                self.gatilhos_ia = self._gatilhos_fallback()
                self._atualizar_gatilhos_dinamicos()
                
                return {
                    "sucesso": False,
                    "gatilhos": self.gatilhos_dinamicos,
                    "erro": "quota_esgotada",
                    "quota_esgotada": True
                }
            
            print(f"❌ Erro Gemini: {e}")
            return {
                "sucesso": False,
                "gatilhos": [],
                "erro": str(e),
                "quota_esgotada": False
            }
    
    def _gatilhos_fallback(self) -> List[Dict]:
        """
        Gatilhos manuais usados quando Gemini está esgotado.
        Padrões clássicos do BacBo.
        """
        return [
            {
                "nome": "5-SEGUIDOS-INVERTE",
                "condicao": "5 da mesma cor consecutivas",
                "entrada": "cor oposta",
                "confianca": 75,
                "ocorrencias": 0,
                "acertos": 0,
                "exemplo": "BBBBB→P",
                "fallback": True
            },
            {
                "nome": "ALTERNANCIA-CONTINUA",
                "condicao": "alternância P-B-P-B detectada",
                "entrada": "continuar alternância",
                "confianca": 70,
                "ocorrencias": 0,
                "acertos": 0,
                "exemplo": "PBPB→P",
                "fallback": True
            },
            {
                "nome": "3-SEGUIDOS-MUDA",
                "condicao": "3 da mesma cor consecutivas",
                "entrada": "cor oposta",
                "confianca": 65,
                "ocorrencias": 0,
                "acertos": 0,
                "exemplo": "BBB→P",
                "fallback": True
            }
        ]
    
    def verificar_match_gatilho(self, historico: List[dict], gatilho: Dict) -> bool:
        """Verifica se situação atual match com condição do gatilho"""
        
        if len(historico) < 3:
            return False
        
        ultimos = [r["winner"][0] for r in historico[-8:]]  # P, B, T

        # === SEQUÊNCIA CUSTOM DO USUÁRIO ===
        seq = gatilho.get("sequencia_custom")
        if seq:
            n = len(seq)
            if len(ultimos) >= n and ultimos[-n:] == seq:
                return True
            return False  # custom: só match exato
        condicao = gatilho["condicao"].lower()
        nome = gatilho["nome"].upper()
        
        # === MATCH POR NOME (do que Gemini detectou) ===
        
        # 5 Bankers → Player
        if ("BBBBB" in nome or "5B" in nome or "5-B" in nome or
            ("5" in nome and "B" in nome and "P" in nome)):
            if len(ultimos) >= 5 and all(u == 'B' for u in ultimos[-5:]):
                return True
        
        # 5 Players → Banker
        if ("PPPPP" in nome or "5P" in nome or "5-P" in nome or
            ("5" in nome and "P" in nome and "B" in nome)):
            if len(ultimos) >= 5 and all(u == 'P' for u in ultimos[-5:]):
                return True
        
        # 4 Bankers → Player
        if ("BBBB" in nome or "4B" in nome or "4-B" in nome):
            if len(ultimos) >= 4 and all(u == 'B' for u in ultimos[-4:]):
                return True
        
        # 4 Players → Banker
        if ("PPPP" in nome or "4P" in nome or "4-P" in nome):
            if len(ultimos) >= 4 and all(u == 'P' for u in ultimos[-4:]):
                return True
        
        # 3 Bankers → Player
        if ("BBB" in nome or "3B" in nome or "3-B" in nome):
            if len(ultimos) >= 3 and all(u == 'B' for u in ultimos[-3:]):
                return True
        
        # 3 Players → Banker
        if ("PPP" in nome or "3P" in nome or "3-P" in nome):
            if len(ultimos) >= 3 and all(u == 'P' for u in ultimos[-3:]):
                return True
        
        # B-P-B → Player
        if ("BPB" in nome):
            if len(ultimos) >= 3 and ultimos[-3:] == ['B', 'P', 'B']:
                return True
        
        # P-B-P → Banker
        if ("PBP" in nome):
            if len(ultimos) >= 3 and ultimos[-3:] == ['P', 'B', 'P']:
                return True
        
        # Empate
        if "TIE" in nome or "EMPATE" in nome or ultimos[-1] == 'T':
            if "empate" in condicao or "tie" in condicao:
                return True
        
        # Alternância
        if "ALT" in nome or "alternân" in condicao or "alternancia" in condicao:
            if len(ultimos) >= 4:
                alt = all(ultimos[-i-1] != ultimos[-i-2] for i in range(3))
                if alt:
                    return True
        
        # === ESTRATÉGIA 321 ===
        # 3P-2B-1P → Banker
        if "321-PBP" in nome:
            if len(ultimos) >= 6 and ultimos[-6:-3] == ['P','P','P'] and ultimos[-3:-1] == ['B','B'] and ultimos[-1] == 'P':
                return True
        # 3B-2P-1B → Player
        if "321-BPB" in nome:
            if len(ultimos) >= 6 and ultimos[-6:-3] == ['B','B','B'] and ultimos[-3:-1] == ['P','P'] and ultimos[-1] == 'B':
                return True

        # === ESTRATÉGIA 123 ===
        # 1P-2B-3P → Banker
        if "123-PBP" in nome:
            if len(ultimos) >= 6 and ultimos[-6] == 'P' and ultimos[-5:-3] == ['B','B'] and ultimos[-3:] == ['P','P','P']:
                return True
        # 1B-2P-3B → Player
        if "123-BPB" in nome:
            if len(ultimos) >= 6 and ultimos[-6] == 'B' and ultimos[-5:-3] == ['P','P'] and ultimos[-3:] == ['B','B','B']:
                return True

        # === SURF (ride the wave) ===
        # Exatamente 4 (não 5+, pois o 5B/5P já cuida disso)
        if "SURF-B" in nome:
            if len(ultimos) >= 4 and all(u == 'B' for u in ultimos[-4:]) and not all(u == 'B' for u in ultimos[-5:] if len(ultimos) >= 5):
                return True
        if "SURF-P" in nome:
            if len(ultimos) >= 4 and all(u == 'P' for u in ultimos[-4:]) and not all(u == 'P' for u in ultimos[-5:] if len(ultimos) >= 5):
                return True

        # === MARGEM DE 1 PONTO → INDICA TIE ===
        # Se gatilho é de Tie e últimos resultados foram por margem de 1 ponto
        if "TIE" in nome or "EMPATE" in nome or "tie" in condicao or "empate" in condicao or "margem" in condicao:
            # Últimos 2 resultados com diferença de 1 ponto = Tie próximo
            margem_count = 0
            for r in historico[-3:]:
                if abs(r.get("player", 0) - r.get("banker", 0)) <= 1:
                    margem_count += 1
            if margem_count >= 2:
                return True

        # === MATCH POR CONDIÇÃO (genérico) ===
        
        # X seguidos da mesma cor
        for n in [5, 4, 3]:
            if str(n) in condicao and "seguido" in condicao:
                if len(ultimos) >= n:
                    grupo = ultimos[-n:]
                    if len(set(grupo)) == 1 and grupo[0] != 'T':
                        return True
        
        return False
    
    async def processar_resultado(self, historico: List[dict]) -> Optional[Dict]:
        """
        Processa novo resultado.
        Verifica match com gatilhos dinâmicos e valida com Groq.
        NÃO chama Gemini automaticamente - apenas via botão.
        """
        
        self.contador_resultados += 1
        
        # Se não tem gatilhos, não faz nada
        if not self.gatilhos_dinamicos:
            return None
        
        # Verifica match com gatilhos
        for gatilho in self.gatilhos_dinamicos:
            if self.verificar_match_gatilho(historico, gatilho):
                print(f"\n🎯 MATCH! Gatilho: {gatilho['nome']}")
                
                # Valida com Groq
                print(f"⚡ Groq validando...")
                validacao = await self.groq.validar_gatilho(historico, gatilho)
                
                # Verifica se Groq esgotou quota
                if validacao.get("quota_excedida"):
                    print("⚠️ QUOTA GROQ ESGOTADA!")
                    return {"tipo": "erro_quota", "api": "groq"}
                
                # Threshold: Tie passa com >= 40%, P/B precisam >= 70%
                entrada_lower = validacao.get("entrada_sugerida", gatilho.get("entrada", "")).lower()
                eh_tie = "tie" in gatilho["entrada"].lower() or "empate" in gatilho["entrada"].lower()
                threshold = 0 if eh_tie else 60  # Tie sempre passa, P/B >= 60%
                
                if validacao["valido"] and validacao["confianca"] >= threshold:
                    print(f"✅ VALIDADO! Confiança: {validacao['confianca']}%")
                    
                    # Determina entrada
                    entrada = gatilho["entrada"]
                    if "oposta" in entrada.lower():
                        ultima_cor = historico[-1]["winner"]
                        entrada = "Banker" if ultima_cor == "Player" else "Player"
                    elif "continuar" in entrada.lower() and "alternân" in gatilho["condicao"].lower():
                        ultima_cor = historico[-1]["winner"]
                        entrada = "Banker" if ultima_cor == "Player" else "Player"
                    elif "player" in entrada.lower():
                        entrada = "Player"
                    elif "banker" in entrada.lower():
                        entrada = "Banker"
                    
                    # Se for Tie, inclui cor sugerida pelo Groq (ou última cor como fallback)
                    entrada_cor = None
                    if entrada == "Tie":
                        cor_groq = validacao.get("entrada_sugerida", "").lower()
                        if "player" in cor_groq:
                            entrada_cor = "Player"
                        elif "banker" in cor_groq:
                            entrada_cor = "Banker"
                        else:
                            # fallback: última cor que saiu
                            ultima = historico[-1]["winner"]
                            entrada_cor = ultima if ultima in ["Player", "Banker"] else "Banker"
                    
                    return {
                        "entrada": entrada,
                        "entrada_cor": entrada_cor,  # só preenchido quando Tie
                        "tipo_gatilho": gatilho.get("tipo", "usuario"),  # usuario ou ia
                        "tipo_sinal": "ia_dinamico",
                        "gatilho_nome": gatilho["nome"],
                        "confianca_gemini": gatilho["confianca"],
                        "confianca_validacao": validacao["confianca"],
                        "confianca_final": int((gatilho["confianca"] + validacao["confianca"]) / 2),
                        "motivo_gatilho": f"[{'Gemini' if not gatilho.get('fallback') else 'Fallback'}] {gatilho['nome']}: {gatilho['condicao']}",
                        "motivo_ia": f"[Groq] {validacao['motivo']}",
                        "fallback": gatilho.get("fallback", False)
                    }
                else:
                    print(f"❌ NÃO validado: {validacao['motivo']}")
        
        return None
    
    def atualizar_confianca_gatilho(self, gatilho_nome: str, resultado: str):
        """
        Groq aprende com resultados:
        - WIN  → sobe confiança +3% (máx 95%)
        - LOSS → desce confiança -5% (mín 40%)
        """
        for gatilho in self.gatilhos_dinamicos:
            if gatilho["nome"] == gatilho_nome:
                delta = +3 if resultado == "win" else -5
                nova = max(40, min(95, gatilho["confianca"] + delta))
                antiga = gatilho["confianca"]
                gatilho["confianca"] = nova
                sinal = "📈" if delta > 0 else "📉"
                print(f"{sinal} Gatilho '{gatilho_nome}': {antiga}% → {nova}% ({'+' if delta>0 else ''}{delta}%)")
                break

    def get_status(self) -> Dict:
        return {
            "ia_principal": "Gemini 2.5 Flash",
            "ia_validacao": "Groq Llama 3.3",
            "modo_atual": self.modo_atual,
            "gemini_quota_esgotada": self.gemini_quota_esgotada,
            "gemini_uso_hoje": self.gemini_uso_hoje,
            "gatilhos_ativos": len(self.gatilhos_dinamicos),
            "gatilhos": self.gatilhos_dinamicos,
            "gatilhos_usuario": self.gatilhos_usuario,
            "gatilhos_ia": self.gatilhos_ia,
            "resultados_processados": self.contador_resultados,
            "ultima_analise": self.ultima_analise
        }