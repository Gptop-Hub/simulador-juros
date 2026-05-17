import path from 'path'
import { fileURLToPath } from 'url'
import { app, BrowserWindow, ipcMain } from 'electron'
import electronUpdater from 'electron-updater'

const { autoUpdater } = electronUpdater
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
let mainWindow = null
let isCheckingForUpdates = false
let updaterInitialized = false

function buildInitialUpdateStatus() {
  if (!app.isPackaged) {
    return {
      stage: 'unavailable',
      message: 'Atualizacoes disponiveis apenas no app instalado.',
      progress: 0,
      info: null,
      error: null,
    }
  }

  return {
    stage: 'idle',
    message: 'Pronto para verificar atualizacoes.',
    progress: 0,
    info: null,
    error: null,
  }
}

let updateStatus = buildInitialUpdateStatus()

function createWindow() {
  const win = new BrowserWindow({
    width: 1080,
    height: 820,
    minWidth: 860,
    minHeight: 640,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow = win

  win.once('ready-to-show', () => win.show())
  win.webContents.on('did-finish-load', () => {
    sendUpdateStatus()
  })
  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null
    }
  })

  if (!app.isPackaged) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  return win
}

function serializeError(error) {
  if (!error) return null
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function sendUpdateStatus() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updates/status', updateStatus)
  }
}

function setUpdateStatus(nextStatus) {
  updateStatus = {
    ...updateStatus,
    ...nextStatus,
  }
  sendUpdateStatus()
}

function initializeAutoUpdater() {
  if (updaterInitialized || !app.isPackaged) {
    return
  }

  updaterInitialized = true
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('checking-for-update', () => {
    setUpdateStatus({
      stage: 'checking',
      message: 'Verificando atualizacoes...',
      progress: 0,
      error: null,
    })
  })

  autoUpdater.on('update-available', (info) => {
    const versionText = info?.version ? ` ${info.version}` : ''
    setUpdateStatus({
      stage: 'available',
      message: `Atualizacao${versionText} encontrada. Iniciando download...`,
      progress: 0,
      info: info ?? null,
      error: null,
    })
  })

  autoUpdater.on('update-not-available', (info) => {
    setUpdateStatus({
      stage: 'none',
      message: 'Nenhuma atualizacao disponivel no momento.',
      progress: 0,
      info: info ?? null,
      error: null,
    })
  })

  autoUpdater.on('download-progress', (progressInfo) => {
    const percent = Number(progressInfo?.percent || 0)
    const safePercent = Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0

    setUpdateStatus({
      stage: 'downloading',
      message: `Baixando atualizacao... ${safePercent.toFixed(1)}%`,
      progress: safePercent,
      info: progressInfo ?? null,
      error: null,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    setUpdateStatus({
      stage: 'downloaded',
      message: 'Atualizacao pronta para instalar.',
      progress: 100,
      info: info ?? null,
      error: null,
    })
  })

  autoUpdater.on('error', (error) => {
    const serializedError = serializeError(error)
    const normalizedError = serializedError?.toLowerCase() || ''
    const isConnectivityError = normalizedError.includes('network')
      || normalizedError.includes('internet')
      || normalizedError.includes('econn')
      || normalizedError.includes('timeout')
    const errorMessage = isConnectivityError
      ? 'Nao foi possivel verificar atualizacoes. Verifique a conexao com a internet.'
      : 'Falha durante a atualizacao.'

    setUpdateStatus({
      stage: 'error',
      message: errorMessage,
      error: serializedError,
    })

    console.error('Auto updater error:', error)
  })
}

async function checkForUpdatesSafely() {
  if (!app.isPackaged) {
    setUpdateStatus({
      stage: 'unavailable',
      message: 'Atualizacoes disponiveis apenas no app instalado.',
      progress: 0,
      info: null,
      error: null,
    })

    return {
      ok: false,
      reason: 'unavailable',
      status: updateStatus,
    }
  }

  if (isCheckingForUpdates) {
    return {
      ok: false,
      reason: 'already-checking',
      status: updateStatus,
    }
  }

  isCheckingForUpdates = true

  try {
    await autoUpdater.checkForUpdates()
    return {
      ok: true,
      status: updateStatus,
    }
  } catch (error) {
    const serializedError = serializeError(error)

    setUpdateStatus({
      stage: 'error',
      message: 'Falha ao verificar atualizacoes.',
      error: serializedError,
      progress: 0,
    })

    return {
      ok: false,
      reason: 'error',
      error: serializedError,
      status: updateStatus,
    }
  } finally {
    isCheckingForUpdates = false
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.whenReady().then(() => {
  createWindow()

  if (app.isPackaged) {
    initializeAutoUpdater()
    checkForUpdatesSafely()
  } else {
    setUpdateStatus({
      stage: 'unavailable',
      message: 'Atualizacoes disponiveis apenas no app instalado.',
      progress: 0,
      info: null,
      error: null,
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

ipcMain.handle('updates/check', async () => checkForUpdatesSafely())

ipcMain.handle('updates/apply', async () => {
  if (!app.isPackaged) {
    return {
      ok: false,
      reason: 'unavailable',
      status: updateStatus,
    }
  }

  if (updateStatus.stage !== 'downloaded') {
    return {
      ok: false,
      reason: 'not-ready',
      status: updateStatus,
    }
  }

  try {
    autoUpdater.quitAndInstall(false, true)
    return { ok: true }
  } catch (error) {
    const serializedError = serializeError(error)
    setUpdateStatus({
      stage: 'error',
      message: 'Falha ao aplicar atualizacao.',
      error: serializedError,
    })

    return {
      ok: false,
      reason: 'error',
      error: serializedError,
      status: updateStatus,
    }
  }
})

ipcMain.handle('updates/getStatus', () => updateStatus)
ipcMain.handle('app/version', () => app.getVersion())
