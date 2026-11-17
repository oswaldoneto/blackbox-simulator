import { useState, useEffect } from 'react'
import { listSessoesEncerradas, onSessionEnded } from '../ipc/session-ipc'
import type { Sessao } from '../../shared/types'

import { CARREGANDO_LIMITE_MS } from '../components/limites-de-tempo'

interface UseSessoesEncerradasReturn {
  /** Sessões encerradas, da mais recente para a mais antiga; `null` até a primeira carga. */
  sessoes: Sessao[] | null
  /** Verdadeiro só quando a primeira carga falhou (sem nova tentativa automática). */
  erro: boolean
  /** Verdadeiro quando a primeira carga passou de 500 ms sem resposta. */
  carregando: boolean
}

/**
 * Lista de voos (UC-004): busca as sessões encerradas na montagem e de novo a cada
 * `session:ended`. Só a resposta da busca mais recente vale. Uma falha numa nova busca,
 * com a lista já carregada, mantém a lista anterior e só gera log.
 */
export function useSessoesEncerradas(): UseSessoesEncerradasReturn {
  const [sessoes, setSessoes] = useState<Sessao[] | null>(null)
  const [erro, setErro] = useState<boolean>(false)
  const [carregando, setCarregando] = useState<boolean>(false)

  useEffect(() => {
    let ativo = true
    let ultimaBusca = 0
    let carregou = false

    const timerCarregando = setTimeout(() => {
      if (ativo && !carregou) {
        setCarregando(true)
      }
    }, CARREGANDO_LIMITE_MS)

    const buscar = (): void => {
      ultimaBusca += 1
      const busca = ultimaBusca
      listSessoesEncerradas()
        .then((lista) => {
          // Uma resposta de busca anterior chegando depois da mais recente é descartada.
          if (!ativo || busca !== ultimaBusca) {
            return
          }
          carregou = true
          clearTimeout(timerCarregando)
          setSessoes(lista)
          setErro(false)
          setCarregando(false)
        })
        .catch((falha: unknown) => {
          console.error('[useSessoesEncerradas] Falha ao listar as sessões encerradas:', falha)
          if (!ativo || busca !== ultimaBusca) {
            return
          }
          // Com a lista já carregada, ela continua na tela; o erro só aparece na primeira carga.
          if (!carregou) {
            clearTimeout(timerCarregando)
            setErro(true)
            setCarregando(false)
          }
        })
    }

    const removeEndedListener = onSessionEnded(() => {
      buscar()
    })

    buscar()

    return () => {
      ativo = false
      clearTimeout(timerCarregando)
      removeEndedListener()
    }
  }, [])

  return { sessoes, erro, carregando }
}
