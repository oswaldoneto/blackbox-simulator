import { describe, it, expect } from 'vitest'
import { pontosDaSerie, reduzirSegmento, VALOR_DO_PONTO } from './reduzir-pontos'
import type { PontoNoTempo } from '../../components/segmentar-serie'

function p(t: number, v: number): PontoNoTempo {
  return { t, v }
}

describe('pontosDaSerie', () => {
  it('deve juntar instantes e valores, cortando no menor tamanho', () => {
    expect(pontosDaSerie([1, 2, 3], [10, 20])).toEqual([p(1, 10), p(2, 20)])
  })
})

// CA-005-6: mínimos e máximos preservados na redução
describe('reduzirSegmento', () => {
  it('deve devolver cópia sem reduzir com até 2 pontos ou balde inválido', () => {
    const dois = [p(0, 1), p(1, 2)]
    expect(reduzirSegmento(dois, 100, [VALOR_DO_PONTO])).toEqual(dois)
    expect(reduzirSegmento(dois, 100, [VALOR_DO_PONTO])).not.toBe(dois)
    const tres = [p(0, 1), p(1, 2), p(2, 3)]
    expect(reduzirSegmento(tres, 0, [VALOR_DO_PONTO])).toEqual(tres)
    expect(reduzirSegmento(tres, NaN, [VALOR_DO_PONTO])).toEqual(tres)
  })

  it('deve guardar a primeira, a mínima, a máxima e a última de cada balde, na ordem do tempo', () => {
    const segmento = [p(0, 5), p(1, 9), p(2, 1), p(3, 4), p(4, 6)]
    expect(reduzirSegmento(segmento, 1000, [VALOR_DO_PONTO])).toEqual([
      p(0, 5),
      p(1, 9),
      p(2, 1),
      p(4, 6),
    ])
  })

  it('deve preservar o máximo e o mínimo global de um voo longo e reduzir os pontos', () => {
    // 3 h a 1 Hz com um pico e um vale isolados.
    const segmento: PontoNoTempo[] = []
    for (let s = 0; s < 3 * 3600; s += 1) {
      segmento.push(p(s * 1000, 3000 + Math.sin(s / 60) * 100))
    }
    segmento[4321] = p(4321 * 1000, 9999)
    segmento[7777] = p(7777 * 1000, -50)

    const reduzido = reduzirSegmento(segmento, 60_000, [VALOR_DO_PONTO])

    expect(reduzido.length).toBeLessThan(segmento.length / 10)
    expect(Math.max(...reduzido.map((x) => x.v))).toBe(9999)
    expect(Math.min(...reduzido.map((x) => x.v))).toBe(-50)
    expect(reduzido[0]).toBe(segmento[0])
    expect(reduzido[reduzido.length - 1]).toBe(segmento[segmento.length - 1])
    const tempos = reduzido.map((x) => x.t)
    expect(tempos).toEqual([...tempos].sort((a, b) => a - b))
  })

  it('deve preservar os extremos de cada medida quando há mais de uma', () => {
    const segmento = [
      { t: 0, a: 0, b: 0 },
      { t: 1, a: 10, b: 0 },
      { t: 2, a: 0, b: -10 },
      { t: 3, a: 0, b: 0 },
      { t: 4, a: 0, b: 0 },
    ]
    const reduzido = reduzirSegmento(segmento, 1000, [(x) => x.a, (x) => x.b])
    expect(reduzido.map((x) => x.t)).toEqual([0, 1, 2, 4])
  })
})
