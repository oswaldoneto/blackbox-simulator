import type { EstadoConexao, Sessao } from '../../shared/types'

/** Estado de exibição do painel de tempo real. */
export type EstadoPainel = 'sem-sessao' | 'encerrada' | 'sem-sinal' | 'ativa'

interface DerivePanelStateInput {
  sessao: Sessao | null
  conexao: EstadoConexao
  /** Verdadeiro quando passou o limite sem pacote novo com a sessão ativa. */
  semDados?: boolean
}

/** Precedência: sem sessão, depois encerrada, depois sem sinal, depois ativa. */
export function derivePanelState({
  sessao,
  conexao,
  semDados = false,
}: DerivePanelStateInput): EstadoPainel {
  if (sessao === null) return 'sem-sessao'
  if (sessao.status !== 'ativa') return 'encerrada'
  if (conexao === 'desconectado' || semDados) return 'sem-sinal'
  return 'ativa'
}
