import { describe, it, expect } from 'vitest'
import { escalaDoGrafico, FOLGA_DA_ESCALA, valorBrutoDoGrafico, valorNoGrafico } from './escala-do-grafico'
import { CONFIG_GRAFICO_PAINEL } from './config-grafico-painel'
import { PARAMETER_IDS } from '../../shared/parameter-ids'

const escalaDe = (id: keyof typeof CONFIG_GRAFICO_PAINEL) => CONFIG_GRAFICO_PAINEL[id].escala

function aproximado(escala: { min: number; max: number } | null): { min: number; max: number } {
  if (escala === null) throw new Error('escala nula')
  return { min: Number(escala.min.toFixed(6)), max: Number(escala.max.toFixed(6)) }
}

describe('escalaDoGrafico', () => {
  it('deve usar folga de 15 %', () => {
    expect(FOLGA_DA_ESCALA).toBe(0.15)
  })

  describe('fixa (CA-002-8 e CA-002-10)', () => {
    it('deve manter 0–360 no rumo, com ou sem leituras', () => {
      const rumo = escalaDe(PARAMETER_IDS.HEADING_MAGNETIC)
      expect(escalaDoGrafico(rumo, [])).toEqual({ min: 0, max: 360 })
      expect(escalaDoGrafico(rumo, [10, 20])).toEqual({ min: 0, max: 360 })
    })

    it('deve manter 0–100 na manete mesmo com valor fora da escala (reverso)', () => {
      expect(escalaDoGrafico(escalaDe(PARAMETER_IDS.THROTTLE_1), [-20, 130])).toEqual({ min: 0, max: 100 })
    })
  })

  describe('zero no centro (CA-002-8)', () => {
    const vs = escalaDe(PARAMETER_IDS.VERTICAL_SPEED)

    it('deve usar a meia amplitude mínima sem leituras', () => {
      expect(escalaDoGrafico(vs, [])).toEqual({ min: -300, max: 300 })
      expect(escalaDoGrafico(escalaDe(PARAMETER_IDS.PITCH), [])).toEqual({ min: -5, max: 5 })
      expect(escalaDoGrafico(escalaDe(PARAMETER_IDS.BANK), [])).toEqual({ min: -15, max: 15 })
    })

    it('deve usar a meia amplitude mínima com leituras pequenas', () => {
      expect(escalaDoGrafico(vs, [-50, 100])).toEqual({ min: -300, max: 300 })
    })

    it('deve ficar simétrica com 15 % de folga sobre o maior valor absoluto', () => {
      expect(aproximado(escalaDoGrafico(vs, [-100, 400]))).toEqual({ min: -460, max: 460 })
      expect(aproximado(escalaDoGrafico(vs, [-800, 100]))).toEqual({ min: -920, max: 920 })
    })

    it('deve deixar o zero no meio', () => {
      const escala = escalaDoGrafico(vs, [200, 1000])
      expect(escala).not.toBeNull()
      expect((escala!.min + escala!.max) / 2).toBe(0)
    })
  })

  describe('automática (CA-002-8 e CA-002-9)', () => {
    const altitude = escalaDe(PARAMETER_IDS.ALTITUDE_MSL)

    it('deve devolver null sem leituras (limites escondidos, T8)', () => {
      expect(escalaDoGrafico(altitude, [])).toBeNull()
    })

    it('deve deixar um valor constante no meio, com a amplitude mínima (nunca zero)', () => {
      expect(escalaDoGrafico(altitude, [4500, 4500, 4500])).toEqual({ min: 4400, max: 4600 })
      expect(aproximado(escalaDoGrafico(escalaDe(PARAMETER_IDS.LATITUDE), [-23.55]))).toEqual({
        min: -23.555,
        max: -23.545,
      })
      expect(escalaDoGrafico(escalaDe(PARAMETER_IDS.RPM_1), [2400])).toEqual({ min: 2150, max: 2650 })
    })

    it('deve seguir as leituras com 15 % de folga quando passam da amplitude mínima', () => {
      expect(aproximado(escalaDoGrafico(altitude, [1000, 2000, 1500]))).toEqual({ min: 925, max: 2075 })
    })

    it('deve subir a faixa até o piso 0 mantendo a amplitude na IAS e no RPM (T5)', () => {
      expect(escalaDoGrafico(escalaDe(PARAMETER_IDS.AIRSPEED_IAS), [5])).toEqual({ min: 0, max: 20 })
      expect(escalaDoGrafico(escalaDe(PARAMETER_IDS.AIRSPEED_IAS), [0])).toEqual({ min: 0, max: 20 })
      expect(escalaDoGrafico(escalaDe(PARAMETER_IDS.RPM_1), [0])).toEqual({ min: 0, max: 500 })
    })

    it('não deve aplicar piso na altitude, que pode ficar negativa', () => {
      expect(escalaDoGrafico(altitude, [-10])).toEqual({ min: -110, max: 90 })
    })

    it('deve ignorar valores não finitos', () => {
      expect(escalaDoGrafico(altitude, [Number.NaN, 4500, Number.POSITIVE_INFINITY])).toEqual({
        min: 4400,
        max: 4600,
      })
      expect(escalaDoGrafico(altitude, [Number.NaN])).toBeNull()
    })
  })
})

describe('valorNoGrafico', () => {
  it('deve exibir a arfagem positiva com o nariz para cima', () => {
    // O SimConnect entrega a arfagem positiva com o nariz para baixo.
    expect(valorNoGrafico(PARAMETER_IDS.PITCH, 5)).toBe(-5)
    expect(valorNoGrafico(PARAMETER_IDS.PITCH, -3)).toBe(3)
  })

  it('deve exibir a rolagem positiva para a direita, em cima (T4)', () => {
    // O SimConnect entrega a rolagem positiva para a esquerda.
    expect(valorNoGrafico(PARAMETER_IDS.BANK, 10)).toBe(-10)
    expect(valorNoGrafico(PARAMETER_IDS.BANK, -10)).toBe(10)
  })

  it('deve levar o rumo para 0–360 em módulo 360', () => {
    expect(valorNoGrafico(PARAMETER_IDS.HEADING_MAGNETIC, 370)).toBe(10)
    expect(valorNoGrafico(PARAMETER_IDS.HEADING_MAGNETIC, -10)).toBe(350)
    expect(valorNoGrafico(PARAMETER_IDS.HEADING_MAGNETIC, 359)).toBe(359)
  })

  it('deve manter os outros parâmetros como vieram', () => {
    expect(valorNoGrafico(PARAMETER_IDS.ALTITUDE_MSL, -12.5)).toBe(-12.5)
    expect(valorNoGrafico(PARAMETER_IDS.THROTTLE_1, -20)).toBe(-20)
  })
})

describe('valorBrutoDoGrafico', () => {
  it('deve ser a inversa de valorNoGrafico na arfagem e na rolagem', () => {
    for (const id of [PARAMETER_IDS.PITCH, PARAMETER_IDS.BANK]) {
      expect(valorBrutoDoGrafico(id, valorNoGrafico(id, 7.5))).toBe(7.5)
    }
  })

  it('deve manter os outros parâmetros como vieram', () => {
    expect(valorBrutoDoGrafico(PARAMETER_IDS.HEADING_MAGNETIC, 350)).toBe(350)
    expect(valorBrutoDoGrafico(PARAMETER_IDS.RPM_1, 2400)).toBe(2400)
  })
})
