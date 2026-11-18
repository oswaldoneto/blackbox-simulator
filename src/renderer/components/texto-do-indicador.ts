import type { FaixaDaJanela } from './desenho-do-grafico'
import { formatParameterValue, SEM_VALOR } from './format-parameter-value'

/** Texto do card N/A no lugar do gráfico (CA-002-18). */
export const TEXTO_SEM_ITEM = 'A aeronave não possui este item'

/** Legenda dos gráficos do painel (decisão 12 da 1.1 do loop-007, opção b). */
export const LEGENDA_DOS_GRAFICOS =
  'Gráficos: últimos 2 minutos. A ponta direita da linha é o valor atual.'

interface EntradaDoTexto {
  parametroId: string
  nome: string
  unidade: string
  /** Valor bruto do parâmetro; `null` é sem sinal. */
  valor: number | null
  naoAplicavel: boolean
  /** Menor e maior leitura da janela; `null` com a janela vazia. */
  faixa: FaixaDaJanela | null
}

/**
 * Rótulo acessível do card do painel (CA-002-18 e CA-002-19), com a precedência do card:
 * - não aplicável: "<rótulo>: não aplicável";
 * - sem sinal: "<rótulo>: sem sinal", seguido da faixa da janela se houver leituras (T7);
 * - valor: "<rótulo>: <valor> <unidade>", seguido da faixa da janela se houver leituras.
 * A faixa é "; últimos 2 minutos: de <mín> a <máx> <unidade>".
 */
export function textoDoIndicador({
  parametroId,
  nome,
  unidade,
  valor,
  naoAplicavel,
  faixa,
}: EntradaDoTexto): string {
  if (naoAplicavel) return `${nome}: não aplicável`

  const valorFormatado = formatParameterValue(parametroId, valor)
  const leitura =
    valorFormatado === SEM_VALOR ? `${nome}: sem sinal` : `${nome}: ${valorFormatado} ${unidade}`
  if (faixa === null) return leitura

  const de = formatParameterValue(parametroId, faixa.de)
  const ate = formatParameterValue(parametroId, faixa.ate)
  return `${leitura}; últimos 2 minutos: de ${de} a ${ate} ${unidade}`
}
