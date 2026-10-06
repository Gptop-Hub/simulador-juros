import { useEffect, useMemo, useRef, useState } from 'react'
import './styles.css'
import CalculatorForm from './components/CalculatorForm'
import ResultCards from './components/ResultCards'
import EvolutionChart from './components/EvolutionChart'
import EvolutionTable from './components/EvolutionTable'
import { simulateCompound } from './utils/compoundInterest'
import { formatCurrency } from './utils/formatters'

const WEB_ONLY_STATUS = {
  stage: 'unavailable',
  message: 'Atualizacoes disponiveis apenas no app instalado.',
  progress: 0,
  info: null,
  error: null,
}

const DEFAULT_STATUS = {
  stage: 'idle',
  message: 'Pronto para verificar atualizacoes.',
  progress: 0,
  info: null,
  error: null,
}

const STAGE_LABEL = {
  idle: 'Pronto para verificar.',
  checking: 'Verificando atualizacoes...',
  available: 'Atualizacao encontrada.',
  none: 'Nenhuma atualizacao encontrada.',
  downloading: 'Baixando atualizacao...',
  downloaded: 'Atualizacao pronta para instalar.',
  error: 'Falha ao atualizar.',
  unavailable: 'Atualizacoes disponiveis apenas no app instalado.',
}

function formatRate(value) {
  return Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 4 })
}

function rateUnitLabel(rateType) {
  return rateType === 'annual' ? 'ao ano' : 'ao mes'
}

function periodUnitLabel(periodType) {
  return periodType === 'years' ? 'ano(s)' : 'mes(es)'
}

function buildSummaryText(simulation, userInput) {
  if (!simulation?.final || !userInput) return ''

  return [
    `Valor inicial: ${formatCurrency(userInput.initial)}`,
    `Valor mensal: ${formatCurrency(userInput.monthly)}`,
    `Taxa de juros: ${formatRate(userInput.rate)}% ${rateUnitLabel(userInput.rateType)}`,
    `Periodo: ${userInput.period} ${periodUnitLabel(userInput.periodType)}`,
    `Valor total final: ${formatCurrency(simulation.final.balance)}`,
    `Valor total investido: ${formatCurrency(simulation.final.capital)}`,
    `Total em juros: ${formatCurrency(simulation.final.totalInterest)}`,
  ].join('\n')
}

