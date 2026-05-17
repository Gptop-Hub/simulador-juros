import { useEffect, useMemo, useState } from 'react'
import './styles.css'
import CalculatorForm from './components/CalculatorForm'
import ResultCards from './components/ResultCards'
import EvolutionChart from './components/EvolutionChart'
import EvolutionTable from './components/EvolutionTable'
import { simulateCompound } from './utils/compoundInterest'

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

function App() {
  const [simulation, setSimulation] = useState(null)
  const [appVersion, setAppVersion] = useState('web/dev')
  const [updateStatus, setUpdateStatus] = useState(() => {
    if (typeof window === 'undefined' || !window.updates) {
      return WEB_ONLY_STATUS
    }

    return DEFAULT_STATUS
  })
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false)
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false)
  const statusText = useMemo(() => {
    return updateStatus.message || STAGE_LABEL[updateStatus.stage] || 'Status indisponivel.'
  }, [updateStatus.message, updateStatus.stage])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lastSimulation')
      if (raw) setSimulation(JSON.parse(raw))
    } catch (e) {
      /* ignore */
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

  function handleCalculate(params) {
    const result = simulateCompound(params)
    setSimulation(result)
    try {
      localStorage.setItem('lastSimulation', JSON.stringify(result))
    } catch (e) {
      /* ignore */
    }
  }

  function handleCopy(text) {
    try {
      navigator.clipboard.writeText(String(text))
    } catch (e) {
      console.warn('Clipboard not available', e)
    }
  }

  function handleClear() {
    setSimulation(null)
    try {
      localStorage.removeItem('lastSimulation')
    } catch (e) {}
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

      <div className="top">
        <CalculatorForm onCalculate={handleCalculate} />
        <ResultCards final={simulation?.final} onCopyInterest={() => handleCopy(simulation?.final?.totalInterest)} onCopyBalance={() => handleCopy(simulation?.final?.balance)} onClear={handleClear} />
      </div>

      <EvolutionChart data={simulation?.timeline} />
      <EvolutionTable data={simulation?.timeline} />

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
