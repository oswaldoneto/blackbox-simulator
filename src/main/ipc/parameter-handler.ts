import { ipcMain, BrowserWindow } from 'electron'
import { PARAMETER_LIST_ACTIVE, PARAMETER_READINGS } from '../../shared/ipc-channels'
import { buscarParametrosAtivos } from '../db/parameter-repository'
import type { PacoteDeLeituras, ParametroDeVoo } from '../../shared/types'

export function registerParameterHandlers(): void {
  ipcMain.handle(PARAMETER_LIST_ACTIVE, (): ParametroDeVoo[] => {
    return buscarParametrosAtivos()
  })
}

export function emitParameterReadings(
  getWindow: () => BrowserWindow | null,
  pacote: PacoteDeLeituras
): void {
  const win = getWindow()
  if (win !== null && !win.isDestroyed()) {
    win.webContents.send(PARAMETER_READINGS, pacote)
  }
}
