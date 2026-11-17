import type { EstadoConexao, PacoteDeLeituras, ParametroDeVoo, Sessao } from '../shared/types'

export interface ElectronApi {
  getActiveSessao: () => Promise<Sessao | null>
  onSessionStarted: (callback: (sessao: Sessao) => void) => () => void
  onSessionEnded: (callback: (sessao: Sessao) => void) => () => void
  onSessionEndFailed: (callback: (sessao: Sessao) => void) => () => void
  listActiveParametros: () => Promise<ParametroDeVoo[]>
  getConnectionState: () => Promise<EstadoConexao>
  onParameterReadings: (callback: (pacote: PacoteDeLeituras) => void) => () => void
  onConnectionStateChanged: (callback: (estado: EstadoConexao) => void) => () => void
}

declare global {
  interface Window {
    electronApi: ElectronApi
  }
}
