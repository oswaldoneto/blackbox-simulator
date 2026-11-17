import { describe, it, expect } from 'vitest'
import {
  formatParameterValue,
  SEM_VALOR,
  NAO_APLICAVEL,
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

  // --- UC-006 ---

  describe('N/A', () => {
    it('deve exportar o texto "N/A"', () => {
      expect(NAO_APLICAVEL).toBe('N/A')
    })
  })

  describe('sem valor válido nos parâmetros novos', () => {
    it.each(['latitude', 'longitude', 'throttle_1', 'mixture_1', 'rpm_1', 'flaps'])(
      'deve devolver "—" para null, NaN e Infinity em %s',
      (id) => {
        expect(formatParameterValue(id, null)).toBe(SEM_VALOR)
        expect(formatParameterValue(id, Number.NaN)).toBe(SEM_VALOR)
        expect(formatParameterValue(id, Number.POSITIVE_INFINITY)).toBe(SEM_VALOR)
        expect(formatParameterValue(id, Number.NEGATIVE_INFINITY)).toBe(SEM_VALOR)
      }
    )
  })

  describe('Latitude', () => {
    it('deve usar 5 casas pt-BR, valor absoluto e "S" no hemisfério sul', () => {
      expect(formatParameterValue('latitude', -23.5505199)).toBe('23,55052 S')
    })

    it('deve usar "N" no hemisfério norte', () => {
      expect(formatParameterValue('latitude', 40.7127753)).toBe('40,71278 N')
    })

    it('deve mostrar "0,00000" sem letra no equador e quando arredonda para zero', () => {
      expect(formatParameterValue('latitude', 0)).toBe('0,00000')
      expect(formatParameterValue('latitude', -0)).toBe('0,00000')
      expect(formatParameterValue('latitude', -0.000001)).toBe('0,00000')
      expect(formatParameterValue('latitude', 0.000004)).toBe('0,00000')
    })

    it('não deve usar sinal "+" nem "−"', () => {
      expect(formatParameterValue('latitude', -45.1)).not.toMatch(/[+−-]/)
    })
  })

  describe('Longitude', () => {
    it('deve usar 5 casas pt-BR, valor absoluto e "O" a oeste', () => {
      expect(formatParameterValue('longitude', -46.6333094)).toBe('46,63331 O')
    })

    it('deve usar "L" a leste', () => {
      expect(formatParameterValue('longitude', 2.3522219)).toBe('2,35222 L')
    })

    it('deve manter os 3 dígitos inteiros de longitudes acima de 100', () => {
      expect(formatParameterValue('longitude', -123.456784)).toBe('123,45678 O')
    })

    it('deve mostrar "0,00000" sem letra no meridiano de Greenwich', () => {
      expect(formatParameterValue('longitude', 0)).toBe('0,00000')
      expect(formatParameterValue('longitude', -0.000001)).toBe('0,00000')
    })
  })

  describe('Manete', () => {
    it('deve formatar inteiro', () => {
      expect(formatParameterValue('throttle_1', 85.4)).toBe('85')
      expect(formatParameterValue('throttle_1', 100)).toBe('100')
    })

    it('deve mostrar o reverso com "−" (U+2212)', () => {
      expect(formatParameterValue('throttle_1', -20)).toBe(`${MENOS}20`)
    })

    it('deve mostrar "0" e não "−0"', () => {
      expect(formatParameterValue('throttle_1', -0.3)).toBe('0')
      expect(formatParameterValue('throttle_1', -0)).toBe('0')
    })
  })

  describe('Mistura', () => {
    it('deve formatar inteiro', () => {
      expect(formatParameterValue('mixture_1', 99.6)).toBe('100')
      expect(formatParameterValue('mixture_1', 0)).toBe('0')
    })
  })

  describe('RPM', () => {
    it('deve formatar inteiro com ponto de milhar', () => {
      expect(formatParameterValue('rpm_1', 2450.4)).toBe('2.450')
      expect(formatParameterValue('rpm_1', 850)).toBe('850')
    })

    it('deve mostrar 0 como "0" (motor parado é valor real)', () => {
      expect(formatParameterValue('rpm_1', 0)).toBe('0')
      expect(formatParameterValue('rpm_1', -0.2)).toBe('0')
    })
  })

  describe('Flapes (CA-006-5)', () => {
    it('deve formatar % inteiro', () => {
      expect(formatParameterValue('flaps', 30.4)).toBe('30')
      expect(formatParameterValue('flaps', 0)).toBe('0')
      expect(formatParameterValue('flaps', 100)).toBe('100')
    })

    it('deve limitar a faixa a 0..100', () => {
      expect(formatParameterValue('flaps', 100.4)).toBe('100')
      expect(formatParameterValue('flaps', 130)).toBe('100')
      expect(formatParameterValue('flaps', -5)).toBe('0')
      expect(formatParameterValue('flaps', -0.3)).toBe('0')
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
