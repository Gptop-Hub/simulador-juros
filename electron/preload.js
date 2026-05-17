import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('updates', {
  check: () => ipcRenderer.invoke('updates/check'),
  apply: () => ipcRenderer.invoke('updates/apply'),
  getStatus: () => ipcRenderer.invoke('updates/getStatus'),
  onStatus: (callback) => {
    if (typeof callback !== 'function') {
      return () => {}
    }

    const listener = (_event, status) => callback(status)
    ipcRenderer.on('updates/status', listener)

    return () => {
      ipcRenderer.removeListener('updates/status', listener)
    }
  },
})

contextBridge.exposeInMainWorld('appInfo', {
  version: () => ipcRenderer.invoke('app/version'),
})
