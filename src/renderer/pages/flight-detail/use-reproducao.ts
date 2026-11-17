import { useCallback, useEffect, useState } from 'react'
import {
  ESTADO_INICIAL_DA_REPRODUCAO,
  alternarReproducao,
  avancarReproducao,
  escolherVelocidade,
  posicionarReproducao,
} from './reproducao'
import type { EstadoDaReproducao, VelocidadeDeReproducao } from './reproducao'

/** Passo do relógio da reprodução (UC-005). */
export const INTERVALO_DA_REPRODUCAO_MS = 250

interface UseReproducaoReturn {
  reproducao: EstadoDaReproducao
  alternar: () => void
  posicionar: (posicao: number) => void
  mudarVelocidade: (velocidade: VelocidadeDeReproducao) => void
}

/**
 * Reprodução do debriefing (UC-005): abre pausada em 0, a 1×. O `setInterval` de 250 ms só
 * existe enquanto toca, e é limpo ao pausar, ao chegar ao fim e ao desmontar (voltar à
 * lista ou ir ao painel com uma sessão nova).
 */
export function useReproducao(duracao: number): UseReproducaoReturn {
  const [reproducao, setReproducao] = useState<EstadoDaReproducao>(ESTADO_INICIAL_DA_REPRODUCAO)

  useEffect(() => {
    if (!reproducao.tocando) {
      return
    }
    const timer = setInterval(() => {
      setReproducao((atual) => avancarReproducao(atual, INTERVALO_DA_REPRODUCAO_MS, duracao))
    }, INTERVALO_DA_REPRODUCAO_MS)
    return () => {
      clearInterval(timer)
    }
  }, [reproducao.tocando, duracao])

  const alternar = useCallback((): void => {
    setReproducao((atual) => alternarReproducao(atual, duracao))
  }, [duracao])

  const posicionar = useCallback(
    (posicao: number): void => {
      setReproducao((atual) => posicionarReproducao(atual, posicao, duracao))
    },
    [duracao]
  )

  const mudarVelocidade = useCallback((velocidade: VelocidadeDeReproducao): void => {
    setReproducao((atual) => escolherVelocidade(atual, velocidade))
  }, [])

  return { reproducao, alternar, posicionar, mudarVelocidade }
}
