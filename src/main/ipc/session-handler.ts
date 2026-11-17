import { ipcMain, BrowserWindow } from 'electron'
import { SESSION_GET_ACTIVE, SESSION_STARTED, SESSION_ENDED } from '../../shared/ipc-channels'
import { buscarSessaoAtiva } from '../db/session-repository'
import type { Sessao } from '../../shared/types'

export function registerSessionHandlers(_getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(SESSION_GET_ACTIVE, (): Sessao | null => {
    return buscarSessaoAtiva()
  })
}

export function emitSessionStarted(
  getWindow: () => BrowserWindow | null,
  sessao: Sessao
): void {
  const win = getWindow()
  if (win !== null && !win.isDestroyed()) {
    win.webContents.send(SESSION_STARTED, sessao)
  }
}

export function emitSessionEnded(
  getWindow: () => BrowserWindow | null,
  sessao: Sessao
): void {
  const win = getWindow()
  if (win !== null && !win.isDestroyed()) {
    win.webContents.send(SESSION_ENDED, sessao)
  }
}
