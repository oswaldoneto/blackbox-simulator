import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useActiveSession } from './hooks/use-active-session'
import { useNotification } from './hooks/use-notification'
import { useConnectionState } from './hooks/use-connection-state'
import { useActiveParameters } from './hooks/use-active-parameters'
import { useLiveReadings } from './hooks/use-live-readings'
import { onSessionStarted, onSessionEnded, onSessionEndFailed } from './ipc/session-ipc'
import { StatusBar } from './components/StatusBar'
import type { SecaoNavegacao } from './components/StatusBar'
import { Notification } from './components/Notification'
import { RealtimePanel } from './components/realtime-panel'
import { derivePanelState } from './components/panel-state'
import { FlightListPage } from './pages/flight-list/flight-list-page'
import { FlightDetailPage } from './pages/flight-detail/flight-detail-page'
import type { Sessao } from '../shared/types'

/**
 * Tela em exibição (estado de exibição, sem roteador). A coleta e os hooks de sessão,
 * conexão e leituras continuam ativos em qualquer tela. `focarTitulo` indica que o painel
 * foi aberto por uma troca de tela (não pela carga inicial) e deve receber o foco.
 */
type Tela =
  | { nome: 'painel'; focarTitulo: boolean }
  | { nome: 'voos'; focoSessaoId: string | null }
  | { nome: 'voo'; sessao: Sessao }

function secaoDaTela(tela: Tela): SecaoNavegacao {
  return tela.nome === 'painel' ? 'painel' : 'voos'
}

/** Esconde o elemento na tela, mas o mantém para o leitor de tela e para o foco. */
const visualmenteOcultoStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

export function App(): React.ReactElement {
  const { sessaoAtiva, loading } = useActiveSession()
  const conexao = useConnectionState()
  const { parametros, erro: erroParametros } = useActiveParameters()
  const { valores, semDados } = useLiveReadings(sessaoAtiva, conexao)
  const { notification, showNotification, clearNotification } = useNotification()

  // A carga inicial não move o foco: só as trocas de tela o levam ao título.
  const [tela, setTela] = useState<Tela>({ nome: 'painel', focarTitulo: false })
  const tituloPainel = useRef<HTMLHeadingElement>(null)

  const estadoPainel = derivePanelState({ sessao: sessaoAtiva, conexao, semDados })

  useEffect(() => {
    return onSessionStarted(() => {
      // Sessão nova: o painel aparece sozinho, em qualquer tela (UC-002).
      setTela((atual) => (atual.nome === 'painel' ? atual : { nome: 'painel', focarTitulo: true }))
      showNotification('Coleta iniciada', 'success')
    })
  }, [showNotification])

  useEffect(() => {
    if (tela.nome === 'painel' && tela.focarTitulo) {
      tituloPainel.current?.focus()
    }
  }, [tela])

  const navegar = useCallback((secao: SecaoNavegacao): void => {
    setTela((atual) => {
      if (secaoDaTela(atual) === secao && atual.nome !== 'voo') {
        return atual
      }
      return secao === 'painel'
        ? { nome: 'painel', focarTitulo: true }
        : { nome: 'voos', focoSessaoId: null }
    })
  }, [])

  const abrirVoo = useCallback((sessao: Sessao): void => {
    setTela({ nome: 'voo', sessao })
  }, [])

  const voltarParaLista = useCallback((): void => {
    setTela((atual) =>
      atual.nome === 'voo' ? { nome: 'voos', focoSessaoId: atual.sessao.id } : atual
    )
  }, [])

  useEffect(() => {
    return onSessionEnded(() => {
      showNotification('Sessão encerrada. Dados salvos.', 'success')
    })
  }, [showNotification])

  useEffect(() => {
    return onSessionEndFailed(() => {
      showNotification('Não foi possível salvar o encerramento. Os dados do voo foram mantidos e o encerramento será concluído na próxima abertura.', 'error')
    })
  }, [showNotification])

  const contentStyle: React.CSSProperties = {
    padding: '64px 16px 16px',
  }

  return (
    <div>
      <StatusBar
        sessaoAtiva={sessaoAtiva}
        conexao={conexao}
        secaoAtual={secaoDaTela(tela)}
        onNavegar={navegar}
      />
      {notification !== null && (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={clearNotification}
        />
      )}
      <main style={contentStyle}>
        {tela.nome === 'painel' && (
          <h1 ref={tituloPainel} tabIndex={-1} style={visualmenteOcultoStyle}>
            Painel de tempo real
          </h1>
        )}
        {tela.nome === 'painel' && loading && (
          <p style={{ color: 'var(--color-text-secondary)' }}>Aguardando...</p>
        )}
        {tela.nome === 'painel' && !loading && estadoPainel === 'sem-sessao' && (
          <p>Inicie o simulador e ligue o motor para começar</p>
        )}
        {tela.nome === 'painel' && !loading && estadoPainel !== 'sem-sessao' && (
          <RealtimePanel
            parametros={parametros}
            valores={valores}
            estado={estadoPainel}
            erroParametros={erroParametros}
            parametrosNaoAplicaveis={sessaoAtiva?.parametrosNaoAplicaveis ?? []}
          />
        )}
        {tela.nome === 'voos' && (
          <FlightListPage onSelecionar={abrirVoo} focoSessaoId={tela.focoSessaoId} focarTitulo />
        )}
        {tela.nome === 'voo' && (
          // A chave remonta a tela a cada voo: reprodução e dados começam do zero (UC-005).
          <FlightDetailPage key={tela.sessao.id} sessao={tela.sessao} onVoltar={voltarParaLista} />
        )}
      </main>
    </div>
  )
}
