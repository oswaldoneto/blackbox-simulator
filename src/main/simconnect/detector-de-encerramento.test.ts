import { describe, it, expect } from 'vitest'
import {
  ENCERRAMENTO_LIMITE_MS,
  ESTADO_INICIAL_DETECTOR,
  avancarDetector,
  zerarContagem,
} from './detector-de-encerramento'
import type { EstadoDetector, EventoDetector } from './detector-de-encerramento'

// Tempo medido pelos instantes das amostras (sem timer): cada teste usa instantes explícitos.
const T0 = Date.parse('2026-11-17T10:00:00.000Z')

/** Instante ISO a `s` segundos de T0. */
function em(s: number): string {
  return new Date(T0 + s * 1000).toISOString()
}

function motor(combustao: boolean, s: number): EventoDetector {
  return { tipo: 'motor', combustao, timestamp: em(s) }
}

function solo(noSolo: boolean, s: number): EventoDetector {
  return { tipo: 'solo', noSolo, timestamp: em(s) }
}

const QUEDA: EventoDetector = { tipo: 'conexao-perdida' }

/** Aplica os eventos em ordem e devolve o estado final e a primeira hora de fim indicada. */
function rodar(
  eventos: EventoDetector[],
  inicial: EstadoDetector = ESTADO_INICIAL_DETECTOR
): { estado: EstadoDetector; encerradaEm: string | null; indice: number } {
  let estado = inicial
  for (let i = 0; i < eventos.length; i++) {
    const r = avancarDetector(estado, eventos[i])
    estado = r.estado
    if (r.encerradaEm !== null) return { estado, encerradaEm: r.encerradaEm, indice: i }
  }
  return { estado, encerradaEm: null, indice: -1 }
}

/** Um par de amostras (motor e solo) por segundo, de `de` até `ate` inclusive. */
function porSegundo(
  de: number,
  ate: number,
  combustao: boolean,
  noSolo: boolean
): EventoDetector[] {
  const eventos: EventoDetector[] = []
  for (let s = de; s <= ate; s++) {
    eventos.push(motor(combustao, s), solo(noSolo, s))
  }
  return eventos
}

