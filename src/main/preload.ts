import { contextBridge, ipcRenderer } from 'electron'
import {
  SESSION_GET_ACTIVE,
  SESSION_STARTED,
  SESSION_ENDED,
  SESSION_END_FAILED,
  PARAMETER_LIST_ACTIVE,
  PARAMETER_READINGS,
  CONNECTION_GET_STATE,
  CONNECTION_STATE_CHANGED,
} from '../shared/ipc-channels'
import type { EstadoConexao, PacoteDeLeituras, ParametroDeVoo, Sessao } from '../shared/types'

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

  onSessionEndFailed: (callback: (sessao: Sessao) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, sessao: Sessao): void => {
      callback(sessao)
    }
    ipcRenderer.on(SESSION_END_FAILED, listener)
    return () => {
      ipcRenderer.removeListener(SESSION_END_FAILED, listener)
    }
  },

  listActiveParametros: (): Promise<ParametroDeVoo[]> =>
    ipcRenderer.invoke(PARAMETER_LIST_ACTIVE),

  getConnectionState: (): Promise<EstadoConexao> =>
    ipcRenderer.invoke(CONNECTION_GET_STATE),

  onParameterReadings: (callback: (pacote: PacoteDeLeituras) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, pacote: PacoteDeLeituras): void => {
      callback(pacote)
    }
    ipcRenderer.on(PARAMETER_READINGS, listener)
    return () => {
      ipcRenderer.removeListener(PARAMETER_READINGS, listener)
    }
  },

  onConnectionStateChanged: (callback: (estado: EstadoConexao) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, estado: EstadoConexao): void => {
      callback(estado)
    }
    ipcRenderer.on(CONNECTION_STATE_CHANGED, listener)
    return () => {
      ipcRenderer.removeListener(CONNECTION_STATE_CHANGED, listener)
    }
  },
})
