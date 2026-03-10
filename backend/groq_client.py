"""
GROQ CLIENT
===========
Cliente para validação rápida de gatilhos com Llama 3.1 (via Groq)
SUPER RÁPIDO: 0.5-1s por requisição!
"""

import os
import requests
from typing import Dict, List

class GroqClient:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        # Modelo Llama 3.3 70B (NOVO, substitui 3.1)
        self.model = "llama-3.3-70b-versatile"
    
    async def validar_gatilho(self, historico: List[dict], gatilho: Dict) -> Dict:
        """
        Valida se um gatilho dinâmico deve ser acionado
        
        Args:
            historico: Últimos resultados
            gatilho: Gatilho criado pelo Gemini
        
        Returns:
            {
                "valido": bool,
                "confianca": int (0-100),
                "motivo": str
            }
        """
        
        # Formata últimos 10 resultados
        ultimos_10 = historico[-10:] if len(historico) >= 10 else historico
        sequencia = " ".join([r["winner"][0] for r in ultimos_10])  # P B P T...
        
        prompt = f"""Você é um validador de padrões em Baccarat.

GATILHO DETECTADO (Gemini):
Nome: {gatilho['nome']}
Condição: {gatilho['condicao']}
Entrada sugerida: {gatilho['entrada']}
Confiança histórica: {gatilho['confianca']}%
Acertos anteriores: {gatilho['acertos']}/{gatilho['ocorrencias']}

SITUAÇÃO ATUAL (últimos {len(ultimos_10)}):
{sequencia}

PERGUNTA: Este gatilho está VÁLIDO agora? Qual probabilidade de sucesso?

RESPONDA EXATAMENTE NESTE FORMATO:
VALIDO: [sim ou nao]
CONFIANCA: [0-100]
MOTIVO: [explicação em 1 linha]

Exemplo:
VALIDO: sim
CONFIANCA: 82
MOTIVO: Padrão confirmado, 5 seguidos detectados, tendência forte
"""
        
        try:
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": "Você é um especialista em análise de padrões em jogos de Baccarat. Responda de forma objetiva e precisa."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.3,
                "max_tokens": 150
            }
            
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                texto = result["choices"][0]["message"]["content"].strip()
                
                # Parse resposta
                valido = False
                confianca = 0
                motivo = ""
                
                for linha in texto.split('\n'):
                    linha = linha.strip()
                    if linha.startswith("VALIDO:"):
                        valido = "sim" in linha.lower()
                    elif linha.startswith("CONFIANCA:") or linha.startswith("CONFIANÇA:"):
                        try:
                            # Extrai número
                            num_str = ''.join(filter(str.isdigit, linha.split(":")[1]))
                            if num_str:
                                confianca = int(num_str)
                        except:
                            confianca = 0
                    elif linha.startswith("MOTIVO:"):
                        motivo = linha.split(":", 1)[1].strip()
                
                return {
                    "valido": valido,
                    "confianca": confianca,
                    "motivo": motivo if motivo else "Análise concluída"
                }
            else:
                print(f"⚠️ Groq erro {response.status_code}")
                quota_excedida = response.status_code in [401, 429]  # Unauthorized ou Rate Limit
                return {
                    "valido": False,
                    "confianca": 0,
                    "motivo": f"Erro API: {response.status_code}",
                    "quota_excedida": quota_excedida
                }
                
        except Exception as e:
            print(f"❌ Erro Groq: {e}")
            return {
                "valido": False,
                "confianca": 0,
                "motivo": f"Erro: {str(e)}"
            }
