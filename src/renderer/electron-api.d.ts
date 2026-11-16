import type { Sessao } from '../shared/types'

export interface ElectronApi {
  getActiveSessao: () => Promise<Sessao | null>
  onSessionStarted: (callback: (sessao: Sessao) => void) => () => void
  onSessionEnded: (callback: (sessao: Sessao) => void) => () => void
}

declare global {
  interface Window {
    electronApi: ElectronApi
  }
}
