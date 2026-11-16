import React, { useEffect } from 'react'
import { useActiveSession } from './hooks/use-active-session'
import { useNotification } from './hooks/use-notification'
import { onSessionStarted, onSessionEnded } from './ipc/session-ipc'
import { StatusBar } from './components/StatusBar'
import { Notification } from './components/Notification'

export function App(): React.ReactElement {
  const { sessaoAtiva, loading } = useActiveSession()
  const { notification, showNotification, clearNotification } = useNotification()

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

  const contentStyle: React.CSSProperties = {
    paddingTop: '64px',
    padding: '64px 16px 16px',
  }

  return (
    <div>
      <StatusBar sessaoAtiva={sessaoAtiva} />
      {notification !== null && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={clearNotification}
        />
      )}
      <main style={contentStyle}>
        {loading && (
          <p style={{ color: 'var(--color-text-secondary)' }}>Aguardando...</p>
        )}
        {!loading && sessaoAtiva === null && (
          <p>Nenhum voo registrado. Inicie o simulador e ligue o motor para começar.</p>
        )}
      </main>
    </div>
  )
}
