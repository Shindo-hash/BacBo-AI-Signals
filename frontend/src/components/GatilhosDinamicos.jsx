import { useState } from 'react'
import GatilhoEditor from './GatilhoEditor'

const entradaCor = (entrada) => {
  const e = entrada?.toLowerCase()
  if (e?.includes('player')) return 'text-blue-400'
  if (e?.includes('banker')) return 'text-red-400'
  if (e?.includes('tie') || e?.includes('empate')) return 'text-yellow-400'
  return 'text-gray-300'
}

function GatilhoItem({ g, onRemover }) {
  return (
    <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-2 group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-blue-400 truncate mr-2">{g.nome}</span>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
            g.confianca >= 80 ? 'bg-green-500 text-black' :
            g.confianca >= 65 ? 'bg-yellow-500 text-black' :
            'bg-gray-600 text-white'
          }`}>{g.confianca}%</span>
          {g.ocorrencias > 0 && (
            <span className="text-xs text-gray-600">{g.acertos}/{g.ocorrencias}</span>
          )}
          {onRemover && (
            <button onClick={() => onRemover(g.nome)}
              className="text-gray-700 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 leading-none">
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="text-xs text-gray-500">{g.condicao}</div>
      <div className={`text-xs mt-0.5 font-bold ${entradaCor(g.entrada)}`}>→ {g.entrada}</div>
    </div>
  )
}

export default function GatilhosDinamicos({ gatilhos, gatilhosUsuario, gatilhosIA, statusIA, quotaEsgotada, onAdicionarGatilho, onRemoverGatilho }) {
  const [expandidoUsuario, setExpandidoUsuario] = useState(false)
  const [expandidoIA, setExpandidoIA] = useState(false)
  const [mostrarEditor, setMostrarEditor] = useState(false)

  const usuario = gatilhosUsuario || (gatilhos || []).filter(g => g.tipo === 'usuario')
  const ia = gatilhosIA || (gatilhos || []).filter(g => g.tipo === 'ia')

  const usuarioVisiveis = expandidoUsuario ? usuario : usuario.slice(0, 3)
  const iaVisiveis = expandidoIA ? ia : ia.slice(0, 3)

  return (
    <div className="space-y-2">

      {mostrarEditor && (
        <GatilhoEditor onSalvar={onAdicionarGatilho} onFechar={() => setMostrarEditor(false)} />
      )}

      {/* GATILHOS DO USUÁRIO */}
      <div className="bg-gray-800/50 border border-blue-500/20 rounded-lg p-3">
        <button onClick={() => setExpandidoUsuario(!expandidoUsuario)}
          className="w-full flex items-center justify-between mb-2">
          <div className="text-left">
            <h3 className="text-white font-bold text-sm">👤 Gatilhos do Usuário</h3>
            <p className="text-xs text-gray-500">{usuario.length} padrões • Groq valida</p>
          </div>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
            {expandidoUsuario ? '▲ recolher' : `▼ ${usuario.length > 3 ? `+${usuario.length - 3}` : 'ver'}`}
          </span>
        </button>

        <div className="space-y-1.5">
          {usuarioVisiveis.map((g, i) => (
            <GatilhoItem key={i} g={g} onRemover={onRemoverGatilho} />
          ))}
        </div>

        {/* Expandido: mostrar resto + botão adicionar */}
        {expandidoUsuario && (
          <div className="mt-3 pt-2 border-t border-gray-700/50 space-y-2">
            {/* Botão escondido "adicionar padrão" */}
            <button onClick={() => setMostrarEditor(true)}
              className="w-full text-xs text-gray-600 hover:text-purple-400 py-1.5 border border-gray-700 hover:border-purple-500/30 rounded-lg transition-all flex items-center justify-center gap-1">
              + adicionar meu padrão
            </button>
          </div>
        )}

        {/* Mostrar mais (sem expandir tudo) */}
        {!expandidoUsuario && usuario.length > 3 && (
          <button onClick={() => setExpandidoUsuario(true)}
            className="w-full mt-1.5 text-xs text-gray-600 hover:text-gray-400 py-1 border border-gray-700 rounded">
            ver mais {usuario.length - 3} padrões
          </button>
        )}
      </div>

      {/* GATILHOS DA IA */}
      <div className="bg-gray-800/50 border border-purple-500/20 rounded-lg p-3">
        <button onClick={() => setExpandidoIA(!expandidoIA)}
          className="w-full flex items-center justify-between mb-2">
          <div className="text-left">
            <h3 className="text-white font-bold text-sm">🧠 Gatilhos da IA</h3>
            <p className="text-xs text-gray-500">
              {quotaEsgotada ? '⚠️ Fallback' : '✨ Gemini'} • {ia.length > 0 ? `${ia.length} padrões` : 'nenhum ainda'}
            </p>
          </div>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
            {expandidoIA ? '▲ recolher' : ia.length > 3 ? `▼ +${ia.length - 3}` : '▼ ver'}
          </span>
        </button>

        {ia.length === 0 ? (
          <div className="text-center py-3 text-gray-600 text-xs">
            Pressione <span className="text-blue-400 font-bold">Pesquisar Padrões</span> para o Gemini analisar
          </div>
        ) : (
          <div className="space-y-1.5">
            {iaVisiveis.map((g, i) => (
              <GatilhoItem key={i} g={g} onRemover={onRemoverGatilho} />
            ))}
          </div>
        )}

        {!expandidoIA && ia.length > 3 && (
          <button onClick={() => setExpandidoIA(true)}
            className="w-full mt-1.5 text-xs text-gray-600 hover:text-gray-400 py-1 border border-gray-700 rounded">
            ver mais {ia.length - 3} padrões
          </button>
        )}

        {statusIA && expandidoIA && ia.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-600 flex justify-between">
            <span>{statusIA.resultados_processados} resultados</span>
            {statusIA.ultima_analise && <span>última análise: #{statusIA.ultima_analise}</span>}
          </div>
        )}
      </div>

    </div>
  )
}
