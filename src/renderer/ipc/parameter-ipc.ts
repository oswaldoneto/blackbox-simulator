import type { PacoteDeLeituras, ParametroDeVoo } from '../../shared/types'

export function listActiveParametros(): Promise<ParametroDeVoo[]> {
  return window.electronApi.listActiveParametros()
}

export function onParameterReadings(callback: (pacote: PacoteDeLeituras) => void): () => void {
  return window.electronApi.onParameterReadings(callback)
}
