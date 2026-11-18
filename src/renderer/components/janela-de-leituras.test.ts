import { describe, it, expect } from 'vitest'
import { acrescentarPacote, JANELA_VAZIA } from './janela-de-leituras'
import type { JanelaDeLeituras } from './janela-de-leituras'
import { JANELA_GRAFICO_MS, MAX_PONTOS_JANELA } from './limites-de-tempo'
import type { LeituraDoPacote, PacoteDeLeituras } from '../../shared/types'

const BASE = Date.parse('2026-11-17T12:00:00.000Z')

function iso(ms: number): string {
  return new Date(BASE + ms).toISOString()
}

function pacoteEm(ms: number, leituras: Record<string, number>): PacoteDeLeituras {
  const lista: LeituraDoPacote[] = Object.entries(leituras).map(([parametroId, valor]) => ({
    parametroId,
    valor,
  }))
  return { sessaoId: 'sess-1', timestamp: iso(ms), leituras: lista }
}

function acrescentarVarios(
  pacotes: PacoteDeLeituras[],
  opcoes?: { janelaMs?: number; maxPontos?: number }
): JanelaDeLeituras {
  return pacotes.reduce((janela, p) => acrescentarPacote(janela, p, opcoes), JANELA_VAZIA)
}

describe('acrescentarPacote', () => {
  it('deve usar a janela fixa de 2 minutos e no máximo 150 pontos por parâmetro', () => {
    expect(JANELA_GRAFICO_MS).toBe(120000)
    expect(MAX_PONTOS_JANELA).toBe(150)
  })

  it('deve começar vazia, sem séries e sem último instante (CA-002-17)', () => {
    expect(JANELA_VAZIA).toEqual({ series: {}, ultimoInstante: null })
  })

  it('deve criar uma série por parâmetro com o primeiro pacote', () => {
    const janela = acrescentarPacote(JANELA_VAZIA, pacoteEm(0, { altitude_msl: 4500, airspeed_ias: 112 }))

    expect(janela.series).toEqual({
      altitude_msl: [{ t: BASE, v: 4500 }],
      airspeed_ias: [{ t: BASE, v: 112 }],
    })
    expect(janela.ultimoInstante).toBe(BASE)
  })

  it('deve acrescentar um ponto por pacote, em ordem de tempo (CA-002-2)', () => {
    const janela = acrescentarVarios([
      pacoteEm(0, { altitude_msl: 4500 }),
      pacoteEm(1000, { altitude_msl: 4510 }),
      pacoteEm(2000, { altitude_msl: 4520 }),
    ])

    expect(janela.series.altitude_msl).toEqual([
      { t: BASE, v: 4500 },
      { t: BASE + 1000, v: 4510 },
      { t: BASE + 2000, v: 4520 },
    ])
    expect(janela.ultimoInstante).toBe(BASE + 2000)
  })

  it('deve cortar os pontos fora da janela guardando um ponto anterior ao corte', () => {
    const janela = acrescentarVarios(
      [0, 1000, 2000, 3000, 4000, 5000].map((t) => pacoteEm(t, { altitude_msl: t })),
      { janelaMs: 3000 }
    )

    // Corte em 2000: fica o 1000 (anterior ao corte) e os de 2000 em diante.
    expect(janela.series.altitude_msl.map((p) => p.t - BASE)).toEqual([1000, 2000, 3000, 4000, 5000])
  })

  it('deve manter só o ponto anterior ao corte com a janela padrão de 2 minutos', () => {
    const janela = acrescentarVarios([
      pacoteEm(0, { altitude_msl: 1 }),
      pacoteEm(1000, { altitude_msl: 2 }),
      pacoteEm(122000, { altitude_msl: 3 }),
    ])

    // Corte em 2000: o 0 sai, o 1000 fica como ponto anterior.
    expect(janela.series.altitude_msl.map((p) => p.t - BASE)).toEqual([1000, 122000])
  })

  it('deve limitar a quantidade de pontos por parâmetro', () => {
    const janela = acrescentarVarios(
      [0, 100, 200, 300, 400].map((t) => pacoteEm(t, { altitude_msl: t })),
      { maxPontos: 3 }
    )

    expect(janela.series.altitude_msl.map((p) => p.t - BASE)).toEqual([200, 300, 400])
  })

  it('deve descartar pacote com timestamp inválido, devolvendo a mesma janela', () => {
    const janela = acrescentarPacote(JANELA_VAZIA, pacoteEm(0, { altitude_msl: 4500 }))
    const invalido: PacoteDeLeituras = {
      sessaoId: 'sess-1',
      timestamp: 'não é data',
      leituras: [{ parametroId: 'altitude_msl', valor: 1 }],
    }

    expect(acrescentarPacote(janela, invalido)).toBe(janela)
  })

  it('deve descartar pacote fora de ordem ou com o mesmo instante, devolvendo a mesma janela', () => {
    const janela = acrescentarVarios([
      pacoteEm(0, { altitude_msl: 4500 }),
      pacoteEm(1000, { altitude_msl: 4510 }),
    ])

    expect(acrescentarPacote(janela, pacoteEm(500, { altitude_msl: 9999 }))).toBe(janela)
    expect(acrescentarPacote(janela, pacoteEm(1000, { altitude_msl: 9999 }))).toBe(janela)
  })

  it('não deve criar ponto para valor não finito (nenhum ponto inventado, CA-002-5)', () => {
    const janela = acrescentarVarios([
      pacoteEm(0, { altitude_msl: 4500, airspeed_ias: 100 }),
      pacoteEm(1000, { altitude_msl: Number.NaN, airspeed_ias: 101 }),
      pacoteEm(2000, { altitude_msl: Number.POSITIVE_INFINITY, airspeed_ias: 102 }),
    ])

    expect(janela.series.altitude_msl).toEqual([{ t: BASE, v: 4500 }])
    expect(janela.series.airspeed_ias).toHaveLength(3)
  })

  it('não deve criar série para parâmetro que só chegou com valor não finito', () => {
    const janela = acrescentarPacote(JANELA_VAZIA, pacoteEm(0, { altitude_msl: Number.NaN }))

    expect(janela.series).toEqual({})
    expect(janela.ultimoInstante).toBe(BASE)
  })

  it('deve manter a mesma referência nas séries que não mudaram', () => {
    const antes = acrescentarPacote(JANELA_VAZIA, pacoteEm(0, { altitude_msl: 4500, airspeed_ias: 100 }))

    const depois = acrescentarPacote(antes, pacoteEm(1000, { altitude_msl: 4510 }))

    expect(depois.series.airspeed_ias).toBe(antes.series.airspeed_ias)
    expect(depois.series.altitude_msl).not.toBe(antes.series.altitude_msl)
  })

  it('não deve alterar a janela recebida', () => {
    const antes = acrescentarPacote(JANELA_VAZIA, pacoteEm(0, { altitude_msl: 4500 }))
    const copia = JSON.parse(JSON.stringify(antes)) as JanelaDeLeituras

    acrescentarPacote(antes, pacoteEm(1000, { altitude_msl: 4510 }))

    expect(antes).toEqual(copia)
  })

  it('deve criar série nova para parâmetro que aparece no meio da sessão', () => {
    const janela = acrescentarVarios([
      pacoteEm(0, { altitude_msl: 4500 }),
      pacoteEm(1000, { altitude_msl: 4510, rpm_1: 2400 }),
    ])

    expect(janela.series.rpm_1).toEqual([{ t: BASE + 1000, v: 2400 }])
  })
})
