import { SEM_DADOS_LIMITE_MS } from '../../components/limites-de-tempo'
import type { SerieDeLeituras } from '../../../shared/types'

/**
 * Índice da última leitura com instante menor ou igual a `instanteMs` (busca binária),
 * ou -1 se todas as leituras são posteriores. `instantes` está em ordem crescente.
 */
export function indiceAteOInstante(instantes: readonly number[], instanteMs: number): number {
  let baixo = 0
  let alto = instantes.length - 1
  let resposta = -1
  while (baixo <= alto) {
    const meio = (baixo + alto) >>> 1
    if (instantes[meio] <= instanteMs) {
      resposta = meio
      baixo = meio + 1
    } else {
      alto = meio - 1
    }
  }
  return resposta
}

/**
 * Valor gravado no instante (UC-005, sem interpolação): a última leitura até o instante.
 * Devolve `null` quando não há leitura até o instante ou quando ela tem 2000 ms ou mais
 * (`SEM_DADOS_LIMITE_MS`, o mesmo limite do "Sem sinal" do painel).
 */
export function valorNoInstante(serie: SerieDeLeituras | undefined, instanteMs: number): number | null {
  if (serie === undefined) {
    return null
  }
  const indice = indiceAteOInstante(serie.instantes, instanteMs)
  if (indice === -1) {
    return null
  }
  if (instanteMs - serie.instantes[indice] >= SEM_DADOS_LIMITE_MS) {
    return null
  }
  return serie.valores[indice]
}

/**
 * Estado de um parâmetro no instante selecionado do debriefing, em ordem de precedência:
 * - `nao-aplicavel`: a aeronave da sessão não possui o item (RN-007);
 * - `sem-dados-no-voo`: parâmetro aplicável sem nenhuma leitura no voo;
 * - `sem-dados`: sem leitura nos 2 s até o instante ("—");
 * - `valor`: o valor gravado.
 */
export type EstadoDoParametro =
  | { tipo: 'nao-aplicavel' }
  | { tipo: 'sem-dados-no-voo' }
  | { tipo: 'sem-dados' }
  | { tipo: 'valor'; valor: number }

export function estadoDoParametro(
  parametroId: string,
  series: ReadonlyMap<string, SerieDeLeituras>,
  parametrosNaoAplicaveis: readonly string[],
  instanteMs: number
): EstadoDoParametro {
  if (parametrosNaoAplicaveis.includes(parametroId)) {
    return { tipo: 'nao-aplicavel' }
  }
  const serie = series.get(parametroId)
  if (serie === undefined || serie.instantes.length === 0) {
    return { tipo: 'sem-dados-no-voo' }
  }
  const valor = valorNoInstante(serie, instanteMs)
  return valor === null ? { tipo: 'sem-dados' } : { tipo: 'valor', valor }
}
