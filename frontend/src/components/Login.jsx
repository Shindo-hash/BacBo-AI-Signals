import { useState } from 'react'

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      // URL do backend em produção
      const API_URL = 'https://bacbo-ai-signals.onrender.com'
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha })
      })
      const data = await res.json()
      if (data.ok) {
        onLogin(data.token)
      } else {
        setErro('Usuário ou senha incorretos')
      }
    } catch {
      setErro('Erro ao conectar com o servidor')
    }
    setCarregando(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-4xl">🎲</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              BacBo AI
            </h1>
          </div>
          <p className="text-gray-500 text-sm">Sistema de Sinais com Validação IA</p>
        </div>

        {/* Card de Login */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl mb-6">
          <h2 className="text-white font-bold text-lg mb-5 text-center">Entrar</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Usuário</label>
              <input
                type="text"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                placeholder="Seu usuário"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Sua senha"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>

            {erro && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-xs text-center">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
            >
              {carregando ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>
        </div>

        {/* Créditos - Desenvolvedor */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4">
          <div className="text-center">
            <p className="text-purple-400 font-bold text-sm flex items-center justify-center gap-2">
              <span>🛠️</span>
              <span>Desenvolvido por Fernando</span>
            </p>
            <p className="text-gray-400 text-xs mt-1">Araguaína, Tocantins - Brasil</p>
          </div>
        </div>

        {/* Card de Contato */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 mb-4">
          <div className="text-center space-y-3">
            <div>
              <p className="text-white font-semibold text-sm mb-1">💬 Quer usar este sistema?</p>
              <p className="text-gray-400 text-xs">Entre em contato para obter seu acesso exclusivo</p>
            </div>
            
            <a 
              href="https://wa.me/5563981228800?text=Olá! Tenho interesse no BacBo AI Signals" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 rounded-lg transition-all transform hover:scale-105 shadow-lg text-sm w-full"
            >
              <span className="text-lg">📱</span>
              <span>Chamar no WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs">
          © 2025 BacBo AI Signals - Sistema Privado
        </p>

      </div>
    </div>
  )
}