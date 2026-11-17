import { useState, useEffect } from 'react'
import {
  getActiveSessao,
  onSessionStarted,
  onSessionEnded,
  onSessionEndFailed,
} from '../ipc/session-ipc'
import type { Sessao } from '../../shared/types'

interface UseActiveSessionReturn {
  /** Sessão atual: ativa ou, depois do encerramento, a sessão encerrada. */
  sessaoAtiva: Sessao | null
  loading: boolean
}

export function useActiveSession(): UseActiveSessionReturn {
  const [sessaoAtiva, setSessaoAtiva] = useState<Sessao | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let ativo = true
    let recebeuEvento = false

    const removeStartedListener = onSessionStarted((sessao) => {
      recebeuEvento = true
      setSessaoAtiva(sessao)
      setLoading(false)
    })

    const removeEndedListener = onSessionEnded((sessao) => {
      recebeuEvento = true
      setSessaoAtiva(sessao)
      setLoading(false)
    })

    // Falha ao gravar o encerramento: o main já tirou a sessão da memória, então a tela
    // a mostra como encerrada (estado de exibição; no banco ela segue ativa até a
    // próxima abertura do app).
    const removeEndFailedListener = onSessionEndFailed((sessao) => {
      recebeuEvento = true
      setSessaoAtiva({ ...sessao, status: 'encerrada' })
      setLoading(false)
    })

    getActiveSessao()
      .then((sessao) => {
        // Um evento recebido durante a consulta é mais recente que a resposta.
        if (ativo && !recebeuEvento) {
          setSessaoAtiva(sessao)
        }
      })
      .catch((erro: unknown) => {
        console.error('[useActiveSession] Falha ao consultar a sessão ativa:', erro)
      })
      .finally(() => {
        if (ativo) {
          setLoading(false)
        }
      })

    return () => {
      ativo = false
      removeStartedListener()
      removeEndedListener()
      removeEndFailedListener()
    }
  }, [])

  return { sessaoAtiva, loading }
}
