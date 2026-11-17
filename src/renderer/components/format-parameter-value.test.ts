import { describe, it, expect } from 'vitest'
import {
  formatParameterValue,
  SEM_VALOR,
  PITCH_POSITIVO_NARIZ_PARA_BAIXO,
  BANK_POSITIVO_PARA_ESQUERDA,
} from './format-parameter-value'

/** Sinal de menos tipográfico (U+2212). */
const MENOS = '−'

/** Valor bruto do SimConnect que corresponde a arfagem com o nariz para cima. */
function arfagemNarizParaCima(graus: number): number {
  return PITCH_POSITIVO_NARIZ_PARA_BAIXO ? -graus : graus
}

/** Valor bruto do SimConnect que corresponde a rolagem para a direita. */
function rolagemParaDireita(graus: number): number {
  return BANK_POSITIVO_PARA_ESQUERDA ? -graus : graus
}

describe('formatParameterValue', () => {
  describe('sem valor válido', () => {
    it.each([
      ['null', null],
      ['NaN', Number.NaN],
      ['Infinity', Number.POSITIVE_INFINITY],
      ['-Infinity', Number.NEGATIVE_INFINITY],
    ])('deve devolver "—" para %s', (_nome, valor) => {
      expect(formatParameterValue('altitude_msl', valor)).toBe(SEM_VALOR)
      expect(SEM_VALOR).toBe('—')
    })
  })

  describe('Altitude MSL', () => {
    it('deve formatar inteiro com ponto de milhar pt-BR', () => {
      expect(formatParameterValue('altitude_msl', 4500)).toBe('4.500')
      expect(formatParameterValue('altitude_msl', 12345.6)).toBe('12.346')
    })

    it('deve usar só o sinal "−" (U+2212) para negativos, sem "+" para positivos', () => {
      expect(formatParameterValue('altitude_msl', -120)).toBe(`${MENOS}120`)
      expect(formatParameterValue('altitude_msl', 120)).toBe('120')
    })

    it('deve mostrar "0" e não "−0" para valores que arredondam para zero', () => {
      expect(formatParameterValue('altitude_msl', -0.3)).toBe('0')
      expect(formatParameterValue('altitude_msl', -0)).toBe('0')
    })
  })

  describe('Velocidade IAS', () => {
    it('deve formatar inteiro', () => {
      expect(formatParameterValue('airspeed_ias', 112.4)).toBe('112')
      expect(formatParameterValue('airspeed_ias', 1234)).toBe('1.234')
    })

    it('deve transformar negativo em 0', () => {
      expect(formatParameterValue('airspeed_ias', -3)).toBe('0')
      expect(formatParameterValue('airspeed_ias', -0.2)).toBe('0')
    })
  })

  describe('Velocidade vertical', () => {
    it('deve arredondar para múltiplo de 10 com "+" explícito', () => {
      expect(formatParameterValue('vertical_speed', 647)).toBe('+650')
      expect(formatParameterValue('vertical_speed', 1234)).toBe('+1.230')
    })

    it('deve usar "−" para descida', () => {
      expect(formatParameterValue('vertical_speed', -644)).toBe(`${MENOS}640`)
    })

    it('deve mostrar "0" sem sinal quando arredonda para zero', () => {
      expect(formatParameterValue('vertical_speed', 3)).toBe('0')
      expect(formatParameterValue('vertical_speed', -4)).toBe('0')
      expect(formatParameterValue('vertical_speed', 0)).toBe('0')
    })
  })

  describe('Rumo magnético', () => {
    it('deve usar três dígitos com zeros à esquerda', () => {
      expect(formatParameterValue('heading_magnetic', 5)).toBe('005')
      expect(formatParameterValue('heading_magnetic', 45.4)).toBe('045')
      expect(formatParameterValue('heading_magnetic', 359.4)).toBe('359')
    })

    it('deve transformar 360 em 000', () => {
      expect(formatParameterValue('heading_magnetic', 360)).toBe('000')
      expect(formatParameterValue('heading_magnetic', 359.6)).toBe('000')
    })

    it('deve normalizar valores fora de 0 a 359', () => {
      expect(formatParameterValue('heading_magnetic', -10)).toBe('350')
      expect(formatParameterValue('heading_magnetic', 725)).toBe('005')
    })
  })

  describe('Arfagem', () => {
    it('deve mostrar "+" com o nariz para cima e uma casa com vírgula', () => {
      expect(formatParameterValue('pitch', arfagemNarizParaCima(5.2))).toBe('+5,2')
    })

    it('deve mostrar "−" com o nariz para baixo', () => {
      expect(formatParameterValue('pitch', arfagemNarizParaCima(-3.2))).toBe(`${MENOS}3,2`)
      expect(formatParameterValue('pitch', arfagemNarizParaCima(-7))).toBe(`${MENOS}7,0`)
    })

    it('deve mostrar "0,0" sem sinal perto de zero', () => {
      expect(formatParameterValue('pitch', 0)).toBe('0,0')
      expect(formatParameterValue('pitch', 0.04)).toBe('0,0')
      expect(formatParameterValue('pitch', -0.04)).toBe('0,0')
    })
  })

  describe('Rolagem', () => {
    it('deve mostrar valor absoluto com "D" para a direita', () => {
      expect(formatParameterValue('bank', rolagemParaDireita(12.3))).toBe('12,3 D')
    })

    it('deve mostrar valor absoluto com "E" para a esquerda', () => {
      expect(formatParameterValue('bank', rolagemParaDireita(-12.3))).toBe('12,3 E')
    })

    it('deve mostrar "0,0" sem letra perto de zero', () => {
      expect(formatParameterValue('bank', 0)).toBe('0,0')
      expect(formatParameterValue('bank', 0.04)).toBe('0,0')
      expect(formatParameterValue('bank', -0.04)).toBe('0,0')
    })

    it('não deve usar sinal "+" nem "−" na rolagem', () => {
      const texto = formatParameterValue('bank', rolagemParaDireita(-30))
      expect(texto).not.toMatch(/[+−-]/)
    })
  })

  describe('parâmetro sem regra específica', () => {
    it('deve usar uma casa decimal pt-BR e "−" para negativos', () => {
      expect(formatParameterValue('outro', 1234.56)).toBe('1.234,6')
      expect(formatParameterValue('outro', -1.26)).toBe(`${MENOS}1,3`)
      expect(formatParameterValue('outro', -0.01)).toBe('0,0')
    })
  })
})
