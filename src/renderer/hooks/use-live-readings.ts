import { useState, useEffect } from 'react'
import { onParameterReadings } from '../ipc/parameter-ipc'
import type { EstadoConexao, Sessao } from '../../shared/types'

import { SEM_DADOS_LIMITE_MS } from '../components/limites-de-tempo'
import { JANELA_VAZIA, acrescentarPacote } from '../components/janela-de-leituras'
import type { JanelaDeLeituras } from '../components/janela-de-leituras'

interface EstadoLeituras {
  sessaoId: string | null
  valores: Record<string, number>
  semDados: boolean
  janela: JanelaDeLeituras
  valoresDescartados: boolean
}

interface UseLiveReadingsReturn {
  /** Último valor recebido de cada parâmetro, por `parametroId`. */
  valores: Record<string, number>
  /** Verdadeiro quando passou `SEM_DADOS_LIMITE_MS` sem pacote novo da sessão ativa. */
  semDados: boolean
  /** Leituras dos últimos 2 minutos da sessão, para os gráficos de linha do painel. */
  janela: JanelaDeLeituras
  /**
   * Verdadeiro quando a conexão caiu com a sessão ativa e os valores foram descartados, até
   * chegar um pacote novo. Na sessão encerrada, indica que os valores ficaram "—".
   */
  valoresDescartados: boolean
}

function estadoInicial(sessaoId: string | null): EstadoLeituras {
  return { sessaoId, valores: {}, semDados: false, janela: JANELA_VAZIA, valoresDescartados: false }
}

/**
 * Valores em tempo real da sessão e janela dos gráficos, para exibição (estado temporário
 * de tela).
 * - Nova sessão zera os valores e a janela.
 * - Desconexão com sessão ativa zera os valores e mantém a janela; a reconexão continua a
 *   mesma janela, e a falha fica visível na linha.
 * - Sessão encerrada congela os últimos valores e a janela e deixa de ouvir pacotes.
 * - Pacotes de outra sessão são ignorados.
 */
export function useLiveReadings(
  sessao: Sessao | null,
  conexao: EstadoConexao
): UseLiveReadingsReturn {
  const sessaoId = sessao?.id ?? null
  const sessaoAtiva = sessao !== null && sessao.status === 'ativa'

  const [estado, setEstado] = useState<EstadoLeituras>(() => estadoInicial(sessaoId))
  const [conexaoAnterior, setConexaoAnterior] = useState<EstadoConexao>(conexao)

  // Ajustes derivados das props, feitos durante a renderização.
  let atual = estado
  if (atual.sessaoId !== sessaoId) {
    atual = estadoInicial(sessaoId)
    setEstado(atual)
  }
  if (conexao !== conexaoAnterior) {
    setConexaoAnterior(conexao)
    if (conexao === 'desconectado' && sessaoAtiva) {
      atual = { ...atual, valores: {}, valoresDescartados: true }
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
      setEstado((anterior) => {
        const janelaAnterior = anterior.sessaoId === sessaoId ? anterior.janela : JANELA_VAZIA
        return {
          sessaoId,
          valores,
          semDados: false,
          janela: acrescentarPacote(janelaAnterior, pacote),
          valoresDescartados: false,
        }
      })
    })

    return () => {
      clearTimeout(timer)
      removeListener()
    }
  }, [sessaoId, sessaoAtiva])

  return {
    valores: atual.valores,
    semDados: atual.semDados,
    janela: atual.janela,
    valoresDescartados: atual.valoresDescartados,
  }
}
