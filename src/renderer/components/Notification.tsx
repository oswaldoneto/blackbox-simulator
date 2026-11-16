import React, { useEffect } from 'react'

interface NotificationProps {
  message: string
  type: 'info' | 'success' | 'error'
  onClose: () => void
}

const AUTO_CLOSE_MS = 4000

function getBackgroundColor(type: NotificationProps['type']): string {
  switch (type) {
    case 'info':
      return 'var(--color-accent)'
    case 'success':
      return 'var(--color-success)'
    case 'error':
      return 'var(--color-error)'
  }
}

export function Notification({ message, type, onClose }: NotificationProps): React.ReactElement {
  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_CLOSE_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [onClose])

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '60px',
    right: '16px',
    zIndex: 200,
    padding: '12px 16px',
    borderRadius: '4px',
    background: getBackgroundColor(type),
    color: '#FFFFFF',
    fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
    fontSize: '14px',
    fontWeight: 400,
    maxWidth: '320px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  }

  return (
    <div style={containerStyle} role="status" aria-live="polite">
      {message}
    </div>
  )
}
