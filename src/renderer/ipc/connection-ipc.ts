import type { EstadoConexao } from '../../shared/types'

export function getConnectionState(): Promise<EstadoConexao> {
  return window.electronApi.getConnectionState()
}

export function onConnectionStateChanged(callback: (estado: EstadoConexao) => void): () => void {
  return window.electronApi.onConnectionStateChanged(callback)
}
