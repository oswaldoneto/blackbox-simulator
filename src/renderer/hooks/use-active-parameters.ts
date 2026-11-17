import { useState, useEffect } from 'react'
import { listActiveParametros } from '../ipc/parameter-ipc'
import type { ParametroDeVoo } from '../../shared/types'

/**
 * Ordem de exibição na grade 3x2 do painel de tempo real:
 * linha 1 com Altitude MSL, IAS e Velocidade vertical;
 * linha 2 com Rumo magnético, Arfagem e Rolagem.
 */
export const PARAMETER_DISPLAY_ORDER: readonly string[] = [
  'altitude_msl',
  'airspeed_ias',
  'vertical_speed',
  'heading_magnetic',
  'pitch',
  'bank',
]

function posicaoDeExibicao(parametroId: string): number {
  const indice = PARAMETER_DISPLAY_ORDER.indexOf(parametroId)
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
