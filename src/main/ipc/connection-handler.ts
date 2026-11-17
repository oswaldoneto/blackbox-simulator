import { ipcMain, BrowserWindow } from 'electron'
import { CONNECTION_GET_STATE, CONNECTION_STATE_CHANGED } from '../../shared/ipc-channels'
import type { EstadoConexao } from '../../shared/types'

export function registerConnectionHandlers(getEstadoConexao: () => EstadoConexao): void {
  ipcMain.handle(CONNECTION_GET_STATE, (): EstadoConexao => {
    return getEstadoConexao()
  })
}

export function emitConnectionState(
  getWindow: () => BrowserWindow | null,
  estado: EstadoConexao
): void {
  const win = getWindow()
  if (win !== null && !win.isDestroyed()) {
    win.webContents.send(CONNECTION_STATE_CHANGED, estado)
  }
}
