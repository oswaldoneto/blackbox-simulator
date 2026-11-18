import React from 'react'
import { ParameterIndicator } from './parameter-indicator'
import type { EstadoPainel } from './panel-state'
import type { ParametroDeVoo } from '../../shared/types'
import { JANELA_VAZIA } from './janela-de-leituras'
import type { JanelaDeLeituras } from './janela-de-leituras'
import { LEGENDA_DOS_GRAFICOS } from './texto-do-indicador'
import { useAgoraDoPainel } from './use-agora-do-painel'
import './realtime-panel.css'

interface RealtimePanelProps {
  parametros: ParametroDeVoo[]
  valores: Record<string, number>
  estado: Exclude<EstadoPainel, 'sem-sessao'>
  /** Verdadeiro quando a consulta dos parâmetros ativos falhou. */
  erroParametros?: boolean
  /** Parâmetros que a aeronave da sessão não possui (RN-007), exibidos como "N/A". */
  parametrosNaoAplicaveis?: readonly string[]
  /** Leituras dos últimos 2 minutos da sessão, para os gráficos de linha (CA-002-7). */
  janela?: JanelaDeLeituras
  /** A conexão caiu com a sessão ativa e os valores foram descartados (ver `useLiveReadings`). */
  valoresDescartados?: boolean
}

export function RealtimePanel({
  parametros,
  valores,
  estado,
  erroParametros = false,
  parametrosNaoAplicaveis = [],
  janela = JANELA_VAZIA,
  valoresDescartados = false,
}: RealtimePanelProps): React.ReactElement {
  const semSinal = estado === 'sem-sinal'
  const semParametrosPorErro = erroParametros && parametros.length === 0
  const agora = useAgoraDoPainel(estado, janela.ultimoInstante)
  // Linha cinza no sem sinal e na sessão encerrada com os valores descartados (CA-002-4).
  const linhaCinza = semSinal || (estado === 'encerrada' && valoresDescartados)

  return (
    <section className="realtime-panel" aria-label="Painel de tempo real">
      <div className="realtime-panel__header">
        {/* Sem role="status": o anúncio fica com a notificação "Sessão encerrada. Dados salvos." */}
        {estado === 'encerrada' && <p className="realtime-panel__notice">Sessão encerrada</p>}
        {semSinal && (
          <p className="realtime-panel__notice" role="status">
            Sem sinal do simulador
          </p>
        )}
        {semParametrosPorErro ? (
          <p className="realtime-panel__notice">Não foi possível carregar os parâmetros.</p>
        ) : (
          <p className="realtime-panel__legend">{LEGENDA_DOS_GRAFICOS}</p>
        )}
      </div>
      {!semParametrosPorErro && (
        <div className="realtime-grid">
          {parametros.map((parametro) => (
            <ParameterIndicator
              key={parametro.id}
              parametroId={parametro.id}
              nome={parametro.nome}
              unidade={parametro.unidade}
              // Precedência: N/A, depois "—" (sem sinal), depois o valor.
              naoAplicavel={parametrosNaoAplicaveis.includes(parametro.id)}
              valor={semSinal ? null : (valores[parametro.id] ?? null)}
              pontos={janela.series[parametro.id]}
              agora={agora}
              linhaCinza={linhaCinza}
            />
          ))}
        </div>
      )}
    </section>
  )
}