describe('detectorDeEncerramento', () => {
  it('deve usar o limite de 15 s', () => {
    expect(ENCERRAMENTO_LIMITE_MS).toBe(15_000)
  })

  it('deve começar com motor e solo desconhecidos e sem contagem', () => {
    expect(ESTADO_INICIAL_DETECTOR).toEqual({
      motorLigado: null,
      noSolo: null,
      inicioCondicao: null,
    })
  })

  describe('encerramento após 15 s com motor parado e no solo', () => {
    it('deve encerrar aos 15 s seguidos com a hora de fim na primeira amostra com as duas condições', () => {
      const r = rodar([...porSegundo(0, 9, true, true), ...porSegundo(10, 25, false, true)])

      expect(r.encerradaEm).toBe(em(10))
      // A amostra que fecha os 15 s é a de 25 s.
      expect(r.indice).toBe(porSegundo(0, 9, true, true).length + 2 * 15)
    })

    it('não deve encerrar com 14 s seguidos', () => {
      const r = rodar([...porSegundo(0, 4, true, true), ...porSegundo(5, 19, false, true)])

      expect(r.encerradaEm).toBeNull()
      expect(r.estado.inicioCondicao).toBe(em(5))
    })

    it('deve encerrar exatamente em 15 000 ms e não em 14 999 ms', () => {
      const inicio = avancarDetector(
        avancarDetector(ESTADO_INICIAL_DETECTOR, solo(true, 0)).estado,
        motor(false, 0)
      ).estado
      const quase = avancarDetector(inicio, {
        tipo: 'motor',
        combustao: false,
        timestamp: new Date(T0 + 14_999).toISOString(),
      })
      expect(quase.encerradaEm).toBeNull()

      const limite = avancarDetector(quase.estado, {
        tipo: 'motor',
        combustao: false,
        timestamp: new Date(T0 + 15_000).toISOString(),
      })
      expect(limite.encerradaEm).toBe(em(0))
    })

    it('deve zerar a contagem depois de indicar o encerramento', () => {
      const r = rodar([...porSegundo(0, 15, false, true)])

      expect(r.encerradaEm).toBe(em(0))
      expect(r.estado.inicioCondicao).toBeNull()
      expect(r.estado.motorLigado).toBe(false)
      expect(r.estado.noSolo).toBe(true)
    })

    it('deve medir pelos instantes das amostras, mesmo com amostras espaçadas', () => {
      // Só duas amostras do motor, 20 s distantes: o tempo vem dos instantes.
      const r = rodar([solo(true, 0), motor(false, 0), motor(false, 20)])

      expect(r.encerradaEm).toBe(em(0))
    })
  })

  describe('contagem zerada', () => {
    it('deve zerar e recomeçar quando o motor volta antes dos 15 s (motor que tosse)', () => {
      const r = rodar([
        ...porSegundo(0, 9, false, true), // 10 s parado
        ...porSegundo(10, 11, true, true), // motor volta
        ...porSegundo(12, 26, false, true), // para de novo: 14 s
      ])
      expect(r.encerradaEm).toBeNull()
      expect(r.estado.inicioCondicao).toBe(em(12))

      const fim = rodar(porSegundo(27, 27, false, true), r.estado)
      expect(fim.encerradaEm).toBe(em(12))
    })

    it('deve zerar quando a aeronave sai do solo', () => {
      const r = rodar([
        ...porSegundo(0, 10, false, true),
        ...porSegundo(11, 11, false, false),
        ...porSegundo(12, 20, false, true),
      ])

      expect(r.encerradaEm).toBeNull()
      expect(r.estado.inicioCondicao).toBe(em(12))
    })
  })

  describe('pane em voo', () => {
    it('não deve encerrar com o motor parado em voo, por mais longo que seja o planeio', () => {
      const r = rodar(porSegundo(0, 300, false, false))

      expect(r.encerradaEm).toBeNull()
      expect(r.estado.inicioCondicao).toBeNull()
    })

    it('deve encerrar 15 s após o toque quando a pane é seguida de pouso, com a hora de fim no toque', () => {
      const r = rodar([
        ...porSegundo(0, 59, true, false), // voo
        ...porSegundo(60, 179, false, false), // pane e planeio
        ...porSegundo(180, 195, false, true), // pouso às 180 s
      ])

      expect(r.encerradaEm).toBe(em(180))
    })
  })

  it('deve usar o instante do corte quando o motor é cortado depois do pouso', () => {
    const r = rodar([
      ...porSegundo(0, 29, true, false), // voo
      ...porSegundo(30, 89, true, true), // pouso e táxi com motor ligado
      ...porSegundo(90, 105, false, true), // corte às 90 s
    ])

    expect(r.encerradaEm).toBe(em(90))
  })

  describe('valores desconhecidos', () => {
    it('nunca deve encerrar com o solo desconhecido (sem amostra de solo)', () => {
      const eventos: EventoDetector[] = []
      for (let s = 0; s <= 60; s++) eventos.push(motor(false, s))
      const r = rodar(eventos)

      expect(r.encerradaEm).toBeNull()
      expect(r.estado.noSolo).toBeNull()
      expect(r.estado.inicioCondicao).toBeNull()
    })

    it('nunca deve encerrar com o motor desconhecido (sem amostra do motor)', () => {
      const eventos: EventoDetector[] = []
      for (let s = 0; s <= 60; s++) eventos.push(solo(true, s))
      const r = rodar(eventos)

      expect(r.encerradaEm).toBeNull()
      expect(r.estado.motorLigado).toBeNull()
    })

    it('deve começar a contar na amostra em que o segundo valor fica conhecido', () => {
      const r = rodar([motor(false, 0), motor(false, 5), solo(true, 7), motor(false, 21)])
      expect(r.encerradaEm).toBeNull()
      expect(r.estado.inicioCondicao).toBe(em(7))

      expect(rodar([motor(false, 22)], r.estado).encerradaEm).toBe(em(7))
    })
  })

  describe('queda de conexão durante a espera (HITL-1)', () => {
    it('não deve encerrar com a queda em si', () => {
      const antes = rodar(porSegundo(0, 10, false, true))
      const r = avancarDetector(antes.estado, QUEDA)

      expect(r.encerradaEm).toBeNull()
    })

    it('deve manter o instante original e esquecer os valores de motor e solo na queda', () => {
      const antes = rodar(porSegundo(0, 10, false, true))
      const r = avancarDetector(antes.estado, QUEDA)

      expect(r.estado).toEqual({ motorLigado: null, noSolo: null, inicioCondicao: em(0) })
    })

    it('deve continuar do instante original quando, ao reconectar, motor parado e solo continuam valendo', () => {
      const r = rodar([
        ...porSegundo(0, 5, false, true), // contagem começa em 0 s
        QUEDA, // cai aos 6 s
        ...porSegundo(40, 40, false, true), // volta aos 40 s com as duas condições
      ])

      expect(r.encerradaEm).toBe(em(0))
    })

    it('não deve encerrar com só uma das amostras de volta depois da queda', () => {
      const r = rodar([...porSegundo(0, 5, false, true), QUEDA, motor(false, 40)])

      expect(r.encerradaEm).toBeNull()
      expect(r.estado.inicioCondicao).toBe(em(0))
    })

    it('deve zerar quando, ao reconectar, o motor voltou', () => {
      const r = rodar([...porSegundo(0, 5, false, true), QUEDA, motor(true, 40), solo(true, 40)])

      expect(r.encerradaEm).toBeNull()
      expect(r.estado.inicioCondicao).toBeNull()
    })

    it('deve zerar quando, ao reconectar, a aeronave não está mais no solo', () => {
      const r = rodar([
        ...porSegundo(0, 5, false, true),
        QUEDA,
        solo(false, 40),
        motor(false, 40),
      ])

      expect(r.encerradaEm).toBeNull()
      expect(r.estado.inicioCondicao).toBeNull()
    })

    it('deve recomeçar do instante da volta quando a contagem zerou após a reconexão', () => {
      const r = rodar([
        ...porSegundo(0, 5, false, true),
        QUEDA,
        ...porSegundo(40, 40, true, true), // motor voltou: zera
        ...porSegundo(41, 55, false, true), // corta de novo aos 41 s
      ])

      expect(r.encerradaEm).toBeNull()
      expect(r.estado.inicioCondicao).toBe(em(41))
      expect(rodar(porSegundo(56, 56, false, true), r.estado).encerradaEm).toBe(em(41))
    })

    it('não deve começar contagem na queda quando não havia contagem', () => {
      const r = rodar([...porSegundo(0, 5, true, true), QUEDA])

      expect(r.estado).toEqual({ motorLigado: null, noSolo: null, inicioCondicao: null })
    })
  })

  describe('zerarContagem', () => {
    it('deve zerar a contagem e manter os últimos valores lidos', () => {
      const estado: EstadoDetector = { motorLigado: false, noSolo: true, inicioCondicao: em(3) }

      expect(zerarContagem(estado)).toEqual({
        motorLigado: false,
        noSolo: true,
        inicioCondicao: null,
      })
    })

    it('não deve alterar o estado recebido', () => {
      const estado: EstadoDetector = { motorLigado: false, noSolo: true, inicioCondicao: em(3) }
      zerarContagem(estado)
      expect(estado.inicioCondicao).toBe(em(3))
    })
  })

  it('não deve alterar o estado recebido ao avançar', () => {
    const estado: EstadoDetector = { motorLigado: false, noSolo: true, inicioCondicao: em(0) }
    avancarDetector(estado, motor(true, 1))
    avancarDetector(estado, QUEDA)
    expect(estado).toEqual({ motorLigado: false, noSolo: true, inicioCondicao: em(0) })
  })
})
