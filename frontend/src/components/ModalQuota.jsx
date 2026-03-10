export default function ModalQuota({ api, onFechar }) {
  const links = {
    gemini: 'https://aistudio.google.com/app/apikey',
    groq: 'https://console.groq.com/keys'
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4" onClick={onFechar}>
      <div className="bg-gray-900 border-2 border-red-500/50 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl">⚠️</span>
            <h3 className="text-white font-bold text-lg">Limite de API Atingido</h3>
          </div>
          <button onClick={onFechar} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Corpo */}
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm font-medium mb-2">
              {api === 'gemini' ? '🧠 Gemini API' : '⚡ Groq API'} esgotou o limite gratuito.
            </p>
            <p className="text-gray-400 text-xs">
              {api === 'gemini' 
                ? 'A análise de padrões está temporariamente indisponível.'
                : 'A validação de sinais está temporariamente indisponível.'}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-white text-sm font-medium mb-2">💡 Soluções:</p>
            <ul className="text-gray-400 text-xs space-y-2">
              <li>• Aguarde o reset diário (meia-noite PST)</li>
              <li>• Crie uma nova chave de API gratuita</li>
              <li>• Upgrade para plano pago (opcional)</li>
            </ul>
          </div>

          <a 
            href={links[api]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg text-center text-sm transition-colors">
            🔑 Obter Nova Chave
          </a>

          <button 
            onClick={onFechar}
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-2.5 rounded-lg text-sm transition-colors">
            Fechar
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-4">
          {api === 'gemini' 
            ? 'Gemini: 15 requisições/minuto (grátis)'
            : 'Groq: 30 req/min • 6k tokens/min (grátis)'}
        </p>

      </div>
    </div>
  )
}
