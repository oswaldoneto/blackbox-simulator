import type { Sessao } from '../../shared/types'

export function getActiveSessao(): Promise<Sessao | null> {
  return window.electronApi.getActiveSessao()
}

export function onSessionStarted(callback: (sessao: Sessao) => void): () => void {
  return window.electronApi.onSessionStarted(callback)
}

export function onSessionEnded(callback: (sessao: Sessao) => void): () => void {
  return window.electronApi.onSessionEnded(callback)
}
