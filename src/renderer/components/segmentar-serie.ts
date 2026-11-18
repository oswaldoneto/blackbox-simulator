import { SEM_DADOS_LIMITE_MS } from './limites-de-tempo'

/** Ponto de uma série no tempo: instante em ms UTC e valor. */
export interface PontoNoTempo {
  t: number
  v: number
}

/**
 * Corta uma lista de pontos em ordem de tempo em trechos contínuos, para o desenho mostrar
 * a perda de dados como linha interrompida. Só para o desenho.
 * - Um intervalo maior que `limiteMs` (padrão 2000 ms, usado pelo debriefing, UC-005)
 *   entre duas leituras abre um trecho novo.
 * - `quebra`, opcional, abre um trecho novo também quando devolve verdadeiro para o par
 *   (anterior, atual). O painel de tempo real (UC-002) a usa para quebrar com 2 s ou mais
 *   e na passagem do rumo pelo norte.
 */
export function segmentarPorFalhas<T extends { t: number }>(
  pontos: readonly T[],
  limiteMs: number = SEM_DADOS_LIMITE_MS,
  quebra?: (anterior: T, atual: T) => boolean
): T[][] {
  const trechos: T[][] = []
  let atual: T[] = []
  for (const ponto of pontos) {
    if (atual.length > 0) {
      const anterior = atual[atual.length - 1]
      if (ponto.t - anterior.t > limiteMs || (quebra !== undefined && quebra(anterior, ponto))) {
        trechos.push(atual)
        atual = []
      }
    }
    atual.push(ponto)
  }
  if (atual.length > 0) {
    trechos.push(atual)
  }
  return trechos
}
