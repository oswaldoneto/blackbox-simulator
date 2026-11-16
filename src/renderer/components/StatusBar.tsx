import React from 'react'
import type { Sessao } from '../../shared/types'

interface StatusBarProps {
  sessaoAtiva: Sessao | null
}

type SessionIndicator = {
  color: string
  label: string
}

function getSessionIndicator(sessaoAtiva: Sessao | null): SessionIndicator {
  if (sessaoAtiva !== null && sessaoAtiva.status === 'ativa') {
    return { color: 'var(--color-success)', label: 'Sessão ativa' }
  }
  if (sessaoAtiva !== null) {
    return { color: 'var(--color-text-secondary)', label: 'Encerrada' }
  }
  return { color: 'var(--color-error)', label: 'Sem conexão' }
}

const barStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px',
  height: '48px',
  background: 'var(--color-surface)',
  borderBottom: '1px solid var(--color-border)',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 100,
}

const appNameStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const indicatorWrapStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
}

export function StatusBar({ sessaoAtiva }: StatusBarProps): React.ReactElement {
  const { color, label } = getSessionIndicator(sessaoAtiva)

  const dotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  }

  return (
    <header style={barStyle}>
      <span style={appNameStyle}>Blackbox Simulator</span>
      <div style={indicatorWrapStyle} aria-label={label}>
        <span style={dotStyle} aria-hidden="true" />
        <span style={labelStyle}>{label}</span>
      </div>
    </header>
  )
}
