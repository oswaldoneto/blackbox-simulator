import { describe, it, expect } from 'vitest'
import { indiceAteOInstante, valorNoInstante, estadoDoParametro } from './valor-no-instante'
import { PARAMETER_IDS } from '../../../shared/parameter-ids'
import type { SerieDeLeituras } from '../../../shared/types'

const T0 = Date.parse('2026-11-17T10:00:00.000Z')

function serie(parametroId: SerieDeLeituras['parametroId'], pares: [number, number][]): SerieDeLeituras {
  return {
    parametroId,
    instantes: pares.map(([t]) => T0 + t),
    valores: pares.map(([, v]) => v),
  }
}

describe('indiceAteOInstante', () => {
  const instantes = [10, 20, 30]

  it('deve devolver -1 antes da primeira leitura e em lista vazia', () => {
    expect(indiceAteOInstante(instantes, 9)).toBe(-1)
    expect(indiceAteOInstante([], 100)).toBe(-1)
  })

  it('deve devolver a leitura exata e a última até o instante', () => {
    expect(indiceAteOInstante(instantes, 10)).toBe(0)
    expect(indiceAteOInstante(instantes, 25)).toBe(1)
    expect(indiceAteOInstante(instantes, 30)).toBe(2)
    expect(indiceAteOInstante(instantes, 999)).toBe(2)
  })

  it('deve escolher a última de leituras com o mesmo instante', () => {
    expect(indiceAteOInstante([10, 20, 20, 30], 20)).toBe(2)
  })
})

// CA-005-8: fronteiras de 0, 1999 e 2000 ms
describe('valorNoInstante', () => {
  const altitude = serie(PARAMETER_IDS.ALTITUDE_MSL, [
    [1000, 500],
    [2000, 510],
  ])

  it('deve devolver o valor da leitura no próprio instante (0 ms depois)', () => {
    expect(valorNoInstante(altitude, T0 + 2000)).toBe(510)
  })

  it('deve manter o valor até 1999 ms depois da última leitura, sem interpolar', () => {
    expect(valorNoInstante(altitude, T0 + 1500)).toBe(500)
    expect(valorNoInstante(altitude, T0 + 2000 + 1999)).toBe(510)
  })

  it('deve devolver null a partir de 2000 ms sem leitura', () => {
    expect(valorNoInstante(altitude, T0 + 2000 + 2000)).toBeNull()
    expect(valorNoInstante(altitude, T0 + 60_000)).toBeNull()
  })

  it('deve devolver null antes da primeira leitura (instante 0:00:00 sem leitura)', () => {
    expect(valorNoInstante(altitude, T0)).toBeNull()
  })

  it('deve devolver null sem série', () => {
    expect(valorNoInstante(undefined, T0)).toBeNull()
  })
})

// CA-005-7, CA-005-8, CA-005-9: precedência dos estados
describe('estadoDoParametro', () => {
  const mistura = serie(PARAMETER_IDS.MIXTURE_1, [[0, 80]])
  const series = new Map<string, SerieDeLeituras>([[PARAMETER_IDS.MIXTURE_1, mistura]])

  it('deve devolver N/A quando o parâmetro está na lista de não aplicáveis', () => {
    expect(estadoDoParametro(PARAMETER_IDS.MIXTURE_1, series, [PARAMETER_IDS.MIXTURE_1], T0)).toEqual(
      { tipo: 'nao-aplicavel' }
    )
  })

  it('deve fazer N/A vencer "sem dados no voo" e "sem dados"', () => {
    expect(estadoDoParametro(PARAMETER_IDS.FLAPS, new Map(), [PARAMETER_IDS.FLAPS], T0)).toEqual({
      tipo: 'nao-aplicavel',
    })
    expect(
      estadoDoParametro(PARAMETER_IDS.MIXTURE_1, series, [PARAMETER_IDS.MIXTURE_1], T0 + 60_000)
    ).toEqual({ tipo: 'nao-aplicavel' })
  })

  it('deve devolver "sem dados no voo" para parâmetro aplicável sem série ou com série vazia', () => {
    expect(estadoDoParametro(PARAMETER_IDS.FLAPS, series, [], T0)).toEqual({
      tipo: 'sem-dados-no-voo',
    })
    const vazia = new Map<string, SerieDeLeituras>([
      [PARAMETER_IDS.FLAPS, { parametroId: PARAMETER_IDS.FLAPS, instantes: [], valores: [] }],
    ])
    expect(estadoDoParametro(PARAMETER_IDS.FLAPS, vazia, [], T0)).toEqual({ tipo: 'sem-dados-no-voo' })
  })

  it('deve devolver "sem dados" quando passaram 2000 ms sem leitura', () => {
    expect(estadoDoParametro(PARAMETER_IDS.MIXTURE_1, series, [], T0 + 2000)).toEqual({
      tipo: 'sem-dados',
    })
  })

  it('deve devolver o valor com lista de não aplicáveis vazia (sessão antiga)', () => {
    expect(estadoDoParametro(PARAMETER_IDS.MIXTURE_1, series, [], T0 + 1999)).toEqual({
      tipo: 'valor',
      valor: 80,
    })
  })
})
