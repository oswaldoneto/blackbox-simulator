import React, { useEffect, useRef } from 'react'
import {
  formatarDataDoVoo,
  formatarDuracaoDoVoo,
  formatarHoraDoVoo,
} from '../../components/format-flight-time'
import type { Sessao } from '../../../shared/types'
import './flight-detail-page.css'

interface FlightDetailPageProps {
  sessao: Sessao
  onVoltar: () => void
}

const tituloStyle: React.CSSProperties = {
  margin: '0 0 16px',
  fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  fontSize: '20px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const dadosStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'max-content 1fr',
  columnGap: '16px',
  rowGap: '8px',
  alignItems: 'baseline',
  margin: '0 0 16px',
  padding: '16px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '4px',
}

const rotuloStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
}

const valorStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
  fontSize: '14px',
  fontWeight: 400,
  color: 'var(--color-text-primary)',
  fontVariantNumeric: 'tabular-nums',
}

const avisoStyle: React.CSSProperties = {
  margin: '0 0 16px',
  fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  fontSize: '14px',
  fontWeight: 400,
  color: 'var(--color-text-secondary)',
}

/**
 * Tela provisória do voo (UC-004): cabeçalho da sessão e aviso de que o debriefing
 * (UC-005) ainda não está disponível. Esc ou "Voltar à lista" voltam à lista.
 */
export function FlightDetailPage({ sessao, onVoltar }: FlightDetailPageProps): React.ReactElement {
  const voltar = useRef<HTMLButtonElement>(null)

  const data = formatarDataDoVoo(sessao.iniciadaEm)
  const hora = formatarHoraDoVoo(sessao.iniciadaEm)
  const duracao = formatarDuracaoDoVoo(sessao.iniciadaEm, sessao.encerradaEm)

  useEffect(() => {
    voltar.current?.focus()
  }, [])

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') {
        onVoltar()
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [onVoltar])

  return (
    <section aria-labelledby="flight-detail-title">
      <h1 id="flight-detail-title" style={tituloStyle}>
        Voo de {data}
      </h1>
      <dl style={dadosStyle}>
        <dt style={rotuloStyle}>Data</dt>
        <dd style={valorStyle}>{data}</dd>
        <dt style={rotuloStyle}>Hora de início</dt>
        <dd style={valorStyle}>{hora}</dd>
        <dt style={rotuloStyle}>Duração</dt>
        <dd style={valorStyle}>{duracao}</dd>
      </dl>
      <p id="flight-detail-notice" style={avisoStyle}>Debriefing disponível em breve</p>
      <button
        ref={voltar}
        type="button"
        className="flight-detail__back-button"
        aria-describedby="flight-detail-title flight-detail-notice"
        onClick={onVoltar}
      >
        Voltar à lista
      </button>
    </section>
  )
}
