import { PARAMETER_IDS } from '../../shared/parameter-ids'
import type { EscalaConfig } from './config-grafico-painel'
import { arfagemNarizParaCima, rolagemParaDireita } from './sinal-de-exibicao'

/** Folga das escalas automática e de zero no centro: 15 % além das leituras (decisão 5). */
export const FOLGA_DA_ESCALA = 0.15

/** Limites de uma escala do gráfico, em valores de exibição. */
export interface EscalaDoGrafico {
  min: number
  max: number
}

/**
 * Valor de uma leitura bruta no gráfico, com o sinal da exibição (CA-002-8):
 * - arfagem positiva com o nariz para cima;
 * - rolagem positiva para a direita, que fica em cima (T4 do loop-007);
 * - rumo de 0 a 360, em módulo 360.
 * Os outros parâmetros ficam como vieram.
 */
export function valorNoGrafico(parametroId: string, valorBruto: number): number {
  switch (parametroId) {
    case PARAMETER_IDS.PITCH:
      return arfagemNarizParaCima(valorBruto)
    case PARAMETER_IDS.BANK:
      return rolagemParaDireita(valorBruto)
    case PARAMETER_IDS.HEADING_MAGNETIC:
      return ((valorBruto % 360) + 360) % 360
    default:
      return valorBruto
  }
}

/**
 * Leva um valor de exibição de volta ao bruto, para formatá-lo com `formatParameterValue`.
 * As trocas de sinal da arfagem e da rolagem são a própria inversa.
 */
export function valorBrutoDoGrafico(parametroId: string, valorExibido: number): number {
  switch (parametroId) {
    case PARAMETER_IDS.PITCH:
      return arfagemNarizParaCima(valorExibido)
    case PARAMETER_IDS.BANK:
      return rolagemParaDireita(valorExibido)
    default:
      return valorExibido
  }
}

/**
 * Escala do gráfico para os valores de exibição da janela (CA-002-8 e CA-002-9).
 * - Fixa: sempre os limites configurados.
 * - Zero no centro: simétrica, com 15 % de folga sobre o maior valor absoluto e a meia
 *   amplitude mínima; sem leituras, só a mínima.
 * - Automática: centrada nas leituras, com 15 % de folga e a amplitude mínima, o que deixa
 *   um valor constante no meio. Com piso, a faixa sobe até o piso mantendo a amplitude (T5).
 *   Sem leituras, `null`: os limites ficam escondidos (T8).
 */
export function escalaDoGrafico(
  config: EscalaConfig,
  valores: readonly number[]
): EscalaDoGrafico | null {
  if (config.tipo === 'fixa') {
    return { min: config.min, max: config.max }
  }

  let menor = Infinity
  let maior = -Infinity
  for (const valor of valores) {
    if (!Number.isFinite(valor)) continue
    if (valor < menor) menor = valor
    if (valor > maior) maior = valor
  }
  const temValores = menor <= maior

  if (config.tipo === 'centro-zero') {
    const extremo = temValores ? Math.max(Math.abs(menor), Math.abs(maior)) * (1 + FOLGA_DA_ESCALA) : 0
    const meia = Math.max(extremo, config.meiaAmplitudeMinima)
    return { min: -meia, max: meia }
  }

  if (!temValores) return null
  const meio = (menor + maior) / 2
  const meia = Math.max(((maior - menor) / 2) * (1 + FOLGA_DA_ESCALA), config.amplitudeMinima / 2)
  let min = meio - meia
  let max = meio + meia
  if (config.piso !== null && min < config.piso) {
    min = config.piso
    max = config.piso + 2 * meia
  }
  return { min, max }
}
