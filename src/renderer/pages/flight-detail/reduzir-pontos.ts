import { SEM_DADOS_LIMITE_MS } from '../../components/limites-de-tempo'

/** Ponto de uma série no tempo: instante em ms UTC e valor gravado. */
export interface PontoNoTempo {
  t: number
  v: number
}

/**
 * Corta uma lista de pontos em ordem de tempo em trechos contínuos (UC-005): um intervalo
 * maior que `limiteMs` (2000 ms) entre duas leituras abre um trecho novo, para o desenho
 * mostrar a perda de dados como linha interrompida. Só para o desenho.
 */
export function segmentarPorFalhas<T extends { t: number }>(
  pontos: readonly T[],
  limiteMs: number = SEM_DADOS_LIMITE_MS
): T[][] {
  const trechos: T[][] = []
  let atual: T[] = []
  for (const ponto of pontos) {
    if (atual.length > 0 && ponto.t - atual[atual.length - 1].t > limiteMs) {
      trechos.push(atual)
      atual = []
    }
    atual.push(ponto)
  }
  if (atual.length > 0) {
    trechos.push(atual)
  }
  return trechos
}

/** Junta instantes e valores de uma série em pontos. */
export function pontosDaSerie(instantes: readonly number[], valores: readonly number[]): PontoNoTempo[] {
  const total = Math.min(instantes.length, valores.length)
  const pontos: PontoNoTempo[] = new Array<PontoNoTempo>(total)
  for (let i = 0; i < total; i += 1) {
    pontos[i] = { t: instantes[i], v: valores[i] }
  }
  return pontos
}

/**
 * Reduz um trecho contínuo para o desenho (UC-005): divide o trecho em baldes de
 * `baldeMs` e guarda, de cada balde, a primeira leitura, a de menor e a de maior valor de
 * cada medida e a última, na ordem do tempo. Máximos e mínimos são preservados. Os
 * valores exibidos nos instrumentos não passam por aqui.
 */
export function reduzirSegmento<T extends { t: number }>(
  segmento: readonly T[],
  baldeMs: number,
  medidas: ReadonlyArray<(ponto: T) => number>
): T[] {
  if (segmento.length <= 2 || !(baldeMs > 0)) {
    return [...segmento]
  }
  const inicio = segmento[0].t
  const resultado: T[] = []
  let i = 0
  while (i < segmento.length) {
    const balde = Math.floor((segmento[i].t - inicio) / baldeMs)
    let fim = i
    while (fim + 1 < segmento.length && Math.floor((segmento[fim + 1].t - inicio) / baldeMs) === balde) {
      fim += 1
    }
    const escolhidos = new Set<number>([i, fim])
    for (const medida of medidas) {
      let menor = i
      let maior = i
      for (let k = i + 1; k <= fim; k += 1) {
        const valor = medida(segmento[k])
        if (valor < medida(segmento[menor])) menor = k
        if (valor > medida(segmento[maior])) maior = k
      }
      escolhidos.add(menor)
      escolhidos.add(maior)
    }
    for (const indice of [...escolhidos].sort((a, b) => a - b)) {
      resultado.push(segmento[indice])
    }
    i = fim + 1
  }
  return resultado
}

/** Valor de um ponto no tempo, para `reduzirSegmento`. */
export const VALOR_DO_PONTO = (ponto: PontoNoTempo): number => ponto.v
