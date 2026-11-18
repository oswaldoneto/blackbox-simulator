import { useEffect, useState } from 'react'
import { RELOGIO_SEM_SINAL_MS } from './limites-de-tempo'
import type { EstadoPainel } from './panel-state'

type EstadoComSessao = Exclude<EstadoPainel, 'sem-sessao'>

interface EntradaDoAgora {
  estado: EstadoComSessao
  /** Instante (ms UTC) do último pacote aceito na janela; `null` antes do primeiro. */
  ultimoInstante: number | null
  /** Relógio local (ms), que só anda no sem sinal. */
  relogio: number
  /** "Agora" guardado ao encerrar a sessão; `null` se o painel abriu já encerrado. */
  congelado: number | null
}

/**
 * Instante da borda direita dos gráficos do painel (T1 do loop-007), função pura:
 * - sessão ativa: o instante do último pacote, para a ponta da linha ser o valor atual;
 * - sem sinal: o maior entre o relógio e o último pacote, para a linha andar e a falha
 *   crescer à direita (decisão 1);
 * - sessão encerrada: o valor congelado ao encerrar, ou o último pacote.
 */
export function agoraDoPainel({ estado, ultimoInstante, relogio, congelado }: EntradaDoAgora): number | null {
  if (estado === 'sem-sinal') {
    return ultimoInstante === null ? relogio : Math.max(relogio, ultimoInstante)
  }
  if (estado === 'encerrada') {
    return congelado ?? ultimoInstante
  }
  return ultimoInstante
}

/**
 * "Agora" dos gráficos do painel. O relógio local (`setInterval` de 1 s) roda só no sem
 * sinal; na sessão ativa a linha anda com os pacotes. Ao encerrar, guarda o último "agora".
 */
export function useAgoraDoPainel(estado: EstadoComSessao, ultimoInstante: number | null): number | null {
  const [relogio, setRelogio] = useState<number>(() => Date.now())
  const [estadoAnterior, setEstadoAnterior] = useState<EstadoComSessao>(estado)
  const [congelado, setCongelado] = useState<number | null>(null)
  const semSinal = estado === 'sem-sinal'

  // Ajuste derivado das props, feito durante a renderização: ao encerrar, congela o "agora"
  // que estava na tela no estado anterior.
  let congeladoAtual = congelado
  if (estado !== estadoAnterior) {
    setEstadoAnterior(estado)
    congeladoAtual =
      estado === 'encerrada'
        ? agoraDoPainel({ estado: estadoAnterior, ultimoInstante, relogio, congelado })
        : null
    setCongelado(congeladoAtual)
  }

  useEffect(() => {
    if (!semSinal) return
    const atualizar = (): void => setRelogio(Date.now())
    const primeiro = setTimeout(atualizar, 0)
    const intervalo = setInterval(atualizar, RELOGIO_SEM_SINAL_MS)
    return () => {
      clearTimeout(primeiro)
      clearInterval(intervalo)
    }
  }, [semSinal])

  return agoraDoPainel({ estado, ultimoInstante, relogio, congelado: congeladoAtual })
}
