# 🎲 BacBo AI Signals

Sistema de sinais para BacBo com validação dupla IA (Gemini + Groq)

## 📁 Estrutura de Pastas

```
BacBo-IA/
├── backend/
│   ├── main.py
│   ├── ia_manager.py
│   ├── groq_client.py
│   ├── requirements.txt
│   └── .env                    ← CRIAR ESTE ARQUIVO!
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Header.jsx
    │   │   ├── Login.jsx
    │   │   ├── GatilhosDinamicos.jsx
    │   │   ├── GatilhoEditor.jsx
    │   │   └── SequenciaResultados.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

## 🔧 Instalação

### Backend

```bash
cd backend

# Criar arquivo .env com suas chaves:
GEMINI_API_KEY=sua_chave_gemini_aqui
GROQ_API_KEY=sua_chave_groq_aqui
APP_USUARIO=Shindo144
APP_SENHA=Shindo144.

# Instalar dependências
pip install -r requirements.txt

# Rodar
python main.py
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Rodar
npm run dev
```

## 🔑 Chaves de API

### Gemini
1. Acesse: https://aistudio.google.com/app/apikey
2. Clique em "Get API Key"
3. Copie a chave e cole no `.env`

### Groq
1. Acesse: https://console.groq.com/keys
2. Crie uma conta gratuita
3. Clique em "Create API Key"
4. Copie e cole no `.env`

## ⚙️ Recursos

- **Login protegido** (usuário/senha no .env)
- **Threshold customizável** (50-90%)
- **13 gatilhos predefinidos** (3B, 5B, 321, 123, Surf, Margem Tie)
- **Editor visual** de padrões customizados
- **Gemini valida** seus padrões + detecta novos
- **Groq** valida tendências (P/B >= 60%, Tie sempre passa)
- **Gale G1 automático**
- **Tie + cor** (win duplo)
- **Cooldown toggle** (30s on/off)
- **Machine learning** nos gatilhos (+3% win / -5% loss)

## 🎮 Como usar

1. Abra o jogo BacBo (Evolution Gaming)
2. Instale a extensão Chrome (pasta `extension/`)
3. App carrega histórico automaticamente
4. Clique "Pesquisar Padrões" para ativar Gemini
5. Groq valida sinais antes de exibir
6. Siga os sinais com Gale G1

## 📊 Assertividade

- Gatilhos validados em tempo real
- Histórico de wins/losses
- % de confiança atualizada pelo Gemini
- Tracking separado: Normal / G1 / Tie
