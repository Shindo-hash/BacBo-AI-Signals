import { useState, useEffect, useRef, useCallback } from 'react'
import Login from './components/Login'
import ModalQuota from './components/ModalQuota'
import Header from './components/Header'
import SequenciaResultados from './components/SequenciaResultados'
import GatilhosDinamicos from './components/GatilhosDinamicos'

// PRODUÇÃO - URL FIXA DO BACKEND RENDER
const API_URL = 'https://bacbo-ai-signals.onrender.com'
const WS_URL = 'wss://bacbo-ai-signals.onrender.com/ws'
console.log('🔗 API_URL configurada:', API_URL)
console.log('🔗 WS_URL configurada:', WS_URL)

function tocarSom(tipo = 'sinal') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (tipo === 'sinal') {
      [0, 0.2, 0.4].forEach(delay => {
        const osc = ctx.createOscillator(), gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.value = 880; osc.type = 'square'
        gain.gain.setValueAtTime(0.8, ctx.currentTime + delay)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15)
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.15)
      })
    }
    if (tipo === 'gale') {
      [0, 0.25].forEach((delay, i) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.value = i === 0 ? 660 : 440; osc.type = 'square'
        gain.gain.setValueAtTime(0.7, ctx.currentTime + delay)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2)
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.2)
      })
    }
    if (tipo === 'win') {
      [0, 0.15, 0.3].forEach((delay, i) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.value = [523, 659, 784][i]; osc.type = 'sine'
        gain.gain.setValueAtTime(0.5, ctx.currentTime + delay)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25)
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.25)
      })
    }
    if (tipo === 'loss') {
      const osc = ctx.createOscillator(), gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.4)
      osc.type = 'sawtooth'
      gain.gain.setValueAtTime(0.5, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4)
    }
  } catch (e) {}
}

function notificarBrowser(titulo, mensagem) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(titulo, { body: mensagem })
  }
}

