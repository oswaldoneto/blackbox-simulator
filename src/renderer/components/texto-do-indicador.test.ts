import { describe, it, expect } from 'vitest'
import { LEGENDA_DOS_GRAFICOS, TEXTO_SEM_ITEM, textoDoIndicador } from './texto-do-indicador'
import { menorArcoDoRumo } from './desenho-do-grafico'
import { PARAMETER_IDS } from '../../shared/parameter-ids'

describe('textoDoIndicador', () => {
  const base = {
    parametroId: PARAMETER_IDS.ALTITUDE_MSL,
    nome: 'Altitude MSL',
    unidade: 'ft',
    naoAplicavel: false,
  }

  it('deve ler valor, unidade e a faixa dos últimos 2 minutos (CA-002-19)', () => {
    expect(textoDoIndicador({ ...base, valor: 4500, faixa: { de: 4300, ate: 4700 } })).toBe(
      'Altitude MSL: 4.500 ft; últimos 2 minutos: de 4.300 a 4.700 ft'
    )
  })

  it('deve omitir os 2 minutos com a janela vazia (T7)', () => {
    expect(textoDoIndicador({ ...base, valor: 4500, faixa: null })).toBe('Altitude MSL: 4.500 ft')
  })

  it('deve ler "sem sinal" seguido da faixa quando a janela tem leituras (T7)', () => {
    expect(textoDoIndicador({ ...base, valor: null, faixa: { de: 4300, ate: 4700 } })).toBe(
      'Altitude MSL: sem sinal; últimos 2 minutos: de 4.300 a 4.700 ft'
    )
  })

  it('deve ler só "sem sinal" sem leituras na janela', () => {
    expect(textoDoIndicador({ ...base, valor: null, faixa: null })).toBe('Altitude MSL: sem sinal')
    expect(textoDoIndicador({ ...base, valor: Number.NaN, faixa: null })).toBe('Altitude MSL: sem sinal')
  })

  it('deve ler "<rótulo>: não aplicável" no N/A, sem valor nem faixa (CA-002-18)', () => {
    expect(
      textoDoIndicador({
        parametroId: PARAMETER_IDS.MIXTURE_1,
        nome: 'Mistura',
        unidade: '%',
        valor: 100,
        naoAplicavel: true,
        faixa: { de: 0, ate: 100 },
      })
    ).toBe('Mistura: não aplicável')
  })

  it('deve ler o rumo pelo menor arco quando passa pelo norte (T6)', () => {
    expect(
      textoDoIndicador({
        parametroId: PARAMETER_IDS.HEADING_MAGNETIC,
        nome: 'Rumo magnético',
        unidade: '°',
        valor: 10,
        naoAplicavel: false,
        faixa: menorArcoDoRumo([350, 355, 5, 10]),
      })
    ).toBe('Rumo magnético: 010 °; últimos 2 minutos: de 350 a 010 °')
  })

  it('deve formatar a faixa com o sinal da exibição na arfagem e na rolagem', () => {
    expect(
      textoDoIndicador({
        parametroId: PARAMETER_IDS.PITCH,
        nome: 'Arfagem',
        unidade: '°',
        valor: -3,
        naoAplicavel: false,
        faixa: { de: 2, ate: -3 },
      })
    ).toBe('Arfagem: +3,0 °; últimos 2 minutos: de −2,0 a +3,0 °')
    expect(
      textoDoIndicador({
        parametroId: PARAMETER_IDS.BANK,
        nome: 'Rolagem',
        unidade: '°',
        valor: -10,
        naoAplicavel: false,
        faixa: { de: 10, ate: -10 },
      })
    ).toBe('Rolagem: 10,0 D °; últimos 2 minutos: de 10,0 E a 10,0 D °')
  })

  it('deve formatar a faixa com o valor real fora da escala fixa (CA-002-10)', () => {
    expect(
      textoDoIndicador({
        parametroId: PARAMETER_IDS.THROTTLE_1,
        nome: 'Manete',
        unidade: '%',
        valor: -20,
        naoAplicavel: false,
        faixa: { de: -20, ate: 85 },
      })
    ).toBe('Manete: −20 %; últimos 2 minutos: de −20 a 85 %')
  })
})

describe('textos fixos', () => {
  it('deve ter a legenda da decisão 12 (b)', () => {
    expect(LEGENDA_DOS_GRAFICOS).toBe('Gráficos: últimos 2 minutos. A ponta direita da linha é o valor atual.')
  })

  it('deve ter o texto do card N/A (CA-002-18)', () => {
    expect(TEXTO_SEM_ITEM).toBe('A aeronave não possui este item')
  })
})
