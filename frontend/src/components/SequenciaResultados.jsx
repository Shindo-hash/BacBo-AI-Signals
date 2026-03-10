export default function SequenciaResultados({ historico }) {
  // 6 linhas × 21 colunas = 126 células totais
  // Mas só preenche até 18 colunas (108 resultados)
  // Quando passa de 108, faz sliding (remove coluna 1, adiciona na 18)
  
  const LINHAS = 6
  const COLUNAS_TOTAIS = 21
  const COLUNAS_PREENCHIDAS = 18  // Máximo preenchido
  const MAX_RESULTADOS = LINHAS * COLUNAS_PREENCHIDAS  // 108
  
  // Pega últimos 108 resultados
  const resultadosVisiveis = historico.slice(-MAX_RESULTADOS)
  
  // Cria grade vazia
  const grade = Array(LINHAS).fill(null).map(() => 
    Array(COLUNAS_TOTAIS).fill(null)
  )
  
  // Preenche grade (coluna por coluna, top to bottom)
  let coluna = 0
  let linha = 0
  
  resultadosVisiveis.forEach((resultado) => {
    if (coluna < COLUNAS_PREENCHIDAS) {
      grade[linha][coluna] = resultado
      linha++
      
      if (linha >= LINHAS) {
        linha = 0
        coluna++
      }
    }
  })
  
  // Cores
  const getCor = (resultado) => {
    if (!resultado) return 'bg-gray-800/30 border-gray-700/30'
    
    if (resultado.winner === 'Player') {
      return 'bg-blue-500 border-blue-400 hover:bg-blue-600 hover:scale-110'
    } else if (resultado.winner === 'Banker') {
      return 'bg-red-500 border-red-400 hover:bg-red-600 hover:scale-110'
    } else {
      return 'bg-yellow-500 border-yellow-400 hover:bg-yellow-600 hover:scale-110'
    }
  }
  
  // Número
  const getNumero = (resultado) => {
    if (!resultado) return ''
    
    if (resultado.winner === 'Player') {
      return resultado.player
    } else if (resultado.winner === 'Banker') {
      return resultado.banker
    } else {
      return resultado.player
    }
  }

  // Indicador de colunas preenchidas
  const colunasPreenchidas = Math.ceil(resultadosVisiveis.length / LINHAS)

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white text-sm font-medium">
            📊 Histórico de Resultados
          </p>
          <p className="text-gray-500 text-xs">
            {resultadosVisiveis.length} de {MAX_RESULTADOS} visíveis • {historico.length} total no banco
          </p>
        </div>
        
        {/* Indicador Sliding */}
        <div className="text-right">
          <p className="text-gray-400 text-xs">
            Colunas: {colunasPreenchidas}/{COLUNAS_PREENCHIDAS}
          </p>
          {resultadosVisiveis.length >= MAX_RESULTADOS && (
            <p className="text-yellow-400 text-xs animate-pulse">
              ↔️ Sliding ativo
            </p>
          )}
        </div>
      </div>
      
      {/* Grade */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        <div className="inline-grid gap-1" style={{
          gridTemplateColumns: `repeat(${COLUNAS_TOTAIS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${LINHAS}, minmax(0, 1fr))`
        }}>
          {grade.map((linha, linhaIdx) => 
            linha.map((resultado, colunaIdx) => {
              const key = `${linhaIdx}-${colunaIdx}`
              const cor = getCor(resultado)
              const numero = getNumero(resultado)
              
              // Destaca colunas vazias
              const isColVazia = colunaIdx >= COLUNAS_PREENCHIDAS
              
              return (
                <div
                  key={key}
                  className={`
                    w-9 h-9 
                    rounded-full 
                    border-2 
                    flex items-center justify-center
                    text-xs font-bold text-white
                    transition-all duration-200
                    ${cor}
                    ${isColVazia ? 'opacity-30' : ''}
                    ${resultado ? 'cursor-pointer' : ''}
                  `}
                  title={resultado ? 
                    `${resultado.winner} ganhou\nPlayer: ${resultado.player}\nBanker: ${resultado.banker}` 
                    : isColVazia ? 'Coluna vazia (reserva)' : 'Aguardando resultado'}
                >
                  {numero}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Legenda + Info */}
      <div className="mt-4 space-y-3">
        
        {/* Legenda cores */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-400"></div>
            <span>Player</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-400"></div>
            <span>Banker</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-yellow-400"></div>
            <span>Empate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-gray-800 border-2 border-gray-700 opacity-30"></div>
            <span>Vazio</span>
          </div>
        </div>
        
        {/* Info Sliding */}
        <div className="text-xs text-gray-500 bg-gray-900/50 rounded p-2">
          <div className="flex items-start gap-2">
            <span>💡</span>
            <div>
              <p className="font-medium text-gray-400 mb-1">Como funciona:</p>
              <ul className="space-y-0.5">
                <li>• Grade preenche até <span className="text-blue-400">18 colunas</span> (108 resultados)</li>
                <li>• Quando passa de 108, remove coluna 1 e continua na 18</li>
                <li>• <span className="text-yellow-400">Colunas 19-21</span> ficam vazias (espaço visual)</li>
                <li>• IA analisa <span className="text-purple-400">240 resultados</span> no total</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
