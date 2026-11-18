import { describe, it, expect } from 'vitest'
import { arfagemNarizParaCima, rolagemParaDireita } from './sinal-de-exibicao'

// CA-005-2: sinal de arfagem e rolagem corrigido
describe('arfagemNarizParaCima', () => {
  it('deve exibir arfagem positiva com o nariz para cima (valor bruto positivo é nariz para baixo)', () => {
    expect(arfagemNarizParaCima(-5)).toBe(5)
    expect(arfagemNarizParaCima(5)).toBe(-5)
  })

  it('deve levar o valor de exibição de volta ao bruto (a troca de sinal é a própria inversa)', () => {
    expect(arfagemNarizParaCima(arfagemNarizParaCima(7.5))).toBe(7.5)
  })
})

describe('rolagemParaDireita', () => {
  it('deve exibir rolagem positiva para a direita (valor bruto positivo é para a esquerda)', () => {
    expect(rolagemParaDireita(-10)).toBe(10)
    expect(rolagemParaDireita(10)).toBe(-10)
  })

  it('deve levar o valor de exibição de volta ao bruto (a troca de sinal é a própria inversa)', () => {
    expect(rolagemParaDireita(rolagemParaDireita(-12.5))).toBe(-12.5)
  })
})
