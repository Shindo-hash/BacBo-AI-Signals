import os
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / ".env")

from fastapi import Request, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
from datetime import datetime
import sqlite3
from ia_manager import IAManager
import asyncio

app = FastAPI()

# CORS - URLs permitidas
origins = [
    "https://bac-bo-ai-signals-n2dk.vercel.app",  # Frontend em produção
    "http://localhost:5173",  # Frontend local
    "http://localhost:3000"   # Frontend local alternativo
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ia_manager = IAManager()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

class Resultado(BaseModel):
    winner: str
    player: int
    banker: int

class HistoricoInicial(BaseModel):
    resultados: List[Resultado]

class ConfirmacaoSinal(BaseModel):
    sinal_id: int
    resultado: str
    gatilho_nome: Optional[str] = None


class LoginRequest(BaseModel):
    usuario: str
    senha: str

def init_db():
    conn = sqlite3.connect('bacbo.db')
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS resultados
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  winner TEXT, player INTEGER, banker INTEGER,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')

    c.execute('''CREATE TABLE IF NOT EXISTS sinais
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  entrada TEXT, tipo_sinal TEXT, gatilho_nome TEXT,
                  motivo_gatilho TEXT, motivo_ia TEXT,
                  confianca_gemini INTEGER, confianca_validacao INTEGER,
                  confianca_final INTEGER, resultado TEXT,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')

    conn.commit()

    # Migração automática
    colunas_sinais = [
        ("tipo_sinal", "TEXT"), ("gatilho_nome", "TEXT"),
        ("motivo_gatilho", "TEXT"), ("motivo_ia", "TEXT"),
        ("confianca_gemini", "INTEGER"), ("confianca_validacao", "INTEGER"),
        ("confianca_final", "INTEGER"),
    ]
    c.execute("PRAGMA table_info(sinais)")
    colunas_existentes = [row[1] for row in c.fetchall()]
    for coluna, tipo in colunas_sinais:
        if coluna not in colunas_existentes:
            c.execute(f"ALTER TABLE sinais ADD COLUMN {coluna} {tipo}")
            print(f"Migracao: coluna '{coluna}' adicionada")

    conn.commit()
    conn.close()

init_db()

historico_memoria = []
sinal_ativo = None

def get_historico_completo():
    conn = sqlite3.connect('bacbo.db')
    c = conn.cursor()
    c.execute('SELECT winner, player, banker FROM resultados ORDER BY id DESC LIMIT 240')
    rows = c.fetchall()
    conn.close()
    return [{"winner": r[0], "player": r[1], "banker": r[2]} for r in reversed(rows)]

historico_memoria = get_historico_completo()




@app.post("/api/reiniciar-sessao")
async def reiniciar_sessao():
    """Reinicia sessão - limpa sinais e padrões da IA, mantém resultados e gatilhos do usuário"""
    try:
        conn = sqlite3.connect('bacbo.db')
        c = conn.cursor()
        c.execute('DELETE FROM sinais')
        conn.commit()
        conn.close()
        
        print("\n" + "="*50)
        print("🔄 REINICIAR SESSÃO")
        print("="*50)
        
        # DEBUG: Estado ANTES
        print(f"ANTES - gatilhos_usuario: {len(ia_manager.gatilhos_usuario)}")
        print(f"ANTES - gatilhos_ia: {len(ia_manager.gatilhos_ia)}")
        print(f"ANTES - gatilhos_dinamicos: {len(ia_manager.gatilhos_dinamicos)}")
        
        # Limpa APENAS gatilhos da IA
        ia_manager.gatilhos_ia = []
        ia_manager.gatilhos_dinamicos = ia_manager.gatilhos_usuario.copy()
        ia_manager.quota_esgotada = False
        
        # DEBUG: Estado DEPOIS
        print(f"DEPOIS - gatilhos_usuario: {len(ia_manager.gatilhos_usuario)}")
        print(f"DEPOIS - gatilhos_ia: {len(ia_manager.gatilhos_ia)}")
        print(f"DEPOIS - gatilhos_dinamicos: {len(ia_manager.gatilhos_dinamicos)}")
        
        # Lista os nomes dos gatilhos que ficaram
        print("\nGatilhos que ficaram:")
        for g in ia_manager.gatilhos_dinamicos:
            print(f"  - {g.get('nome', 'SEM NOME')}")
        
        print("="*50 + "\n")
        
        return {
            "sucesso": True,
            "gatilhos_usuario": ia_manager.gatilhos_usuario,
            "gatilhos_ia": [],
            "gatilhos": ia_manager.gatilhos_dinamicos
        }
        
    except Exception as e:
        print(f"❌ ERRO AO REINICIAR: {e}")
        import traceback
        traceback.print_exc()
        return {"sucesso": False, "erro": str(e)}

@app.post("/api/limpar-historico")
async def limpar_historico():
    """Limpa todo o histórico do banco de dados"""
    try:
        conn = sqlite3.connect('bacbo.db')
        c = conn.cursor()
        c.execute('DELETE FROM resultados')
        c.execute('DELETE FROM sinais')
        conn.commit()
        conn.close()
        
        # Limpa memória também
        global historico_memoria
        historico_memoria = []
        
        return {"sucesso": True, "mensagem": "Histórico limpo"}
    except Exception as e:
        return {"sucesso": False, "erro": str(e)}

@app.post("/api/login")
async def login(req: LoginRequest):
    usuario_correto = os.getenv("APP_USUARIO", "admin")
    senha_correta = os.getenv("APP_SENHA", "admin")
    if req.usuario == usuario_correto and req.senha == senha_correta:
        import hashlib, time
        token = hashlib.sha256(f"{req.usuario}{time.time()}".encode()).hexdigest()[:32]
        return {"ok": True, "token": token}
    return {"ok": False}

@app.get("/")
async def root():
    return {"message": "BacBo AI - Gemini + Groq"}

@app.post("/api/historico")
async def receber_historico(data: HistoricoInicial):
    global historico_memoria
    conn = sqlite3.connect('bacbo.db')
    c = conn.cursor()
    c.execute('DELETE FROM resultados')
    for r in data.resultados:
        c.execute('INSERT INTO resultados (winner, player, banker) VALUES (?, ?, ?)',
                  (r.winner, r.player, r.banker))
    conn.commit()
    conn.close()
    historico_memoria = get_historico_completo()
    print(f"Historico recebido: {len(historico_memoria)} resultados")
    await manager.broadcast({
        "tipo": "historico_inicial",
        "data": {"resultados": historico_memoria, "total": len(historico_memoria)}
    })
    return {"status": "success", "total_recebido": len(data.resultados), "total_no_banco": len(historico_memoria)}

@app.post("/api/resultado")
async def receber_resultado(resultado: Resultado):
    global historico_memoria, sinal_ativo
    print(f"\n{'='*50}")
    print(f"NOVO RESULTADO: {resultado.winner} (P:{resultado.player} B:{resultado.banker})")

    conn = sqlite3.connect('bacbo.db')
    c = conn.cursor()
    c.execute('INSERT INTO resultados (winner, player, banker) VALUES (?, ?, ?)',
              (resultado.winner, resultado.player, resultado.banker))
    conn.commit()
    conn.close()

    historico_memoria.append({"winner": resultado.winner, "player": resultado.player, "banker": resultado.banker})
    if len(historico_memoria) > 240:
        historico_memoria.pop(0)

    await manager.broadcast({
        "tipo": "novo_resultado",
        "data": {"winner": resultado.winner, "player": resultado.player, "banker": resultado.banker}
    })

    sinal = await ia_manager.processar_resultado(historico_memoria)
    if sinal:
        # Verifica se é erro de quota
        if sinal.get("tipo") == "erro_quota":
            await manager.broadcast({
                "tipo": "erro_quota",
                "data": {"api": sinal.get("api")}
            })
            print(f"⚠️ Quota {sinal.get('api').upper()} esgotada")
        else:
            sinal_id = await salvar_sinal(sinal)
            sinal["id"] = sinal_id
            await manager.broadcast({"tipo": "novo_sinal", "data": sinal})
            sinal_ativo = sinal
            print(f"SINAL ENVIADO: {sinal['entrada']} ({sinal['confianca_final']}%)")

    return {"status": "success"}

async def salvar_sinal(sinal: dict) -> int:
    conn = sqlite3.connect('bacbo.db')
    c = conn.cursor()
    c.execute('''INSERT INTO sinais
                 (entrada, tipo_sinal, gatilho_nome, motivo_gatilho, motivo_ia,
                  confianca_gemini, confianca_validacao, confianca_final, resultado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
              (sinal["entrada"],
               sinal.get("tipo_sinal", "ia_dinamico"),
               sinal.get("gatilho_nome", ""),
               sinal.get("motivo_gatilho", ""),
               sinal.get("motivo_ia", ""),
               sinal.get("confianca_gemini", 0),
               sinal.get("confianca_validacao", 0),
               sinal["confianca_final"],
               None))
    sinal_id = c.lastrowid
    conn.commit()
    conn.close()
    return sinal_id

@app.post("/api/confirmar")
async def confirmar_sinal(confirmacao: ConfirmacaoSinal):
    conn = sqlite3.connect('bacbo.db')
    c = conn.cursor()
    c.execute('UPDATE sinais SET resultado = ? WHERE id = ?',
              (confirmacao.resultado, confirmacao.sinal_id))
    conn.commit()
    conn.close()

    if confirmacao.gatilho_nome:
        ia_manager.atualizar_confianca_gatilho(confirmacao.gatilho_nome, confirmacao.resultado)

    await manager.broadcast({"tipo": "gatilhos_atualizados", "data": ia_manager.get_status()})
    await manager.broadcast({"tipo": "atualizacao_sessao", "data": calcular_sessao()})
    return {"status": "success"}

@app.get("/api/sessao")
async def get_sessao():
    return calcular_sessao()

def calcular_sessao():
    conn = sqlite3.connect('bacbo.db')
    c = conn.cursor()
    c.execute('SELECT COUNT(*) FROM sinais WHERE resultado = "win"')
    wins = c.fetchone()[0]
    c.execute('SELECT COUNT(*) FROM sinais WHERE resultado = "loss"')
    losses = c.fetchone()[0]
    conn.close()
    total = wins + losses
    return {"wins": wins, "losses": losses, "assertividade": int(wins/total*100) if total > 0 else 0}

@app.get("/api/status-ia")
async def get_status_ia():
    return ia_manager.get_status()

@app.post("/api/pesquisar-padroes")
async def pesquisar_padroes():
    if len(historico_memoria) < 30:
        return {"sucesso": False, "erro": f"Minimo 30 resultados (voce tem {len(historico_memoria)})", "gatilhos": [], "quota_esgotada": False}

    print("Pesquisa de padroes iniciada...")
    resultado = await ia_manager.gemini_criar_gatilhos(historico_memoria)
    await manager.broadcast({"tipo": "gatilhos_atualizados", "data": ia_manager.get_status()})
    return resultado


@app.post("/api/gatilhos-usuario")
async def adicionar_gatilho_usuario(request: Request):
    gatilho = await request.json()
    ia_manager.gatilhos_usuario.append(gatilho)
    ia_manager._atualizar_gatilhos_dinamicos()
    return {"status": "ok", "gatilhos_usuario": ia_manager.gatilhos_usuario}

@app.delete("/api/gatilhos-usuario/{nome}")
async def remover_gatilho_usuario(nome: str):
    ia_manager.gatilhos_usuario = [g for g in ia_manager.gatilhos_usuario if g["nome"] != nome]
    ia_manager._atualizar_gatilhos_dinamicos()
    return {"status": "ok"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.on_event("startup")
async def startup_event():
    print("\n" + "="*50)
    print("BACBO AI - Gemini 2.5 Flash + Groq Llama 3.3")
    print(f"Historico carregado: {len(historico_memoria)} resultados")
    print("="*50 + "\n")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)