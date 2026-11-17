/**
 * Identificadores (slugs) dos parâmetros de voo do conjunto de parâmetros.
 * Fonte única para o main e o renderer. Os mesmos slugs aparecem escritos nas
 * migrations SQL (seed de `parametros_de_voo`), que precisam bater com esta constante.
 */
export const PARAMETER_IDS = {
  ALTITUDE_MSL: 'altitude_msl',
  AIRSPEED_IAS: 'airspeed_ias',
  VERTICAL_SPEED: 'vertical_speed',
  HEADING_MAGNETIC: 'heading_magnetic',
  PITCH: 'pitch',
  BANK: 'bank',
  LATITUDE: 'latitude',
  LONGITUDE: 'longitude',
  THROTTLE_1: 'throttle_1',
  MIXTURE_1: 'mixture_1',
  RPM_1: 'rpm_1',
  FLAPS: 'flaps',
} as const

/** Identificador de um parâmetro de voo conhecido. */
export type ParametroId = (typeof PARAMETER_IDS)[keyof typeof PARAMETER_IDS]

/** Todos os identificadores conhecidos. */
export const TODOS_PARAMETER_IDS: readonly ParametroId[] = Object.values(PARAMETER_IDS)

/** Indica se a string é um identificador de parâmetro conhecido. */
export function isParametroId(valor: string): valor is ParametroId {
  return (TODOS_PARAMETER_IDS as readonly string[]).includes(valor)
}
