import { estadoDoParametro } from './valor-no-instante'
import type { LeituraDoMostrador } from './leitura-do-mostrador'
import type { ParametroDeVoo, SerieDeLeituras } from '../../../shared/types'

/** O que a tela do voo precisa para montar a leitura de um parâmetro no instante. */
export interface ContextoDoInstante {
  /** Catálogo dos parâmetros ativos, por id (RN-002): rótulo e unidade. */
  catalogo: ReadonlyMap<string, ParametroDeVoo>
  series: ReadonlyMap<string, SerieDeLeituras>
  parametrosNaoAplicaveis: readonly string[]
  instanteMs: number
}

/**
 * Leitura de um parâmetro no instante, com rótulo e unidade do catálogo. Parâmetro fora do
 * catálogo usa o próprio id como rótulo e fica sem unidade.
 */
export function leituraNoInstante(parametroId: string, contexto: ContextoDoInstante): LeituraDoMostrador {
  const parametro = contexto.catalogo.get(parametroId)
  return {
    parametroId,
    rotulo: parametro?.nome ?? parametroId,
    unidade: parametro?.unidade ?? '',
    estado: estadoDoParametro(
      parametroId,
      contexto.series,
      contexto.parametrosNaoAplicaveis,
      contexto.instanteMs
    ),
  }
}
