import type { SerieDeLeituras } from '../../../shared/types'

/** Tamanho do `viewBox` do mapa da trajetória. */
export const MAPA_LARGURA = 1000
export const MAPA_ALTURA = 700

/** Área útil do desenho, centrada no `viewBox`, com margem para a aeronave e o norte. */
const AREA_LARGURA = 860
const AREA_ALTURA = 580

/** Posição gravada num instante: latitude e longitude do mesmo ciclo de coleta. */
export interface Posicao {
  t: number
  lat: number
  lon: number
}

export interface PontoNoMapa {
  x: number
  y: number
}

/**
 * Junta latitude e longitude pelo instante (UC-005): só formam posição as leituras dos dois
 * parâmetros com o mesmo `timestamp` (as leituras de um ciclo dividem o mesmo instante).
 * Valores não finitos são descartados. Sem uma das séries, não há posição.
 */
export function paresDePosicao(
  latitude: SerieDeLeituras | undefined,
  longitude: SerieDeLeituras | undefined
): Posicao[] {
  if (latitude === undefined || longitude === undefined) {
    return []
  }
  const pares: Posicao[] = []
  let i = 0
  let j = 0
  while (i < latitude.instantes.length && j < longitude.instantes.length) {
    const tLat = latitude.instantes[i]
    const tLon = longitude.instantes[j]
    if (tLat < tLon) {
      i += 1
    } else if (tLon < tLat) {
      j += 1
    } else {
      const lat = latitude.valores[i]
      const lon = longitude.valores[j]
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        pares.push({ t: tLat, lat, lon })
      }
      i += 1
      j += 1
    }
  }
  return pares
}

/**
 * Projeção equiretangular da trajetória inteira no `viewBox` de 1000×700 (UC-005): norte
 * para cima, longitude multiplicada pelo cosseno da latitude média e escala única nos dois
 * eixos, centrada. Um ponto único fica no centro; um eixo constante fica centrado nesse
 * eixo. Sem posições, devolve sempre o centro.
 */
export function criarProjecao(posicoes: readonly Posicao[]): (lat: number, lon: number) => PontoNoMapa {
  const centro: PontoNoMapa = { x: MAPA_LARGURA / 2, y: MAPA_ALTURA / 2 }
  if (posicoes.length === 0) {
    return () => centro
  }
  let minLat = Infinity
  let maxLat = -Infinity
  let minLon = Infinity
  let maxLon = -Infinity
  for (const p of posicoes) {
    if (p.lat < minLat) minLat = p.lat
    if (p.lat > maxLat) maxLat = p.lat
    if (p.lon < minLon) minLon = p.lon
    if (p.lon > maxLon) maxLon = p.lon
  }
  const fatorLon = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
  const largura = (maxLon - minLon) * fatorLon
  const altura = maxLat - minLat
  const escalaX = largura > 0 ? AREA_LARGURA / largura : Infinity
  const escalaY = altura > 0 ? AREA_ALTURA / altura : Infinity
  const escala = Math.min(escalaX, escalaY)
  if (!Number.isFinite(escala)) {
    return () => centro
  }
  const origemX = (MAPA_LARGURA - largura * escala) / 2
  const origemY = (MAPA_ALTURA - altura * escala) / 2
  return (lat: number, lon: number): PontoNoMapa => ({
    x: origemX + (lon - minLon) * fatorLon * escala,
    y: origemY + (maxLat - lat) * escala,
  })
}
