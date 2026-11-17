import React from 'react'
import type { EstadoConexao, Sessao } from '../../shared/types'
import './status-bar.css'

/** Seção destacada na navegação da barra superior (a tela do voo pertence a "Voos"). */
export type SecaoNavegacao = 'painel' | 'voos'

interface StatusBarProps {
  sessaoAtiva: Sessao | null
  conexao: EstadoConexao
  secaoAtual: SecaoNavegacao
  onNavegar: (secao: SecaoNavegacao) => void
}

const SECOES: ReadonlyArray<{ secao: SecaoNavegacao; rotulo: string }> = [
  { secao: 'painel', rotulo: 'Painel' },
  { secao: 'voos', rotulo: 'Voos' },
]

type SessionIndicator = {
  color: string
  label: string
}

function getSessionIndicator(
  sessaoAtiva: Sessao | null,
  conexao: EstadoConexao
): SessionIndicator {
  // Sem conexão com o simulador vence os demais estados, inclusive "Sessão ativa".
  if (conexao === 'desconectado') {
    return { color: 'var(--color-error)', label: 'Sem conexão' }
  }
  if (sessaoAtiva !== null && sessaoAtiva.status === 'ativa') {
    return { color: 'var(--color-success)', label: 'Sessão ativa' }
  }
  if (sessaoAtiva !== null) {
    return { color: 'var(--color-text-secondary)', label: 'Encerrada' }
  }
  return { color: 'var(--color-text-secondary)', label: 'Aguardando motor' }
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

const leftGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '24px',
  height: '100%',
}

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  height: '100%',
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

export function StatusBar({
  sessaoAtiva,
  conexao,
  secaoAtual,
  onNavegar,
}: StatusBarProps): React.ReactElement {
  const { color, label } = getSessionIndicator(sessaoAtiva, conexao)

  const dotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  }

  return (
    <header style={barStyle}>
      <div style={leftGroupStyle}>
        <span style={appNameStyle}>Blackbox Simulator</span>
        <nav style={navStyle} aria-label="Navegação principal">
          {SECOES.map(({ secao, rotulo }) => (
            <button
              key={secao}
              type="button"
              className="status-bar__nav-button"
              aria-current={secao === secaoAtual ? 'page' : undefined}
              onClick={() => {
                onNavegar(secao)
              }}
            >
              {rotulo}
            </button>
          ))}
        </nav>
      </div>
      <div style={indicatorWrapStyle} aria-label={label}>
        <span style={dotStyle} aria-hidden="true" />
        <span style={labelStyle}>{label}</span>
      </div>
    </header>
  )
}
