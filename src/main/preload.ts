import { contextBridge, ipcRenderer } from 'electron'
import { SESSION_GET_ACTIVE, SESSION_STARTED, SESSION_ENDED } from '../shared/ipc-channels'
import type { Sessao } from '../shared/types'

contextBridge.exposeInMainWorld('electronApi', {
  getActiveSessao: (): Promise<Sessao | null> =>
    ipcRenderer.invoke(SESSION_GET_ACTIVE),

  onSessionStarted: (callback: (sessao: Sessao) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, sessao: Sessao): void => {
      callback(sessao)
    }
    ipcRenderer.on(SESSION_STARTED, listener)
    return () => {
      ipcRenderer.removeListener(SESSION_STARTED, listener)
    }
  },

  onSessionEnded: (callback: (sessao: Sessao) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, sessao: Sessao): void => {
      callback(sessao)
    }
    ipcRenderer.on(SESSION_ENDED, listener)
    return () => {
      ipcRenderer.removeListener(SESSION_ENDED, listener)
    }
  },
})
