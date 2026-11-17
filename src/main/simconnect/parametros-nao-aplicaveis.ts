import { PARAMETER_IDS } from '../../shared/parameter-ids'
import type { ParametroId } from '../../shared/parameter-ids'

/** Dados da aeronave lidos no momento em que o motor é ligado. Tipo interno do main. */
export interface PerfilDaAeronave {
  /** `ENGINE TYPE` = 0 (pistão). Qualquer outro valor conta como não pistão. */
  motorAPistao: boolean
  /** `FLAPS AVAILABLE` diferente de 0. */
  temFlapes: boolean
}

/**
 * Parâmetros que a aeronave não possui (RN-007), decididos uma vez na criação da sessão.
 * Mistura é N/A se o motor não é a pistão; flapes são N/A se a aeronave não tem flapes.
 * Manete, RPM, latitude, longitude e os parâmetros de voo nunca são N/A.
 */
export function derivarParametrosNaoAplicaveis(perfil: PerfilDaAeronave): ParametroId[] {
  const naoAplicaveis: ParametroId[] = []
  if (!perfil.motorAPistao) naoAplicaveis.push(PARAMETER_IDS.MIXTURE_1)
  if (!perfil.temFlapes) naoAplicaveis.push(PARAMETER_IDS.FLAPS)
  return naoAplicaveis
}
