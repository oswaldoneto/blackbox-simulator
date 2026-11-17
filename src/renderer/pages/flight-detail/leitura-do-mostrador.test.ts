import { describe, it, expect } from 'vitest'
import {
  SEM_DADOS_NO_VOO,
  valorDoEstado,
  textoDaLeitura,
  descricaoDaLeitura,
} from './leitura-do-mostrador'
import type { LeituraDoMostrador } from './leitura-do-mostrador'
import { leituraNoInstante } from './catalogo'
import { caminhoDaLinha } from './caminho-svg'
import { PARAMETER_IDS } from '../../../shared/parameter-ids'
import type { ParametroDeVoo, SerieDeLeituras } from '../../../shared/types'

function leitura(estado: LeituraDoMostrador['estado']): LeituraDoMostrador {
  return { parametroId: PARAMETER_IDS.MIXTURE_1, rotulo: 'Mistura', unidade: '%', estado }
}

// CA-005-7, CA-005-8, CA-005-9: texto e rótulo acessível de cada estado
describe('leitura do mostrador', () => {
  it('deve mostrar "N/A" com rótulo "<rótulo>: não aplicável"', () => {
    const l = leitura({ tipo: 'nao-aplicavel' })
    expect(textoDaLeitura(l)).toBe('N/A')
    expect(descricaoDaLeitura(l)).toBe('Mistura: não aplicável')
    expect(valorDoEstado(l.estado)).toBeNull()
  })

  it('deve mostrar "—" com rótulo "<rótulo>: sem dados"', () => {
    const l = leitura({ tipo: 'sem-dados' })
    expect(textoDaLeitura(l)).toBe('—')
    expect(descricaoDaLeitura(l)).toBe('Mistura: sem dados')
    expect(valorDoEstado(l.estado)).toBeNull()
  })

  it('deve mostrar "Sem dados neste voo"', () => {
    const l = leitura({ tipo: 'sem-dados-no-voo' })
    expect(textoDaLeitura(l)).toBe(SEM_DADOS_NO_VOO)
    expect(SEM_DADOS_NO_VOO).toBe('Sem dados neste voo')
    expect(descricaoDaLeitura(l)).toBe('Mistura: sem dados neste voo')
    expect(valorDoEstado(l.estado)).toBeNull()
  })

  it('deve mostrar o valor formatado com a unidade no rótulo', () => {
    const l = leitura({ tipo: 'valor', valor: 80 })
    expect(valorDoEstado(l.estado)).toBe(80)
    expect(descricaoDaLeitura(l)).toBe(`Mistura: ${textoDaLeitura(l)} %`)
  })
})

describe('leituraNoInstante', () => {
  const catalogo = new Map<string, ParametroDeVoo>([
    [
      PARAMETER_IDS.ALTITUDE_MSL,
      { id: PARAMETER_IDS.ALTITUDE_MSL, nome: 'Altitude MSL', unidade: 'ft', ativo: true },
    ],
  ])
  const series = new Map<string, SerieDeLeituras>([
    [
      PARAMETER_IDS.ALTITUDE_MSL,
      { parametroId: PARAMETER_IDS.ALTITUDE_MSL, instantes: [1000], valores: [1500] },
    ],
  ])

  it('deve usar rótulo e unidade do catálogo e o estado no instante', () => {
    expect(
      leituraNoInstante(PARAMETER_IDS.ALTITUDE_MSL, {
        catalogo,
        series,
        parametrosNaoAplicaveis: [],
        instanteMs: 1500,
      })
    ).toEqual({
      parametroId: PARAMETER_IDS.ALTITUDE_MSL,
      rotulo: 'Altitude MSL',
      unidade: 'ft',
      estado: { tipo: 'valor', valor: 1500 },
    })
  })

  it('deve usar o id como rótulo, sem unidade, para parâmetro fora do catálogo', () => {
    const l = leituraNoInstante(PARAMETER_IDS.FLAPS, {
      catalogo,
      series,
      parametrosNaoAplicaveis: [],
      instanteMs: 0,
    })
    expect(l.rotulo).toBe(PARAMETER_IDS.FLAPS)
    expect(l.unidade).toBe('')
    expect(l.estado).toEqual({ tipo: 'sem-dados-no-voo' })
  })
})

describe('caminhoDaLinha', () => {
  it('deve devolver vazio sem pontos', () => {
    expect(caminhoDaLinha([])).toBe('')
  })

  it('deve transformar um ponto único em segmento de comprimento zero', () => {
    expect(caminhoDaLinha([{ x: 1, y: 2 }])).toBe('M1.0 2.0 L1.0 2.0')
  })

  it('deve ligar os pontos com uma casa decimal', () => {
    expect(caminhoDaLinha([{ x: 0, y: 0 }, { x: 10.26, y: 5 }])).toBe('M0.0 0.0 L10.3 5.0')
  })
})
