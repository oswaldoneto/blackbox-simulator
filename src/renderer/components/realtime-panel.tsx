import React from 'react'
import { ParameterIndicator } from './parameter-indicator'
import type { EstadoPainel } from './panel-state'
import type { ParametroDeVoo } from '../../shared/types'
import './realtime-panel.css'

interface RealtimePanelProps {
  parametros: ParametroDeVoo[]
  valores: Record<string, number>
  estado: Exclude<EstadoPainel, 'sem-sessao'>
  /** Verdadeiro quando a consulta dos parâmetros ativos falhou. */
  erroParametros?: boolean
}

export function RealtimePanel({
  parametros,
  valores,
  estado,
  erroParametros = false,
}: RealtimePanelProps): React.ReactElement {
  const semSinal = estado === 'sem-sinal'
  const semParametrosPorErro = erroParametros && parametros.length === 0

  return (
    <section className="realtime-panel" aria-label="Painel de tempo real">
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
        <div className="realtime-grid">
          {parametros.map((parametro) => (
            <ParameterIndicator
              key={parametro.id}
              parametroId={parametro.id}
              nome={parametro.nome}
              unidade={parametro.unidade}
              valor={semSinal ? null : (valores[parametro.id] ?? null)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
