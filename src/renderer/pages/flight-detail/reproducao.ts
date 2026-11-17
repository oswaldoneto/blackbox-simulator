/** Velocidades de reprodução do debriefing (UC-005). */
export const VELOCIDADES_DE_REPRODUCAO = [1, 4, 16] as const

export type VelocidadeDeReproducao = (typeof VELOCIDADES_DE_REPRODUCAO)[number]

/**
 * Estado da reprodução: posição em segundos desde a hora de início (pode ter fração),
 * se está tocando e a velocidade.
 */
export interface EstadoDaReproducao {
  posicao: number
  tocando: boolean
  velocidade: VelocidadeDeReproducao
}

/** A tela do voo abre pausada em 0:00:00, a 1×. */
export const ESTADO_INICIAL_DA_REPRODUCAO: Readonly<EstadoDaReproducao> = Object.freeze({
  posicao: 0,
  tocando: false,
  velocidade: 1,
})

function limitarPosicao(posicao: number, duracao: number): number {
  const fim = Math.max(0, duracao)
  return Math.min(fim, Math.max(0, posicao))
}

/**
 * Avança a reprodução por `decorridoMs` de relógio, multiplicado pela velocidade. Ao
 * chegar ao fim, para no fim e pausa. Pausada, não muda. Sem timer e sem `Date.now()`.
 */
export function avancarReproducao(
  estado: EstadoDaReproducao,
  decorridoMs: number,
  duracao: number
): EstadoDaReproducao {
  if (!estado.tocando) {
    return estado
  }
  const fim = Math.max(0, duracao)
  const posicao = estado.posicao + (decorridoMs / 1000) * estado.velocidade
  if (posicao >= fim) {
    return { ...estado, posicao: fim, tocando: false }
  }
  return { ...estado, posicao }
}

/** Reproduzir ou pausar. Reproduzir no fim recomeça do zero. */
export function alternarReproducao(estado: EstadoDaReproducao, duracao: number): EstadoDaReproducao {
  if (estado.tocando) {
    return { ...estado, tocando: false }
  }
  const noFim = estado.posicao >= Math.max(0, duracao)
  return { ...estado, tocando: true, posicao: noFim ? 0 : estado.posicao }
}

/** Leva a reprodução a uma posição (linha do tempo), presa entre 0 e a duração. */
export function posicionarReproducao(
  estado: EstadoDaReproducao,
  posicao: number,
  duracao: number
): EstadoDaReproducao {
  return { ...estado, posicao: limitarPosicao(posicao, duracao) }
}

/** Troca a velocidade, sem mudar a posição nem o estado de reprodução. */
export function escolherVelocidade(
  estado: EstadoDaReproducao,
  velocidade: VelocidadeDeReproducao
): EstadoDaReproducao {
  return { ...estado, velocidade }
}
