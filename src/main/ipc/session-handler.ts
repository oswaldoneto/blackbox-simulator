import { ipcMain, BrowserWindow } from 'electron'
import {
  SESSION_GET_ACTIVE,
  SESSION_STARTED,
  SESSION_ENDED,
  SESSION_END_FAILED,
} from '../../shared/ipc-channels'
import type { Sessao } from '../../shared/types'

/**
 * `session:get-active` responde com a sessão ativa na memória do main (não lê o banco):
 * uma sessão restaurada ainda em verificação na abertura não é devolvida.
 */
export function registerSessionHandlers(getSessaoAtual: () => Sessao | null): void {
  ipcMain.handle(SESSION_GET_ACTIVE, (): Sessao | null => {
    return getSessaoAtual()
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

export function emitSessionEndFailed(
  getWindow: () => BrowserWindow | null,
  sessao: Sessao
): void {
  const win = getWindow()
  if (win !== null && !win.isDestroyed()) {
    win.webContents.send(SESSION_END_FAILED, sessao)
  }
}
