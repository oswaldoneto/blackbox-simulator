import { PARAMETER_IDS, isParametroId } from '../../shared/parameter-ids'
import type { ParametroId } from '../../shared/parameter-ids'

/** Grupo do parâmetro no painel, que dá a cor da linha (CA-002-13). */
export type GrupoDoGrafico = 'voo' | 'atitude-posicao' | 'motor-configuracao'

/**
 * Escala do gráfico de linha (CA-002-8).
 * - `fixa`: de `min` a `max`; `circular` marca o rumo, que dá a volta em 360°.
 * - `centro-zero`: zero no meio, simétrica, com meia amplitude de pelo menos `meiaAmplitudeMinima`.
 * - `automatica`: segue as leituras com folga, com amplitude total de pelo menos
 *   `amplitudeMinima`; `piso`, se houver, é o menor limite inferior possível.
 */
export type EscalaConfig =
  | { tipo: 'fixa'; min: number; max: number; circular: boolean }
  | { tipo: 'centro-zero'; meiaAmplitudeMinima: number }
  | { tipo: 'automatica'; amplitudeMinima: number; piso: number | null }

export interface ConfigDoGrafico {
  grupo: GrupoDoGrafico
  escala: EscalaConfig
}

const PERCENTUAL: EscalaConfig = { tipo: 'fixa', min: 0, max: 100, circular: false }

/** Grupo e escala de cada parâmetro do painel (decisões 5 e 14 da 1.1 do loop-007). */
export const CONFIG_GRAFICO_PAINEL: Readonly<Record<ParametroId, ConfigDoGrafico>> = {
  [PARAMETER_IDS.ALTITUDE_MSL]: {
    grupo: 'voo',
    escala: { tipo: 'automatica', amplitudeMinima: 200, piso: null },
  },
  [PARAMETER_IDS.AIRSPEED_IAS]: {
    grupo: 'voo',
    escala: { tipo: 'automatica', amplitudeMinima: 20, piso: 0 },
  },
  [PARAMETER_IDS.VERTICAL_SPEED]: {
    grupo: 'voo',
    escala: { tipo: 'centro-zero', meiaAmplitudeMinima: 300 },
  },
  [PARAMETER_IDS.HEADING_MAGNETIC]: {
    grupo: 'voo',
    escala: { tipo: 'fixa', min: 0, max: 360, circular: true },
  },
  [PARAMETER_IDS.PITCH]: {
    grupo: 'atitude-posicao',
    escala: { tipo: 'centro-zero', meiaAmplitudeMinima: 5 },
  },
  [PARAMETER_IDS.BANK]: {
    grupo: 'atitude-posicao',
    escala: { tipo: 'centro-zero', meiaAmplitudeMinima: 15 },
  },
  [PARAMETER_IDS.LATITUDE]: {
    grupo: 'atitude-posicao',
    escala: { tipo: 'automatica', amplitudeMinima: 0.01, piso: null },
  },
  [PARAMETER_IDS.LONGITUDE]: {
    grupo: 'atitude-posicao',
    escala: { tipo: 'automatica', amplitudeMinima: 0.01, piso: null },
  },
  [PARAMETER_IDS.THROTTLE_1]: { grupo: 'motor-configuracao', escala: PERCENTUAL },
  [PARAMETER_IDS.MIXTURE_1]: { grupo: 'motor-configuracao', escala: PERCENTUAL },
  [PARAMETER_IDS.RPM_1]: {
    grupo: 'motor-configuracao',
    escala: { tipo: 'automatica', amplitudeMinima: 500, piso: 0 },
  },
  [PARAMETER_IDS.FLAPS]: { grupo: 'motor-configuracao', escala: PERCENTUAL },
}

/** Configuração do gráfico do parâmetro; `null` para um parâmetro desconhecido (sem gráfico). */
export function configDoGrafico(parametroId: string): ConfigDoGrafico | null {
  return isParametroId(parametroId) ? CONFIG_GRAFICO_PAINEL[parametroId] : null
}
