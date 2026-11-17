import { useState, useEffect } from 'react'
import { onParameterReadings } from '../ipc/parameter-ipc'
import type { EstadoConexao, Sessao } from '../../shared/types'

/** Tempo sem pacote novo, com a sessão ativa, após o qual os valores viram "—". */
export const SEM_DADOS_LIMITE_MS = 2000

interface EstadoLeituras {
  sessaoId: string | null
  valores: Record<string, number>
  semDados: boolean
}

interface UseLiveReadingsReturn {
  /** Último valor recebido de cada parâmetro, por `parametroId`. */
  valores: Record<string, number>
  /** Verdadeiro quando passou `SEM_DADOS_LIMITE_MS` sem pacote novo da sessão ativa. */
  semDados: boolean
}

/**
 * Valores em tempo real da sessão, para exibição (estado temporário de tela).
 * - Nova sessão zera os valores.
 * - Desconexão com sessão ativa zera os valores.
 * - Sessão encerrada congela os últimos valores e deixa de ouvir pacotes.
 * - Pacotes de outra sessão são ignorados.
 */
export function useLiveReadings(
  sessao: Sessao | null,
  conexao: EstadoConexao
): UseLiveReadingsReturn {
  const sessaoId = sessao?.id ?? null
  const sessaoAtiva = sessao !== null && sessao.status === 'ativa'

  const [estado, setEstado] = useState<EstadoLeituras>({
    sessaoId,
    valores: {},
    semDados: false,
  })
  const [conexaoAnterior, setConexaoAnterior] = useState<EstadoConexao>(conexao)

  // Ajustes derivados das props, feitos durante a renderização.
  let atual = estado
  if (atual.sessaoId !== sessaoId) {
    atual = { sessaoId, valores: {}, semDados: false }
    setEstado(atual)
  }
  if (conexao !== conexaoAnterior) {
    setConexaoAnterior(conexao)
    if (conexao === 'desconectado' && sessaoAtiva) {
      atual = { ...atual, valores: {} }
      setEstado(atual)
    }
  }

  useEffect(() => {
    if (!sessaoAtiva || sessaoId === null) return

    const marcarSemDados = (): void => {
      setEstado((anterior) =>
        anterior.sessaoId === sessaoId && !anterior.semDados
          ? { ...anterior, semDados: true }
          : anterior
      )
    }

    let timer = setTimeout(marcarSemDados, SEM_DADOS_LIMITE_MS)

    const removeListener = onParameterReadings((pacote) => {
      if (pacote.sessaoId !== sessaoId) return

      clearTimeout(timer)
      timer = setTimeout(marcarSemDados, SEM_DADOS_LIMITE_MS)

      const valores: Record<string, number> = {}
      for (const leitura of pacote.leituras) {
        valores[leitura.parametroId] = leitura.valor
      }
      setEstado({ sessaoId, valores, semDados: false })
    })

    return () => {
      clearTimeout(timer)
      removeListener()
    }
  }, [sessaoId, sessaoAtiva])

  return { valores: atual.valores, semDados: atual.semDados }
}