function ModalHistorico({ historico, onFechar }) {
  const wins = historico.filter(s => s.resultado === 'win')
  const losses = historico.filter(s => s.resultado === 'loss')
  const winsNormal = wins.filter(s => s.gale === 0 && !s.isTie).length
  const winsG1 = wins.filter(s => s.gale === 1 && !s.isTie).length
  const winsTie = wins.filter(s => s.isTie).length
  const lossesG1 = losses.length
  const total = historico.length
  const taxa = total > 0 ? Math.round((wins.length / total) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onFechar}>
      <div className="bg-gray-800 border border-gray-600 rounded-xl w-full max-w-sm max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between shrink-0">
          <h2 className="text-white font-bold">📊 Histórico de Sinais</h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* PLACAR PRINCIPAL */}
        <div className="p-4 border-b border-gray-700 shrink-0">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{wins.length}</div>
              <div className="text-xs text-gray-400">Wins</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{losses.length}</div>
              <div className="text-xs text-gray-400">Losses</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{taxa}%</div>
              <div className="text-xs text-gray-400">Taxa</div>
            </div>
          </div>

          {/* Breakdown detalhado */}
          <div className="space-y-1.5 text-xs bg-gray-900/50 rounded-lg p-3">
            <div className="flex justify-between text-gray-400">
              <span>✅ Win Normal</span>
              <span className="text-green-400 font-bold">{winsNormal}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>✅ Win G1</span>
              <span className="text-yellow-400 font-bold">{winsG1}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>✅ Win Tie</span>
              <span className="text-cyan-400 font-bold">{winsTie}</span>
            </div>
            <div className="flex justify-between text-gray-400 border-t border-gray-700 pt-1">
              <span>❌ Loss G1</span>
              <span className="text-red-400 font-bold">{lossesG1}</span>
            </div>
            <div className="flex justify-between text-gray-300 border-t border-gray-700 pt-1 font-bold">
              <span>Total sinais</span>
              <span>{total}</span>
            </div>
          </div>
        </div>

        {/* LISTA DE SINAIS */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {historico.length === 0 ? (
            <div className="text-center text-gray-500 py-6 text-sm">Nenhum sinal ainda</div>
          ) : (
            [...historico].reverse().map((sinal, i) => (
              <div key={i} className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                sinal.resultado === 'win' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex-1 min-w-0">
                  <span className={`font-bold ${
                    sinal.entrada === 'Tie' ? 'text-yellow-400' :
                    sinal.entrada === 'Player' ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {sinal.entrada === 'Tie' 
                      ? `🟡 TIE ${sinal.entrada_cor ? (sinal.entrada_cor === 'Player' ? '+ 🔵' : '+ 🔴') : ''}`
                      : sinal.entrada === 'Player' ? '🔵 PLAYER' : '🔴 BANKER'
                    }
                  </span>
                  <div className="text-gray-500 truncate">{sinal.gatilho_nome}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {sinal.gale > 0 && (
                    <span className="bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">G{sinal.gale}</span>
                  )}
                  {sinal.isTie && (
                    <span className="bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">TIE</span>
                  )}
                  <span className={`font-bold ${sinal.resultado === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                    {sinal.resultado === 'win' ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [autenticado, setAutenticado] = useState(false)  // Sempre começa deslogado
  const [siteNaoAberto, setSiteNaoAberto] = useState(false)
  const [wsReconectar, setWsReconectar] = useState(0)  // Incrementa para forçar reconexão
  const [modalQuota, setModalQuota] = useState(null)
  const [thresholdMin, setThresholdMin] = useState(60)

  const [historico, setHistorico] = useState([])
  const [sessao, setSessao] = useState({ wins: 0, losses: 0, assertividade: 0 })
  const [conectado, setConectado] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [statusIA, setStatusIA] = useState(null)
  const [gatilhosDinamicos, setGatilhosDinamicos] = useState([])
  const [gatilhosUsuario, setGatilhosUsuario] = useState([])
  const [gatilhosIA, setGatilhosIA] = useState([])
  const [iaAnalisando, setIaAnalisando] = useState(false)
  const [pesquisandoPadroes, setPesquisandoPadroes] = useState(false)
  const [quotaEsgotada, setQuotaEsgotada] = useState(false)
  const [sinalAtivo, setSinalAtivo] = useState(null)
  const sinalAtivoRef = useRef(null)
  const thresholdMinRef = useRef(60)
  const ultimoResultadoRef = useRef(Date.now())
  const resultadosConsecutivosRef = useRef(0)
  const [cooldownAtivo, setCooldownAtivo] = useState(false)
  const [cooldownSegundos, setCooldownSegundos] = useState(0)
  const cooldownAtivoRef = useRef(false)
  const cooldownTimer = useRef(null)
  const [somAtivo, setSomAtivo] = useState(true)
  const [cooldownLigado, setCooldownLigado] = useState(true)  // toggle on/off
  const [mostrarHistorico, setMostrarHistorico] = useState(false)
  const [historicoSinais, setHistoricoSinais] = useState([])

  useEffect(() => { sinalAtivoRef.current = sinalAtivo }, [sinalAtivo])
  useEffect(() => { thresholdMinRef.current = thresholdMin }, [thresholdMin])
  useEffect(() => { cooldownAtivoRef.current = cooldownAtivo }, [cooldownAtivo])

  // Helper para atualizar sinal E ref ao mesmo tempo (evita stale ref no G1)
  const setSinalComRef = useCallback((updater) => {
    setSinalAtivo(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      sinalAtivoRef.current = next  // atualiza ref SINCRONAMENTE
      return next
    })
  }, [])

  useEffect(() => {
    if ('Notification' in window) Notification.requestPermission()
  }, [])

  const iniciarCooldown = useCallback(() => {
    if (!cooldownLigadoRef.current) return  // toggle OFF → não usa cooldown
    if (cooldownTimer.current) clearInterval(cooldownTimer.current)
    setCooldownAtivo(true)
    cooldownAtivoRef.current = true
    let seg = 30
    setCooldownSegundos(seg)
    cooldownTimer.current = setInterval(() => {
      seg -= 1
      setCooldownSegundos(seg)
      if (seg <= 0) {
        clearInterval(cooldownTimer.current)
        setCooldownAtivo(false)
        cooldownAtivoRef.current = false
        setCooldownSegundos(0)
      }
    }, 1000)
  }, [])

  // ref para cooldownLigado (para usar dentro de callbacks sem stale)
  const cooldownLigadoRef = useRef(true)
  useEffect(() => { cooldownLigadoRef.current = cooldownLigado }, [cooldownLigado])

  const iniciarCooldownSeLigado = useCallback(() => {
    if (cooldownLigadoRef.current) iniciarCooldown()
  }, [iniciarCooldown])

  useEffect(() => {
    const carregar = async () => {
      try {
        const resSessao = await fetch(`${API_URL}/api/sessao`)
        setSessao(await resSessao.json())
        const resIA = await fetch(`${API_URL}/api/status-ia`)
        const dataIA = await resIA.json()
        setStatusIA(dataIA)
        setGatilhosDinamicos(dataIA.gatilhos || [])
        setQuotaEsgotada(dataIA.gemini_quota_esgotada || false)
      } catch {}
      setCarregando(false)
    }
    carregar()
    return () => { if (cooldownTimer.current) clearInterval(cooldownTimer.current) }
  }, [])

  // Timer para limpar resultado após 15s
  const timerResultado = useRef(null)
  const agendarLimpezaSinal = useCallback(() => {
    if (timerResultado.current) clearTimeout(timerResultado.current)
    timerResultado.current = setTimeout(() => {
      setSinalComRef(null)
    }, 15000)
  }, [setSinalComRef])

  const processarResultadoParaGale = useCallback((novoResultado) => {
    const sinal = sinalAtivoRef.current
    if (!sinal || sinal.confirmado) return
    const isTie = novoResultado.winner === 'Tie'
    
    // Lógica correta para TIE com cor sugerida
    let ganhou
    if (sinal.entrada === 'Tie') {
      // Sinal de TIE: WIN se vier TIE OU a cor sugerida (entrada_cor)
      if (sinal.entrada_cor) {
        // TIE + cor: WIN se TIE ou COR SUGERIDA
        ganhou = isTie || novoResultado.winner === sinal.entrada_cor
      } else {
        // TIE puro: WIN apenas se TIE
        ganhou = isTie
      }
    } else {
      // Sinal normal (Player ou Banker): WIN se acertar a cor
      ganhou = novoResultado.winner === sinal.entrada
    }

    if (sinal.gale === 0) {
      if (ganhou) {
        const sf = { ...sinal, confirmado: true, resultado: 'win', gale: 0, isTie }
        setSinalComRef(sf)
        setHistoricoSinais(prev => [...prev, sf])
        if (somAtivo) tocarSom('win')
        confirmarSinalAPI(sinal.id, 'win', sinal.gatilho_nome)
        setSessao(prev => { const w = prev.wins + 1; return { ...prev, wins: w, assertividade: Math.round(w/(w+prev.losses)*100) } })
        iniciarCooldownSeLigado()
        agendarLimpezaSinal()
      } else {
        if (somAtivo) tocarSom('gale')
        notificarBrowser('⚠️ GALE 1!', `Manter: ${sinal.entrada}`)
        setSinalComRef(prev => ({ ...prev, gale: 1 }))
      }
    } else if (sinal.gale === 1) {
      if (ganhou) {
        const sf = { ...sinal, confirmado: true, resultado: 'win', gale: 1, isTie }
        setSinalComRef(sf)
        setHistoricoSinais(prev => [...prev, sf])
        if (somAtivo) tocarSom('win')
        confirmarSinalAPI(sinal.id, 'win', sinal.gatilho_nome)
        setSessao(prev => { const w = prev.wins + 1; return { ...prev, wins: w, assertividade: Math.round(w/(w+prev.losses)*100) } })
        iniciarCooldownSeLigado()
        agendarLimpezaSinal()
      } else {
        const sf = { ...sinal, confirmado: true, resultado: 'loss', gale: 1, isTie: false }
        setSinalComRef(sf)
        setHistoricoSinais(prev => [...prev, sf])
        if (somAtivo) tocarSom('loss')
        confirmarSinalAPI(sinal.id, 'loss', sinal.gatilho_nome)
        setSessao(prev => { const l = prev.losses + 1; return { ...prev, losses: l, assertividade: prev.wins > 0 ? Math.round(prev.wins/(prev.wins+l)*100) : 0 } })
        iniciarCooldownSeLigado()
        agendarLimpezaSinal()
      }
    }
  }, [somAtivo, iniciarCooldownSeLigado, setSinalComRef, agendarLimpezaSinal])

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    ws.onopen = () => setConectado(true)
    ws.onclose = () => setConectado(false)
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.tipo === 'historico_inicial') {
        setHistorico(message.data.resultados || [])
        ultimoResultadoRef.current = Date.now()
        setSiteNaoAberto(false)
      }
      if (message.tipo === 'novo_resultado') {
        setHistorico(prev => { const u = [...prev, message.data]; return u.length > 240 ? u.slice(-240) : u })
        processarResultadoParaGale(message.data)
        ultimoResultadoRef.current = Date.now()
        
        // Conta resultados consecutivos
        resultadosConsecutivosRef.current += 1
        
        // Só esconde banner depois de 2 resultados seguidos (confirma que site tá funcionando)
        if (resultadosConsecutivosRef.current >= 2) {
          setSiteNaoAberto(false)
        }
      }
      if (message.tipo === 'novo_sinal') {
        // Bloqueia se cooldown ativo OU se G1 ainda pendente
        if (cooldownAtivoRef.current) return
        const sinalAtual = sinalAtivoRef.current
        if (sinalAtual && !sinalAtual.confirmado) return  // G1 ou normal ainda pendente!
        
        // Bloqueia sinal se confiança abaixo do threshold (exceto Tie)
        const confiancaSinal = message.data.confianca_final || 0
        const ehTie = message.data.entrada === 'Tie'
        if (!ehTie && confiancaSinal < thresholdMinRef.current) {
          console.log(`Sinal bloqueado: ${confiancaSinal}% < ${thresholdMinRef.current}% (threshold)`)
          return
        }
        
        const sinal = { ...message.data, gale: 0, confirmado: false }
        setSinalAtivo(sinal)
        if (somAtivo) tocarSom('sinal')
        notificarBrowser(`🎯 ${message.data.entrada}`, `${message.data.gatilho_nome} • ${message.data.confianca_final}%`)
      }
      if (message.tipo === 'erro_quota') {
        setModalQuota(message.data.api)
      }
      if (message.tipo === 'gatilhos_atualizados') {
        setStatusIA(message.data)
        setGatilhosDinamicos(message.data.gatilhos || [])
        setGatilhosUsuario(message.data.gatilhos_usuario || [])
        setGatilhosIA(message.data.gatilhos_ia || [])
        setQuotaEsgotada(message.data.gemini_quota_esgotada || false)
        setIaAnalisando(false)
        setPesquisandoPadroes(false)
      }
    }
    return () => ws.close()
  }, [processarResultadoParaGale, somAtivo, wsReconectar])


  // Reconecta WebSocket ao autenticar (para recapturar histórico)
  useEffect(() => {
    if (autenticado) {
      setWsReconectar(prev => prev + 1)  // Força reconexão
      ultimoResultadoRef.current = Date.now()  // Reseta timer
    }
  }, [autenticado])
  // Monitora se está recebendo resultados (site aberto)
  useEffect(() => {
    const interval = setInterval(() => {
      const tempoSemResultado = Date.now() - ultimoResultadoRef.current
      if (tempoSemResultado > 60000) {  // 1 minuto sem resultado
        setSiteNaoAberto(true)
        resultadosConsecutivosRef.current = 0  // Reseta contador
      }
    }, 3000)  // Checa a cada 3 segundos
    
    return () => clearInterval(interval)
  }, [])
  // Limpa histórico ao fechar a aba/navegador
  useEffect(() => {
    const limparAoFechar = async () => {
      try {
        await fetch(`${API_URL}/api/limpar-historico`, { method: 'POST' })
      } catch (e) {
        console.error('Erro ao limpar histórico:', e)
      }
    }
    
    window.addEventListener('beforeunload', limparAoFechar)
    return () => window.removeEventListener('beforeunload', limparAoFechar)
  }, [])

  const confirmarSinalAPI = async (sinalId, resultado, gatilhoNome) => {
    try {
      await fetch(`${API_URL}/api/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sinal_id: sinalId, resultado, gatilho_nome: gatilhoNome })
      })
    } catch {}
  }

  const pesquisarPadroes = async () => {
    if (historico.length < 30) { alert(`Mínimo 30 resultados! (você tem ${historico.length})`); return }
    
    // Apenas pesquisa padrões - NÃO reseta mais o placar!
    setPesquisandoPadroes(true); setIaAnalisando(true)
    try {
      const res = await fetch(`${API_URL}/api/pesquisar-padroes`, { method: 'POST' })
      const data = await res.json()
      if (data.quota_esgotada) { setQuotaEsgotada(true); setGatilhosDinamicos(data.gatilhos || []); setGatilhosIA(data.gatilhos_ia || []); setModalQuota('gemini') }
      else if (data.sucesso) { setGatilhosDinamicos(data.gatilhos || []); setGatilhosUsuario(data.gatilhos_usuario || []); setGatilhosIA(data.gatilhos_ia || []); setQuotaEsgotada(false) }
    } catch {}
    finally { setPesquisandoPadroes(false); setIaAnalisando(false) }
  }

  const totalResultados = historico.length
  const playerWins = historico.filter(r => r.winner === 'Player').length
  const bankerWins = historico.filter(r => r.winner === 'Banker').length
  const empates = historico.filter(r => r.winner === 'Tie').length


  const adicionarGatilhoCustom = async (gatilho) => {
    try {
      const res = await fetch(`${API_URL}/api/gatilhos-usuario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gatilho)
      })
      const data = await res.json()
      if (data.sucesso) {
        setGatilhosUsuario(prev => [...prev, data.gatilho])
      }
    } catch (e) {
      console.error('Erro ao adicionar gatilho:', e)
    }
  }

  const removerGatilho = async (nome) => {
    try {
      await fetch(`${API_URL}/api/gatilhos-usuario/${encodeURIComponent(nome)}`, {
        method: 'DELETE'
      })
      setGatilhosUsuario(prev => prev.filter(g => g.nome !== nome))
    } catch (e) {
      console.error('Erro ao remover gatilho:', e)
    }
  }


  const reiniciarSessao = async () => {
    if (!confirm('Reiniciar sessão? Isso vai zerar o placar e limpar análises da IA, mas manter seus gatilhos configurados.')) {
      return
    }
    
    try {
      const res = await fetch(`${API_URL}/api/reiniciar-sessao`, { method: 'POST' })
      const data = await res.json()
      
      if (!data.sucesso) {
        alert(`❌ Erro: ${data.erro || 'Erro desconhecido'}`)
        return
      }
      
      console.log('📦 Backend retornou:', data)
      console.log('👤 Gatilhos do usuário:', data.gatilhos_usuario?.length || 0)
      console.log('🧠 Gatilhos da IA:', data.gatilhos_ia?.length || 0)
      console.log('📊 Gatilhos dinâmicos:', data.gatilhos?.length || 0)
      
      // Reseta estados
      setSessao({ wins: 0, losses: 0, assertividade: 0 })
      setHistoricoSinais([])
      setSinalComRef(null)
      setQuotaEsgotada(false)
      
      // Atualiza gatilhos DIRETO da resposta HTTP
      setGatilhosUsuario(data.gatilhos_usuario || [])
      setGatilhosIA(data.gatilhos_ia || [])
      setGatilhosDinamicos(data.gatilhos || [])
      
      // Para cooldown
      if (cooldownTimer.current) clearInterval(cooldownTimer.current)
      if (timerResultado.current) clearTimeout(timerResultado.current)
      setCooldownAtivo(false)
      cooldownAtivoRef.current = false
      setCooldownSegundos(0)
      
      alert('✅ Sessão reiniciada! Placar zerado e padrões da IA removidos.')
    } catch (e) {
      console.error('❌ Erro ao reiniciar:', e)
      alert('❌ Erro ao reiniciar sessão')
    }
  }

  // Renderização condicional
  if (!autenticado) {
    return <Login onLogin={() => setAutenticado(true)} />
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white">Carregando BacBo AI</h2>
          <p className="text-gray-400 text-sm mt-1">Gemini + Groq</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {modalQuota && <ModalQuota api={modalQuota} onFechar={() => setModalQuota(null)} />}
      
      {/* Aviso: Site não aberto */}
      {siteNaoAberto && (
        <div className="bg-yellow-500/20 border-b-2 border-yellow-500 px-4 py-3">
          <div className="container mx-auto flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-yellow-400 font-bold text-sm">Site da corretora não detectado!</p>
                <p className="text-yellow-200 text-xs">Abra o jogo BacBo para começar a receber sinais</p>
              </div>
            </div>
            <a 
              href="https://cassino.bet.br/games/evolution/bac-bo"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              🎮 Abrir BacBo
            </a>
          </div>
        </div>
      )}
      
      <Header conectado={conectado} thresholdMin={thresholdMin} setThresholdMin={setThresholdMin} onReiniciarSessao={reiniciarSessao} />
      {mostrarHistorico && <ModalHistorico historico={historicoSinais} onFechar={() => setMostrarHistorico(false)} />}

      <main className="container mx-auto px-4 py-4">

        {/* CARD SINAL — SEMPRE VISÍVEL NO TOPO */}
        <div className="mb-4">
          {sinalAtivo ? (
            <div className={`border rounded-lg p-4 transition-all ${
              sinalAtivo.confirmado
                ? sinalAtivo.resultado === 'win' ? 'bg-green-500/10 border-green-500/40' : 'bg-red-500/10 border-red-500/40'
                : sinalAtivo.gale === 1 ? 'bg-orange-500/10 border-orange-500/60 ring-1 ring-orange-500/40'
                : 'bg-blue-500/10 border-blue-500/30'}`}>

              <div className="flex items-center justify-between">
                {/* Entrada grande */}
                <div className="flex items-center gap-3">
                  <div className={`text-3xl font-bold ${
                    sinalAtivo.entrada === 'Tie' ? 'text-yellow-400' :
                    sinalAtivo.entrada === 'Player' ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {sinalAtivo.entrada === 'Tie' 
                      ? `🟡 TIE ${sinalAtivo.entrada_cor ? (sinalAtivo.entrada_cor === 'Player' ? '+ 🔵' : '+ 🔴') : ''}`
                      : sinalAtivo.entrada === 'Player' ? '🔵 PLAYER' : '🔴 BANKER'
                    }
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {sinalAtivo.confirmado
                        ? sinalAtivo.resultado === 'win' ? '✅ WIN!' : '❌ LOSS!'
                        : sinalAtivo.gale === 1 ? '⚠️ G1 — DOBRAR!' : '🎯 ENTRADA!'}
                    </div>
                    <div className="text-xs text-gray-500">{sinalAtivo.gatilho_nome}</div>
                  </div>
                </div>

                {/* Direita: badge + confiança */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                      sinalAtivo.gale === 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/30 text-orange-300'}`}>
                      {sinalAtivo.gale === 0 ? 'NORMAL' : 'G1'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300 font-bold">
                      {sinalAtivo.confianca_final}%
                    </span>
                  </div>
                  {/* Resultado confirmado */}
                  {sinalAtivo.confirmado && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      sinalAtivo.resultado === 'win' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {sinalAtivo.resultado === 'win'
                        ? `WIN ${sinalAtivo.isTie ? '(Tie)' : sinalAtivo.gale > 0 ? '(G1)' : '(Normal)'}`
                        : 'LOSS (G1)'}
                    </span>
                  )}
                  {/* Aviso G1 pulsando */}
                  {sinalAtivo.gale === 1 && !sinalAtivo.confirmado && (
                    <span className="text-xs text-orange-300 animate-pulse font-bold">⚠️ DOBRAR ENTRADA</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={`border rounded-lg p-3 flex items-center justify-between ${
              cooldownAtivo ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-gray-800/50 border-gray-700'}`}>
              <span className="text-gray-400 text-sm">
                {cooldownAtivo ? '⏱️ Intervalo — próximo sinal em breve'
                 : iaAnalisando ? '🧠 Gemini analisando padrões...'
                 : gatilhosDinamicos.length === 0 ? '⏳ Use "Pesquisar Padrões" para ativar a IA'
                 : '🔍 IA monitorando — aguardando padrão ideal...'}
              </span>
              {cooldownAtivo && (
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-yellow-500 h-full transition-all duration-1000" style={{width:`${(cooldownSegundos/30)*100}%`}} />
                  </div>
                  <span className="text-yellow-400 text-xs font-mono font-bold">{cooldownSegundos}s
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-4">
          <div><SequenciaResultados historico={historico} /></div>

          <div className="space-y-3">

            {/* STATUS + PESQUISAR */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${conectado ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-400">{conectado ? 'Online' : 'Offline'} • {totalResultados} resultados</span>
                </div>
                <div className="flex gap-1">
                  {/* Toggle som */}
                  <button onClick={() => setSomAtivo(!somAtivo)}
                    className={`text-xs px-2 py-1 rounded ${somAtivo ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-gray-700 text-gray-500 border border-gray-600'}`}>
                    {somAtivo ? '🔊' : '🔇'}
                  </button>
                  {/* Toggle cooldown */}
                  <button onClick={() => setCooldownLigado(!cooldownLigado)}
                    title={cooldownLigado ? 'Cooldown ativo (30s)' : 'Cooldown desativado'}
                    className={`text-xs px-2 py-1 rounded ${cooldownLigado ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-gray-700 text-gray-500 border border-gray-600'}`}>
                    {cooldownLigado ? '⏱️ 30s' : '⏱️ OFF'}
                  </button>
                </div>
              </div>

              {quotaEsgotada && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 mb-3">
                  <div className="text-orange-400 text-xs font-bold">⚠️ Gemini quota esgotada hoje</div>
                  <div className="text-orange-300/70 text-xs">Usando lógica manual</div>
                </div>
              )}

              <button onClick={pesquisarPadroes} disabled={pesquisandoPadroes || totalResultados < 30}
                className={`w-full py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                  pesquisandoPadroes ? 'bg-blue-500/50 text-blue-300 cursor-not-allowed'
                  : totalResultados < 30 ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
                {pesquisandoPadroes ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-transparent"></div>
                    🧠 Gemini Analisando...
                  </span>
                ) : totalResultados < 30 ? `🧠 Pesquisar Padrões (${totalResultados}/30)` : '🧠 Pesquisar Padrões'}
              </button>
              <div className="text-xs text-gray-500 mt-2 flex justify-between">
                <span>{quotaEsgotada ? '⚠️ Fallback' : '🧠 Gemini 2.5'}</span>
                <span>⚡ Groq Llama 3.3</span>
              </div>
            </div>

            {/* GATILHOS */}
            <GatilhosDinamicos gatilhos={gatilhosDinamicos} statusIA={statusIA} quotaEsgotada={quotaEsgotada}
            onAdicionarGatilho={adicionarGatilhoCustom}
            onRemoverGatilho={removerGatilho} />

            {/* PLACAR + BOTÃO HISTÓRICO */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-400">📊 SESSÃO</h3>
                <button onClick={() => setMostrarHistorico(true)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded flex items-center gap-1">
                  📋 Histórico
                  {historicoSinais.length > 0 && (
                    <span className="bg-blue-500 text-white rounded-full px-1.5 text-xs font-bold">{historicoSinais.length}</span>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-400">{sessao.wins}</div>
                  <div className="text-xs text-gray-500">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-400">{sessao.losses}</div>
                  <div className="text-xs text-gray-500">Losses</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-400">{sessao.assertividade}%</div>
                  <div className="text-xs text-gray-500">Taxa</div>
                </div>
              </div>
              <div className="text-xs text-gray-600 flex justify-between">
                <span>🔵 P:{playerWins}</span><span>🔴 B:{bankerWins}</span><span>🟡 T:{empates}</span>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default App