function App() {
  const [simulation, setSimulation] = useState(null)
  const [lastUserInput, setLastUserInput] = useState(null)
  const [clearSignal, setClearSignal] = useState(0)
  const [actionFeedback, setActionFeedback] = useState('')
  const [appVersion, setAppVersion] = useState('web/dev')
  const [updateStatus, setUpdateStatus] = useState(() => {
    if (typeof window === 'undefined' || !window.updates) {
      return WEB_ONLY_STATUS
    }

    return DEFAULT_STATUS
  })
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false)
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false)
  const feedbackTimerRef = useRef(null)
  const statusText = useMemo(() => {
    return updateStatus.message || STAGE_LABEL[updateStatus.stage] || 'Status indisponivel.'
  }, [updateStatus.message, updateStatus.stage])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lastSimulation')
      if (!raw) return

      const parsed = JSON.parse(raw)

      if (parsed?.simulation && parsed?.userInput) {
        setSimulation(parsed.simulation)
        setLastUserInput(parsed.userInput)
        return
      }

      if (parsed?.final && parsed?.timeline) {
        setSimulation(parsed)
      }
    } catch (error) {
      console.warn('Unable to load previous simulation', error)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    let unsubscribe = null

    async function loadUpdateState() {
      if (!window.updates) {
        if (isMounted) {
          setUpdateStatus(WEB_ONLY_STATUS)
        }
        return
      }

      if (window.appInfo?.version) {
        try {
          const version = await window.appInfo.version()
          if (isMounted && version) {
            setAppVersion(version)
          }
        } catch (error) {
          console.warn('Unable to load app version', error)
        }
      }

      try {
        const currentStatus = await window.updates.getStatus()
        if (isMounted && currentStatus) {
          setUpdateStatus(currentStatus)
        }
      } catch (error) {
        if (isMounted) {
          setUpdateStatus({
            stage: 'error',
            message: 'Falha ao carregar o status de atualizacao.',
            progress: 0,
            info: null,
            error: error?.message ?? String(error),
          })
        }
      }

      unsubscribe = window.updates.onStatus((nextStatus) => {
        if (isMounted && nextStatus) {
          setUpdateStatus(nextStatus)
        }
      })
    }

    loadUpdateState()

    return () => {
      isMounted = false
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  function showFeedback(message) {
    setActionFeedback(message)
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current)
    }
    feedbackTimerRef.current = setTimeout(() => {
      setActionFeedback('')
    }, 2500)
  }

  async function copyToClipboard(text, successMessage) {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API indisponivel.')
      }

      await navigator.clipboard.writeText(text)
      showFeedback(successMessage)
    } catch (error) {
      console.warn('Clipboard not available', error)
      showFeedback('Nao foi possivel copiar.')
    }
  }

  function handleCalculate(payload) {
    const result = simulateCompound(payload.simulationInput)
    setSimulation(result)
    setLastUserInput(payload.userInput)

    try {
      localStorage.setItem(
        'lastSimulation',
        JSON.stringify({
          simulation: result,
          userInput: payload.userInput,
        }),
      )
    } catch (error) {
      console.warn('Unable to persist simulation', error)
    }
  }

  function handleClear() {
    setSimulation(null)
    setLastUserInput(null)
    setClearSignal((current) => current + 1)
    showFeedback('Campos limpos!')

    try {
      localStorage.removeItem('lastSimulation')
    } catch {}
  }

  function handleCopyInterest() {
    if (!simulation?.final) return
    copyToClipboard(formatCurrency(simulation.final.totalInterest), 'Juros copiado!')
  }

  function handleCopyBalance() {
    if (!simulation?.final) return
    copyToClipboard(formatCurrency(simulation.final.balance), 'Valor final copiado!')
  }

  function handleCopySummary() {
    if (!simulation?.final || !lastUserInput) return
    const summary = buildSummaryText(simulation, lastUserInput)
    copyToClipboard(summary, 'Resumo copiado!')
  }

  async function handleCheckUpdates() {
    if (!window.updates?.check) {
      setUpdateStatus(WEB_ONLY_STATUS)
      return
    }

    setIsCheckingUpdates(true)

    try {
      const result = await window.updates.check()
      if (result?.status) {
        setUpdateStatus(result.status)
      }
    } catch (error) {
      setUpdateStatus({
        stage: 'error',
        message: 'Nao foi possivel verificar atualizacoes. Verifique sua conexao com a internet.',
        progress: 0,
        info: null,
        error: error?.message ?? String(error),
      })
    } finally {
      setIsCheckingUpdates(false)
    }
  }

  async function handleApplyUpdate() {
    if (!window.updates?.apply) {
      setUpdateStatus(WEB_ONLY_STATUS)
      return
    }

    setIsApplyingUpdate(true)

    try {
      const result = await window.updates.apply()
      if (result?.status) {
        setUpdateStatus(result.status)
      }
    } catch (error) {
      setUpdateStatus({
        stage: 'error',
        message: 'Falha ao aplicar atualizacao.',
        progress: updateStatus.progress,
        info: updateStatus.info,
        error: error?.message ?? String(error),
      })
    } finally {
      setIsApplyingUpdate(false)
    }
  }

  return (
    <div className="app-container">
      <h1>Simulador de Juros Compostos</h1>

      {actionFeedback && <div className="action-toast">{actionFeedback}</div>}

      <div className="top">
        <CalculatorForm onCalculate={handleCalculate} clearSignal={clearSignal} />
        <ResultCards
          final={simulation?.final}
          onCopyInterest={handleCopyInterest}
          onCopyBalance={handleCopyBalance}
          onCopySummary={handleCopySummary}
          onClear={handleClear}
        />
      </div>

      <EvolutionChart data={simulation?.timeline} periodType={lastUserInput?.periodType} />
      <EvolutionTable data={simulation?.timeline} periodType={lastUserInput?.periodType} />

      <section className="updates-panel">
        <h2 className="card-title">Atualizacoes</h2>
        <p className="updates-line"><strong>Versao atual:</strong> {appVersion}</p>
        <p className="updates-line"><strong>Status:</strong> {statusText}</p>

        {updateStatus.stage === 'downloading' && (
          <div className="updates-progress-wrap">
            <progress max="100" value={Math.round(updateStatus.progress || 0)} className="updates-progress" />
            <span>{Math.round(updateStatus.progress || 0)}%</span>
          </div>
        )}

        {updateStatus.stage === 'none' && (
          <p className="updates-success">Voce ja esta na versao mais recente.</p>
        )}

        {updateStatus.stage === 'error' && (
          <p className="updates-error">{updateStatus.error || 'Erro inesperado ao atualizar.'}</p>
        )}

        {updateStatus.stage === 'unavailable' && (
          <p className="updates-muted">Atualizacoes disponiveis apenas no app instalado.</p>
        )}

        <div className="updates-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCheckUpdates}
            disabled={isCheckingUpdates || updateStatus.stage === 'checking'}
          >
            {isCheckingUpdates || updateStatus.stage === 'checking' ? 'Verificando...' : 'Verificar atualizacao'}
          </button>

          {updateStatus.stage === 'downloaded' && (
            <button type="button" className="btn-primary" onClick={handleApplyUpdate} disabled={isApplyingUpdate}>
              {isApplyingUpdate ? 'Aplicando...' : 'Aplicar e reiniciar'}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

export default App
