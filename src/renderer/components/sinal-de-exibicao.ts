import { BANK_POSITIVO_PARA_ESQUERDA, PITCH_POSITIVO_NARIZ_PARA_BAIXO } from './format-parameter-value'

/**
 * Arfagem com o sinal da exibição: positiva com o nariz para cima. A troca de sinal é a
 * própria inversa, então a função também leva o valor de exibição de volta ao bruto.
 */
export function arfagemNarizParaCima(arfagemBruta: number): number {
  return PITCH_POSITIVO_NARIZ_PARA_BAIXO ? -arfagemBruta : arfagemBruta
}

/**
 * Rolagem com sinal positivo para a direita (asa direita baixa). A troca de sinal é a
 * própria inversa, então a função também leva o valor de exibição de volta ao bruto.
 */
export function rolagemParaDireita(rolagemBruta: number): number {
  return BANK_POSITIVO_PARA_ESQUERDA ? -rolagemBruta : rolagemBruta
}
