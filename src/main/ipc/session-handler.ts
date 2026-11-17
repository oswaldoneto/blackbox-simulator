import { ipcMain, BrowserWindow } from 'electron'
import {
  SESSION_GET_ACTIVE,
  SESSION_LIST_ENDED,
  SESSION_GET_READINGS,
  SESSION_STARTED,
  SESSION_ENDED,
  SESSION_END_FAILED,
} from '../../shared/ipc-channels'
import { listarSessoesEncerradas } from '../db/session-repository'
import { listarLeiturasDoVoo } from '../db/reading-repository'
import type { LeiturasDoVoo, Sessao } from '../../shared/types'

/**
 * `session:get-active` responde com a sessão ativa na memória do main (não lê o banco):
 * uma sessão restaurada ainda em verificação na abertura não é devolvida.
 * `session:list-ended` lê do banco as sessões encerradas (UC-004); numa falha, loga e
 * rejeita a chamada, para o renderer mostrar o erro.
 * `session:get-readings` lê do banco as leituras de um voo encerrado (UC-005), a cada
 * chamada, sem cache. Valida o `sessaoId`; numa falha, loga e rejeita a chamada.
 */
export function registerSessionHandlers(getSessaoAtual: () => Sessao | null): void {
  ipcMain.handle(SESSION_GET_ACTIVE, (): Sessao | null => {
    return getSessaoAtual()
  })

  ipcMain.handle(SESSION_LIST_ENDED, (): Sessao[] => {
    try {
      return listarSessoesEncerradas()
    } catch (erro: unknown) {
      console.error('[SessionHandler] Falha ao listar as sessões encerradas:', erro)
      throw erro
    }
  })

  ipcMain.handle(SESSION_GET_READINGS, (_event: unknown, sessaoId: unknown): LeiturasDoVoo => {
    if (typeof sessaoId !== 'string' || sessaoId === '') {
      const erro = new Error('sessaoId inválido ao buscar as leituras do voo')
      console.error('[SessionHandler] Falha ao buscar as leituras do voo:', erro)
      throw erro
    }
    try {
      const inicio = performance.now()
      const leituras = listarLeiturasDoVoo(sessaoId)
      // Medição do voo longo (risco da 1.2 do loop-006): o main fica bloqueado durante a consulta.
      const total = leituras.series.reduce((soma, serie) => soma + serie.instantes.length, 0)
      console.info(
        `[SessionHandler] Leituras do voo ${sessaoId}: ${total} em ${Math.round(performance.now() - inicio)} ms`
      )
      return leituras
    } catch (erro: unknown) {
      console.error('[SessionHandler] Falha ao buscar as leituras do voo:', erro)
      throw erro
    }
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
