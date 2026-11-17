import { describe, it, expect } from 'vitest'
import { paresDePosicao, criarProjecao, MAPA_LARGURA, MAPA_ALTURA } from './projecao-trajetoria'
import type { Posicao } from './projecao-trajetoria'
import { PARAMETER_IDS } from '../../../shared/parameter-ids'
import type { SerieDeLeituras } from '../../../shared/types'

function serie(
  parametroId: SerieDeLeituras['parametroId'],
  instantes: number[],
  valores: number[]
): SerieDeLeituras {
  return { parametroId, instantes, valores }
}

// CA-005-2, CA-005-9: posição pelo instante
describe('paresDePosicao', () => {
  it('deve juntar latitude e longitude do mesmo instante', () => {
    const lat = serie(PARAMETER_IDS.LATITUDE, [1, 2, 4], [-23, -23.1, -23.3])
    const lon = serie(PARAMETER_IDS.LONGITUDE, [1, 3, 4], [-46, -46.2, -46.3])
    expect(paresDePosicao(lat, lon)).toEqual([
      { t: 1, lat: -23, lon: -46 },
      { t: 4, lat: -23.3, lon: -46.3 },
    ])
  })

  it('deve devolver lista vazia sem uma das séries (só latitude)', () => {
    const lat = serie(PARAMETER_IDS.LATITUDE, [1], [-23])
    expect(paresDePosicao(lat, undefined)).toEqual([])
    expect(paresDePosicao(undefined, undefined)).toEqual([])
  })

  it('deve descartar valores não finitos', () => {
    const lat = serie(PARAMETER_IDS.LATITUDE, [1, 2], [NaN, -23])
    const lon = serie(PARAMETER_IDS.LONGITUDE, [1, 2], [-46, Infinity])
    expect(paresDePosicao(lat, lon)).toEqual([])
  })
})

function semNaN(ponto: { x: number; y: number }): boolean {
  return Number.isFinite(ponto.x) && Number.isFinite(ponto.y)
}

// CA-005-5: norte para cima, escala única, sem NaN
describe('criarProjecao', () => {
  const centro = { x: MAPA_LARGURA / 2, y: MAPA_ALTURA / 2 }

  it('deve devolver o centro sem posições', () => {
    expect(criarProjecao([])(-23, -46)).toEqual(centro)
  })

  it('deve pôr um ponto único no centro, sem NaN', () => {
    const projetar = criarProjecao([{ t: 0, lat: -23, lon: -46 }])
    expect(projetar(-23, -46)).toEqual(centro)
  })

  it('deve centrar o eixo constante (voo só para o norte), sem NaN', () => {
    const posicoes: Posicao[] = [
      { t: 0, lat: -23, lon: -46 },
      { t: 1, lat: -22, lon: -46 },
    ]
    const projetar = criarProjecao(posicoes)
    const sul = projetar(-23, -46)
    const norte = projetar(-22, -46)
    expect(semNaN(sul) && semNaN(norte)).toBe(true)
    expect(sul.x).toBeCloseTo(MAPA_LARGURA / 2)
    expect(norte.x).toBeCloseTo(MAPA_LARGURA / 2)
    expect(norte.y).toBeLessThan(sul.y)
  })

  it('deve pôr o norte para cima e o leste à direita', () => {
    const posicoes: Posicao[] = [
      { t: 0, lat: 0, lon: 0 },
      { t: 1, lat: 1, lon: 1 },
    ]
    const projetar = criarProjecao(posicoes)
    const so = projetar(0, 0)
    const ne = projetar(1, 1)
    expect(ne.y).toBeLessThan(so.y)
    expect(ne.x).toBeGreaterThan(so.x)
  })

  it('deve usar a mesma escala nos dois eixos, com a longitude reduzida pelo cosseno da latitude média', () => {
    const posicoes: Posicao[] = [
      { t: 0, lat: 59, lon: 10 },
      { t: 1, lat: 61, lon: 14 },
    ]
    const projetar = criarProjecao(posicoes)
    const a = projetar(59, 10)
    const b = projetar(61, 14)
    const dx = b.x - a.x
    const dy = a.y - b.y
    const esperado = (4 * Math.cos((60 * Math.PI) / 180)) / 2
    expect(dx / dy).toBeCloseTo(esperado, 6)
  })

  it('deve caber no viewBox e ficar centrada', () => {
    const posicoes: Posicao[] = [
      { t: 0, lat: -23.5, lon: -46.7 },
      { t: 1, lat: -22.9, lon: -43.2 },
      { t: 2, lat: -23.0, lon: -45.0 },
    ]
    const projetar = criarProjecao(posicoes)
    const pontos = posicoes.map((x) => projetar(x.lat, x.lon))
    for (const ponto of pontos) {
      expect(semNaN(ponto)).toBe(true)
      expect(ponto.x).toBeGreaterThanOrEqual(0)
      expect(ponto.x).toBeLessThanOrEqual(MAPA_LARGURA)
      expect(ponto.y).toBeGreaterThanOrEqual(0)
      expect(ponto.y).toBeLessThanOrEqual(MAPA_ALTURA)
    }
    const xs = pontos.map((x) => x.x)
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(MAPA_LARGURA / 2)
    const ys = pontos.map((x) => x.y)
    expect((Math.min(...ys) + Math.max(...ys)) / 2).toBeCloseTo(MAPA_ALTURA / 2)
  })
})
