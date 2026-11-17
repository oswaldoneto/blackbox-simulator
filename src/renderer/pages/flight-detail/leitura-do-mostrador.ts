import {
  NAO_APLICAVEL,
  SEM_VALOR,
  formatParameterValue,
} from '../../components/format-parameter-value'
import type { EstadoDoParametro } from './valor-no-instante'

/** Texto de parâmetro aplicável sem nenhuma leitura no voo (CA-005-9). */
export const SEM_DADOS_NO_VOO = 'Sem dados neste voo'

/** Um parâmetro mostrado por um instrumento do debriefing, com o estado no instante. */
export interface LeituraDoMostrador {
  parametroId: string
  rotulo: string
  unidade: string
  estado: EstadoDoParametro
}

/** Valor do instante, ou `null` quando o instrumento não deve desenhar o ponteiro. */
export function valorDoEstado(estado: EstadoDoParametro): number | null {
  return estado.tipo === 'valor' ? estado.valor : null
}

/** Texto visível do valor: formatado, "N/A", "—" ou "Sem dados neste voo". */
export function textoDaLeitura(leitura: LeituraDoMostrador): string {
  switch (leitura.estado.tipo) {
    case 'nao-aplicavel':
      return NAO_APLICAVEL
    case 'sem-dados-no-voo':
      return SEM_DADOS_NO_VOO
    case 'sem-dados':
      return SEM_VALOR
    case 'valor':
      return formatParameterValue(leitura.parametroId, leitura.estado.valor)
  }
}

/**
 * Rótulo acessível de uma leitura, no formato do painel de tempo real: "<rótulo>: <valor>
 * <unidade>", "<rótulo>: não aplicável", "<rótulo>: sem dados" ou "<rótulo>: sem dados
 * neste voo".
 */
export function descricaoDaLeitura(leitura: LeituraDoMostrador): string {
  switch (leitura.estado.tipo) {
    case 'nao-aplicavel':
      return `${leitura.rotulo}: não aplicável`
    case 'sem-dados-no-voo':
      return `${leitura.rotulo}: sem dados neste voo`
    case 'sem-dados':
      return `${leitura.rotulo}: sem dados`
    case 'valor':
      return `${leitura.rotulo}: ${textoDaLeitura(leitura)} ${leitura.unidade}`
  }
}
