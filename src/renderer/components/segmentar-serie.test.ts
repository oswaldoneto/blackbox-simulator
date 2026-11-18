import { describe, it, expect } from 'vitest'
import { segmentarPorFalhas } from './segmentar-serie'
import type { PontoNoTempo } from './segmentar-serie'

function p(t: number, v: number): PontoNoTempo {
  return { t, v }
}

describe('segmentarPorFalhas', () => {
  describe('padrão do debriefing (regressão do UC-005, CA-005-8)', () => {
    it('deve manter num trecho só um intervalo de exatamente 2000 ms', () => {
      const pontos = [p(0, 1), p(2000, 2)]
      expect(segmentarPorFalhas(pontos)).toEqual([pontos])
    })

    it('deve abrir trecho novo num intervalo de 2001 ms', () => {
      expect(segmentarPorFalhas([p(0, 1), p(2001, 2)])).toEqual([[p(0, 1)], [p(2001, 2)]])
    })

    it('não deve chamar quebra nenhuma quando ela não é passada', () => {
      const pontos = [p(0, 350), p(1000, 10)]
      expect(segmentarPorFalhas(pontos)).toEqual([pontos])
    })

    it('deve devolver lista vazia sem pontos', () => {
      expect(segmentarPorFalhas([])).toEqual([])
    })

    it('deve manter num trecho só intervalos de até 2000 ms', () => {
      const pontos = [p(0, 1), p(1000, 2), p(3000, 3)]
      expect(segmentarPorFalhas(pontos)).toEqual([pontos])
    })

    it('deve abrir um trecho novo a cada intervalo maior que 2000 ms', () => {
      const pontos = [p(0, 1), p(1000, 2), p(3001, 3), p(4000, 4), p(10_000, 5)]
      expect(segmentarPorFalhas(pontos)).toEqual([
        [p(0, 1), p(1000, 2)],
        [p(3001, 3), p(4000, 4)],
        [p(10_000, 5)],
      ])
    })

    it('deve aceitar outro limite', () => {
      expect(segmentarPorFalhas([p(0, 1), p(600, 2)], 500)).toHaveLength(2)
    })
  })

  describe('quebra própria (painel, UC-002)', () => {
    it('deve abrir trecho novo quando a quebra devolve verdadeiro', () => {
      const pontos = [p(0, 350), p(1000, 355), p(2000, 5), p(3000, 10)]
      const quebra = (a: PontoNoTempo, b: PontoNoTempo): boolean => Math.abs(b.v - a.v) > 180

      expect(segmentarPorFalhas(pontos, 2000, quebra)).toEqual([
        [p(0, 350), p(1000, 355)],
        [p(2000, 5), p(3000, 10)],
      ])
    })

    it('deve receber o par (anterior, atual) na ordem', () => {
      const pares: [number, number][] = []
      segmentarPorFalhas([p(0, 1), p(1000, 2), p(2000, 3)], 2000, (a, b) => {
        pares.push([a.t, b.t])
        return false
      })

      expect(pares).toEqual([
        [0, 1000],
        [1000, 2000],
      ])
    })

    it('deve quebrar com 2 s ou mais quando a quebra mede o intervalo com >= (CA-002-12)', () => {
      const quebra = (a: PontoNoTempo, b: PontoNoTempo): boolean => b.t - a.t >= 2000

      expect(segmentarPorFalhas([p(0, 1), p(1999, 2)], 2000, quebra)).toHaveLength(1)
      expect(segmentarPorFalhas([p(0, 1), p(2000, 2)], 2000, quebra)).toHaveLength(2)
    })

    it('deve continuar quebrando pelo limite mesmo com a quebra devolvendo falso', () => {
      expect(segmentarPorFalhas([p(0, 1), p(5000, 2)], 2000, () => false)).toHaveLength(2)
    })

    it('deve manter os campos extras dos pontos', () => {
      const pontos = [
        { t: 0, x: 1, y: 2 },
        { t: 5000, x: 3, y: 4 },
      ]
      expect(segmentarPorFalhas(pontos)).toEqual([[pontos[0]], [pontos[1]]])
    })
  })
})
