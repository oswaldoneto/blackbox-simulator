import React, { useEffect } from 'react'
import { useActiveSession } from './hooks/use-active-session'
import { useNotification } from './hooks/use-notification'
import { useConnectionState } from './hooks/use-connection-state'
import { useActiveParameters } from './hooks/use-active-parameters'
import { useLiveReadings } from './hooks/use-live-readings'
import { onSessionStarted, onSessionEnded, onSessionEndFailed } from './ipc/session-ipc'
import { StatusBar } from './components/StatusBar'
import { Notification } from './components/Notification'
import { RealtimePanel } from './components/realtime-panel'
import { derivePanelState } from './components/panel-state'

export function App(): React.ReactElement {
  const { sessaoAtiva, loading } = useActiveSession()
  const conexao = useConnectionState()
  const { parametros, erro: erroParametros } = useActiveParameters()
  const { valores, semDados } = useLiveReadings(sessaoAtiva, conexao)
  const { notification, showNotification, clearNotification } = useNotification()

  const estadoPainel = derivePanelState({ sessao: sessaoAtiva, conexao, semDados })

  useEffect(() => {
    return onSessionStarted(() => {
      showNotification('Coleta iniciada', 'success')
    })
  }, [showNotification])

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
      <StatusBar sessaoAtiva={sessaoAtiva} conexao={conexao} />
      {notification !== null && (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={clearNotification}
        />
      )}
      <main style={contentStyle}>
        {loading && (
          <p style={{ color: 'var(--color-text-secondary)' }}>Aguardando...</p>
        )}
        {!loading && estadoPainel === 'sem-sessao' && (
          <p>Inicie o simulador e ligue o motor para começar</p>
        )}
        {!loading && estadoPainel !== 'sem-sessao' && (
          <RealtimePanel
            parametros={parametros}
            valores={valores}
            estado={estadoPainel}
            erroParametros={erroParametros}
            parametrosNaoAplicaveis={sessaoAtiva?.parametrosNaoAplicaveis ?? []}
          />
        )}
      </main>
    </div>
  )
}
