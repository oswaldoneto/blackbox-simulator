import { describe, it, expect } from 'vitest'
import {
  anguloNaEscala,
  fracaoNaEscala,
  angulosDoAltimetro,
  rotacaoDaRosa,
  arfagemNarizParaCima,
  rolagemParaDireita,
  movimentoDoHorizonte,
  anguloDoFlape,
  ESCALA_IAS,
  ESCALA_RPM,
  ESCALA_VS,
  ARFAGEM_LIMITE_DESENHO,
  PIXELS_POR_GRAU_DE_ARFAGEM,
  FLAPE_ANGULO_MAXIMO,
} from './escala-instrumentos'

// CA-005-14: ponteiro preso no limite
describe('anguloNaEscala', () => {
  it('deve levar os extremos da escala aos ângulos extremos', () => {
    expect(anguloNaEscala(0, ESCALA_IAS)).toBe(-150)
    expect(anguloNaEscala(200, ESCALA_IAS)).toBe(150)
    expect(anguloNaEscala(100, ESCALA_IAS)).toBe(0)
  })

  it('deve prender o ponteiro no limite acima e abaixo da escala', () => {
    expect(anguloNaEscala(260, ESCALA_IAS)).toBe(150)
    expect(anguloNaEscala(-5, ESCALA_IAS)).toBe(-150)
    expect(anguloNaEscala(4200, ESCALA_RPM)).toBe(135)
    expect(anguloNaEscala(3000, ESCALA_VS)).toBe(80)
    expect(anguloNaEscala(-3000, ESCALA_VS)).toBe(-260)
  })

  it('deve pôr o zero do variômetro às 9 horas', () => {
    expect(anguloNaEscala(0, ESCALA_VS)).toBe(-90)
  })
})

describe('fracaoNaEscala', () => {
  it('deve devolver a fração presa entre 0 e 1', () => {
    expect(fracaoNaEscala(50, 0, 100)).toBe(0.5)
    expect(fracaoNaEscala(130, 0, 100)).toBe(1)
    expect(fracaoNaEscala(-10, 0, 100)).toBe(0)
  })
})

describe('angulosDoAltimetro', () => {
  it('deve dar uma volta do ponteiro longo a cada 1.000 ft e do curto a cada 10.000 ft', () => {
    expect(angulosDoAltimetro(0)).toEqual({ centenas: 0, milhares: 0 })
    expect(angulosDoAltimetro(2500)).toEqual({ centenas: 180, milhares: 90 })
  })

  it('deve girar para trás com altitude negativa', () => {
    expect(angulosDoAltimetro(-250)).toEqual({ centenas: 270, milhares: 351 })
  })
})

describe('rotacaoDaRosa', () => {
  it('deve girar a rosa ao contrário do rumo, normalizada', () => {
    expect(rotacaoDaRosa(0)).toBe(0)
    expect(rotacaoDaRosa(360)).toBe(0)
    expect(rotacaoDaRosa(90)).toBe(-90)
    expect(rotacaoDaRosa(-90)).toBe(-270)
  })
})

// CA-005-2: sinal de arfagem e rolagem corrigido
describe('sinais de arfagem e rolagem', () => {
  it('deve exibir arfagem positiva com o nariz para cima (valor bruto positivo é nariz para baixo)', () => {
    expect(arfagemNarizParaCima(-5)).toBe(5)
    expect(arfagemNarizParaCima(5)).toBe(-5)
  })

  it('deve exibir rolagem positiva para a direita (valor bruto positivo é para a esquerda)', () => {
    expect(rolagemParaDireita(-10)).toBe(10)
    expect(rolagemParaDireita(10)).toBe(-10)
  })
})

describe('movimentoDoHorizonte', () => {
  it('deve descer o horizonte com o nariz para cima e girar anti-horário com rolagem à direita', () => {
    // Bruto: −5 = nariz 5° para cima; −10 = 10° para a direita.
    expect(movimentoDoHorizonte(-5, -10)).toEqual({
      rotacao: -10,
      deslocamento: 5 * PIXELS_POR_GRAU_DE_ARFAGEM,
    })
  })

  it('deve limitar a arfagem do desenho a ±25°', () => {
    expect(movimentoDoHorizonte(-60, 0).deslocamento).toBe(
      ARFAGEM_LIMITE_DESENHO * PIXELS_POR_GRAU_DE_ARFAGEM
    )
    expect(movimentoDoHorizonte(60, 0).deslocamento).toBe(
      -ARFAGEM_LIMITE_DESENHO * PIXELS_POR_GRAU_DE_ARFAGEM
    )
  })

  it('deve devolver rotação 0 (e não −0) com asas niveladas', () => {
    expect(Object.is(movimentoDoHorizonte(0, 0).rotacao, 0)).toBe(true)
  })
})

describe('anguloDoFlape', () => {
  it('deve ser proporcional ao percentual, preso entre 0 e 100 %', () => {
    expect(anguloDoFlape(0)).toBe(0)
    expect(anguloDoFlape(50)).toBe(FLAPE_ANGULO_MAXIMO / 2)
    expect(anguloDoFlape(150)).toBe(FLAPE_ANGULO_MAXIMO)
  })
})
