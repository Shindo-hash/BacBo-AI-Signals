function Header({ conectado, thresholdMin, setThresholdMin, onReiniciarSessao }) {
  return (
    <header className="bg-slate-900/50 backdrop-blur-sm border-b border-purple-500/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">

          {/* Logo */}
          <div className="flex items-center gap-3">
            {/* Dado animado */}
            <div className="relative">
              <div className="text-3xl animate-pulse">🎲</div>
              <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent leading-tight">
                BacBo AI Signals
              </h1>
              <p className="text-gray-500 text-xs">Sistema de Sinais com Validação IA</p>
            </div>
          </div>

          {/* Centro: Botões rápidos */}
          <div className="flex items-center gap-2">
            {/* Jogar BacBo */}
            <a 
              href="https://cassino.bet.br/games/evolution/bac-bo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-lg hover:shadow-purple-500/50">
              🎮 Jogar BacBo
            </a>

            {/* Download Extensão */}
            <a 
              href="https://drive.google.com/file/d/1QXYAXjag9-dg1Xbxt7HPo9FqrSD9LIa9/view?usp=sharing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5">
              📥 Extensão
            </a>

            {/* Reiniciar Sessão */}
            <button
              onClick={onReiniciarSessao}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-lg hover:shadow-orange-500/50"
              title="Zera placar e análises da IA (mantém seus gatilhos)">
              🔄 Reiniciar Sessão
            </button>
          </div>

          {/* Direita: threshold + status */}
          <div className="flex items-center gap-3">

            {/* Threshold slider */}
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Confiança mín.</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  thresholdMin >= 75 ? 'bg-green-500/20 text-green-400' :
                  thresholdMin >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>{thresholdMin}%</span>
              </div>
              <input
                type="range"
                min="50" max="90" step="5"
                value={thresholdMin}
                onChange={e => setThresholdMin(Number(e.target.value))}
                className="w-24 h-1 accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between w-24 text-gray-600" style={{fontSize:'9px'}}>
                <span>50%</span><span>70%</span><span>90%</span>
              </div>
            </div>

            {/* Status online */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              conectado ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${conectado ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-xs font-medium">{conectado ? 'Online' : 'Offline'}</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  )
}

export default Header