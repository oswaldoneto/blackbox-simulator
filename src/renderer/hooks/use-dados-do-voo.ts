import { useEffect, useState } from 'react'
import { listActiveParametros } from '../ipc/parameter-ipc'
import { getLeiturasDoVoo } from '../ipc/session-ipc'
import { CARREGANDO_LIMITE_MS } from '../components/limites-de-tempo'
import type { LeiturasDoVoo, ParametroDeVoo } from '../../shared/types'

/** Marca de desempenho do pedido dos dados do voo (medição do voo longo, loop-006). */
export const MARCA_PEDIDO_DADOS_DO_VOO = 'debriefing:pedido'

export type DadosDoVoo =
  | { estado: 'carregando'; mostrarCarregando: boolean }
  | { estado: 'erro' }
  | { estado: 'pronto'; parametros: ParametroDeVoo[]; leituras: LeiturasDoVoo }

const CARREGANDO_SEM_MENSAGEM: DadosDoVoo = { estado: 'carregando', mostrarCarregando: false }

function marcar(nome: string): void {
  if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
    performance.mark(nome)
  }
}

/**
 * Mede, no painel Performance do DevTools, o tempo do pedido dos dados até o primeiro
 * desenho com eles (medição do voo longo, loop-006). Não faz nada sem a API de medição.
 */
export function medirPrimeiroDesenho(): void {
  if (
    typeof performance === 'undefined' ||
    typeof performance.measure !== 'function' ||
    typeof performance.getEntriesByName !== 'function' ||
    performance.getEntriesByName(MARCA_PEDIDO_DADOS_DO_VOO).length === 0
  ) {
    return
  }
  performance.measure('debriefing:primeiro-desenho', MARCA_PEDIDO_DADOS_DO_VOO)
}

/**
 * Dados do debriefing de um voo (UC-005): pede juntos o catálogo dos parâmetros ativos
 * (RN-002) e as leituras do voo. Mostra o carregando só depois de 500 ms; numa falha, loga
 * e devolve o erro. Respostas que chegam depois de desmontar, ou de outro voo, são
 * descartadas. Sem cache: abrir o voo de novo busca de novo.
 */
export function useDadosDoVoo(sessaoId: string): DadosDoVoo {
  const [dados, setDados] = useState<DadosDoVoo>(CARREGANDO_SEM_MENSAGEM)
  const [voo, setVoo] = useState<string>(sessaoId)

  // Outro voo na mesma montagem: volta ao carregando, ajustado durante a renderização.
  let atual = dados
  if (voo !== sessaoId) {
    atual = CARREGANDO_SEM_MENSAGEM
    setVoo(sessaoId)
    setDados(atual)
  }

  useEffect(() => {
    let ativo = true

    const timerCarregando = setTimeout(() => {
      if (ativo) {
        setDados((anterior) =>
          anterior.estado === 'carregando'
            ? { estado: 'carregando', mostrarCarregando: true }
            : anterior
        )
      }
    }, CARREGANDO_LIMITE_MS)

    marcar(MARCA_PEDIDO_DADOS_DO_VOO)
    Promise.all([listActiveParametros(), getLeiturasDoVoo(sessaoId)])
      .then(([catalogo, leituras]) => {
        if (!ativo || leituras.sessaoId !== sessaoId) {
          return
        }
        clearTimeout(timerCarregando)
        setDados({
          estado: 'pronto',
          parametros: catalogo.filter((p) => p.ativo),
          leituras,
        })
      })
      .catch((falha: unknown) => {
        console.error('[useDadosDoVoo] Falha ao carregar os dados do voo:', falha)
        if (!ativo) {
          return
        }
        clearTimeout(timerCarregando)
        setDados({ estado: 'erro' })
      })

    return () => {
      ativo = false
      clearTimeout(timerCarregando)
    }
  }, [sessaoId])

  return atual
}
