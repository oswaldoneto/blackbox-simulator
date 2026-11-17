import { useState, useEffect } from 'react'
import { listActiveParametros } from '../ipc/parameter-ipc'
import type { ParametroDeVoo } from '../../shared/types'
import { PARAMETER_IDS, isParametroId } from '../../shared/parameter-ids'
import type { ParametroId } from '../../shared/parameter-ids'

/**
 * Ordem de exibição na grade do painel de tempo real, por grupos (4 por linha
 * na largura cheia):
 * linha 1 (voo) com Altitude MSL, Velocidade IAS, Velocidade vertical e Rumo magnético;
 * linha 2 (atitude e posição) com Arfagem, Rolagem, Latitude e Longitude;
 * linha 3 (motor e configuração) com Manete, Mistura, RPM e Flapes.
 */
export const PARAMETER_DISPLAY_ORDER: readonly ParametroId[] = [
  PARAMETER_IDS.ALTITUDE_MSL,
  PARAMETER_IDS.AIRSPEED_IAS,
  PARAMETER_IDS.VERTICAL_SPEED,
  PARAMETER_IDS.HEADING_MAGNETIC,
  PARAMETER_IDS.PITCH,
  PARAMETER_IDS.BANK,
  PARAMETER_IDS.LATITUDE,
  PARAMETER_IDS.LONGITUDE,
  PARAMETER_IDS.THROTTLE_1,
  PARAMETER_IDS.MIXTURE_1,
  PARAMETER_IDS.RPM_1,
  PARAMETER_IDS.FLAPS,
]

function posicaoDeExibicao(parametroId: string): number {
  const indice = isParametroId(parametroId) ? PARAMETER_DISPLAY_ORDER.indexOf(parametroId) : -1
  return indice === -1 ? PARAMETER_DISPLAY_ORDER.length : indice
}

export function ordenarParaExibicao(parametros: ParametroDeVoo[]): ParametroDeVoo[] {
  return [...parametros].sort((a, b) => posicaoDeExibicao(a.id) - posicaoDeExibicao(b.id))
}

interface UseActiveParametersReturn {
  parametros: ParametroDeVoo[]
  /** Verdadeiro quando a consulta dos parâmetros ativos falhou. */
  erro: boolean
}

export function useActiveParameters(): UseActiveParametersReturn {
  const [parametros, setParametros] = useState<ParametroDeVoo[]>([])
  const [erro, setErro] = useState<boolean>(false)

  useEffect(() => {
    let ativo = true
    listActiveParametros()
      .then((lista) => {
        if (ativo) {
          setParametros(ordenarParaExibicao(lista.filter((p) => p.ativo)))
        }
      })
      .catch((falha: unknown) => {
        console.error('[useActiveParameters] Falha ao listar os parâmetros ativos:', falha)
        if (ativo) {
          setErro(true)
        }
      })
    return () => {
      ativo = false
    }
  }, [])

  return { parametros, erro }
}
