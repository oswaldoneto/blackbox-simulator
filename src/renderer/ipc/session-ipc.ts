import type { Sessao } from '../../shared/types'

export function getActiveSessao(): Promise<Sessao | null> {
  return window.electronApi.getActiveSessao()
}

/** Sessões encerradas, da mais recente para a mais antiga (UC-004). */
export function listSessoesEncerradas(): Promise<Sessao[]> {
  return window.electronApi.listSessoesEncerradas()
}

export function onSessionStarted(callback: (sessao: Sessao) => void): () => void {
  return window.electronApi.onSessionStarted(callback)
}

export function onSessionEnded(callback: (sessao: Sessao) => void): () => void {
  return window.electronApi.onSessionEnded(callback)
}

export function onSessionEndFailed(callback: (sessao: Sessao) => void): () => void {
  return window.electronApi.onSessionEndFailed(callback)
}
