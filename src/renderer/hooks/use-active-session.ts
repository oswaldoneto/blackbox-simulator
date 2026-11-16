import { useState, useEffect } from 'react'
import { getActiveSessao, onSessionStarted } from '../ipc/session-ipc'
import type { Sessao } from '../../shared/types'

interface UseActiveSessionReturn {
  sessaoAtiva: Sessao | null
  loading: boolean
}

export function useActiveSession(): UseActiveSessionReturn {
  const [sessaoAtiva, setSessaoAtiva] = useState<Sessao | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    getActiveSessao().then((sessao) => {
      setSessaoAtiva(sessao)
      setLoading(false)
    })

    const removeListener = onSessionStarted((sessao) => {
      setSessaoAtiva(sessao)
    })

    return () => {
      removeListener()
    }
  }, [])

  return { sessaoAtiva, loading }
}
