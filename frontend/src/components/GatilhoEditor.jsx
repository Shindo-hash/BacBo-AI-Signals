import { useState } from 'react'

const CORES = {
  P: { bg: 'bg-blue-500', text: 'text-white', label: '🔵 P' },
  B: { bg: 'bg-red-500',  text: 'text-white', label: '🔴 B' },
  T: { bg: 'bg-yellow-500', text: 'text-black', label: '🟡 T' },
}

export default function GatilhoEditor({ onSalvar, onFechar }) {
  const [sequencia, setSequencia] = useState([])
  const [entrada, setEntrada] = useState('P')
  const [confianca, setConfianca] = useState(65)
  const [erro, setErro] = useState('')

  const salvar = () => {
    if (sequencia.length < 2) { setErro('Adicione ao menos 2 itens na sequência'); return }

    // Gera nome automático a partir da sequência
    const nomeAuto = `CUSTOM-${sequencia.join('')}-${entrada}-${Date.now().toString(36).toUpperCase()}`

    const gatilho = {
      nome: nomeAuto,
      condicao: `Sequência ${sequencia.join('-')} detectada`,
      entrada,
      confianca,
      ocorrencias: 0,
      acertos: 0,
      exemplo: `${sequencia.join('')}→${entrada}`,
      tipo: 'usuario',
      sequencia_custom: sequencia,
    }
    onSalvar(gatilho)
    onFechar()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={onFechar}>
      <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-5 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">✨ Novo Padrão</h3>
          <button onClick={onFechar} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
        </div>

        {/* Preview sequência */}
        <div className="mb-3">
          <label className="text-xs text-gray-400 mb-2 block">Sequência <span className="text-gray-600">(máx 8)</span></label>
          <div className="flex items-center gap-1 min-h-10 bg-gray-800 rounded-lg px-3 py-2 mb-2 flex-wrap">
            {sequencia.length === 0 ? (
              <span className="text-gray-600 text-xs">Clique nos botões abaixo...</span>
            ) : (
              <>
                {sequencia.map((cor, i) => (
                  <span key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${CORES[cor].bg} ${CORES[cor].text}`}>
                    {cor}
                  </span>
                ))}
                <span className="text-gray-500 text-xs ml-1">→ <span className={entrada === 'P' ? 'text-blue-400' : entrada === 'B' ? 'text-red-400' : 'text-yellow-400'}>{entrada}</span></span>
              </>
            )}
          </div>

          {/* Botões P B T */}
          <div className="flex gap-2 mb-2">
            {['P', 'B', 'T'].map(cor => (
              <button key={cor} onClick={() => sequencia.length < 8 && setSequencia(p => [...p, cor])}
                disabled={sequencia.length >= 8}
                className={`flex-1 py-2.5 rounded-lg font-bold text-sm ${CORES[cor].bg} ${CORES[cor].text} disabled:opacity-40 active:scale-95 transition-transform`}>
                {CORES[cor].label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setSequencia(p => p.slice(0, -1))} disabled={sequencia.length === 0}
              className="flex-1 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-300 rounded-lg">
              ← Apagar
            </button>
            <button onClick={() => setSequencia([])} disabled={sequencia.length === 0}
              className="flex-1 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-300 rounded-lg">
              🗑️ Limpar
            </button>
          </div>
        </div>

        {/* Entrada esperada */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-2 block">Entrada esperada</label>
          <div className="flex gap-2">
            {['P', 'B', 'T'].map(cor => (
              <button key={cor} onClick={() => setEntrada(cor)}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                  entrada === cor
                    ? `${CORES[cor].bg} ${CORES[cor].text} scale-105`
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}>
                {cor === 'P' ? '🔵 P' : cor === 'B' ? '🔴 B' : '🟡 T'}
              </button>
            ))}
          </div>
        </div>

        {/* Confiança */}
        <div className="mb-5">
          <div className="flex justify-between mb-1">
            <label className="text-xs text-gray-400">Confiança inicial</label>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              confianca >= 75 ? 'bg-green-500/20 text-green-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>{confianca}%</span>
          </div>
          <input type="range" min="40" max="90" step="5" value={confianca}
            onChange={e => setConfianca(Number(e.target.value))}
            className="w-full h-1 accent-purple-500 cursor-pointer" />
          <div className="flex justify-between text-gray-600 mt-0.5" style={{fontSize:'9px'}}>
            <span>40%</span><span>65%</span><span>90%</span>
          </div>
        </div>

        {erro && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-xs mb-3">{erro}</div>
        )}

        <button onClick={salvar}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
          ✅ Salvar Padrão
        </button>
      </div>
    </div>
  )
}
