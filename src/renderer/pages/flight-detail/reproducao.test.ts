import { describe, it, expect } from 'vitest'
import {
  ESTADO_INICIAL_DA_REPRODUCAO,
  VELOCIDADES_DE_REPRODUCAO,
  avancarReproducao,
  alternarReproducao,
  posicionarReproducao,
  escolherVelocidade,
} from './reproducao'
import type { EstadoDaReproducao } from './reproducao'

const DURACAO = 600

function tocando(overrides: Partial<EstadoDaReproducao> = {}): EstadoDaReproducao {
  return { posicao: 0, tocando: true, velocidade: 1, ...overrides }
}

// CA-005-1: abre pausada em 0:00:00, a 1×
describe('ESTADO_INICIAL_DA_REPRODUCAO', () => {
  it('deve começar pausado em 0, a 1×', () => {
    expect(ESTADO_INICIAL_DA_REPRODUCAO).toEqual({ posicao: 0, tocando: false, velocidade: 1 })
    expect(VELOCIDADES_DE_REPRODUCAO).toEqual([1, 4, 16])
  })
})

// CA-005-4
describe('avancarReproducao', () => {
  it.each([
    [1, 0.25],
    [4, 1],
    [16, 4],
  ] as const)('deve avançar a %i× o tempo de relógio multiplicado', (velocidade, esperado) => {
    expect(avancarReproducao(tocando({ velocidade }), 250, DURACAO).posicao).toBe(esperado)
  })

  it('não deve mudar quando pausada', () => {
    const pausado = { ...tocando(), tocando: false }
    expect(avancarReproducao(pausado, 1000, DURACAO)).toBe(pausado)
  })

  it('deve parar no fim e pausar', () => {
    expect(avancarReproducao(tocando({ posicao: 599, velocidade: 16 }), 250, DURACAO)).toEqual({
      posicao: 600,
      tocando: false,
      velocidade: 16,
    })
  })

  it('deve pausar no fim de um voo de duração 0', () => {
    expect(avancarReproducao(tocando(), 250, 0)).toEqual({ posicao: 0, tocando: false, velocidade: 1 })
  })
})

describe('alternarReproducao', () => {
  it('deve reproduzir da posição atual e pausar mantendo a posição', () => {
    const pausado = { posicao: 42, tocando: false, velocidade: 4 as const }
    const reproduzindo = alternarReproducao(pausado, DURACAO)
    expect(reproduzindo).toEqual({ posicao: 42, tocando: true, velocidade: 4 })
    expect(alternarReproducao(reproduzindo, DURACAO)).toEqual(pausado)
  })

  it('deve recomeçar do zero ao reproduzir no fim', () => {
    expect(alternarReproducao({ posicao: 600, tocando: false, velocidade: 1 }, DURACAO)).toEqual({
      posicao: 0,
      tocando: true,
      velocidade: 1,
    })
  })
})

describe('posicionarReproducao', () => {
  it('deve levar à posição, presa entre 0 e a duração, sem mudar o tocar', () => {
    expect(posicionarReproducao(tocando(), 120, DURACAO)).toEqual(tocando({ posicao: 120 }))
    expect(posicionarReproducao(tocando(), -5, DURACAO).posicao).toBe(0)
    expect(posicionarReproducao(tocando(), 700, DURACAO).posicao).toBe(600)
  })
})

describe('escolherVelocidade', () => {
  it('deve trocar só a velocidade', () => {
    expect(escolherVelocidade(tocando({ posicao: 10 }), 16)).toEqual(
      tocando({ posicao: 10, velocidade: 16 })
    )
  })
})
