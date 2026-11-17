import React, { forwardRef } from 'react'
import {
  DURACAO_INDISPONIVEL,
  formatarDataDoVoo,
  formatarDuracaoDoVoo,
  formatarDuracaoPorExtenso,
  formatarHoraDoVoo,
} from './format-flight-time'
import type { Sessao } from '../../shared/types'
import './flight-card.css'

interface FlightCardProps {
  sessao: Sessao
  onSelecionar: (sessao: Sessao) => void
}

const inicioStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
  fontSize: '14px',
  fontWeight: 400,
  color: 'var(--color-text-primary)',
  fontVariantNumeric: 'tabular-nums',
}

const duracaoLinhaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '6px',
}

const rotuloStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
}

/** Card de um voo na lista (UC-004): data · hora de início e duração; o clique abre o voo. */
export const FlightCard = forwardRef<HTMLButtonElement, FlightCardProps>(function FlightCard(
  { sessao, onSelecionar },
  ref
) {
  const data = formatarDataDoVoo(sessao.iniciadaEm)
  const hora = formatarHoraDoVoo(sessao.iniciadaEm)
  const duracao = formatarDuracaoDoVoo(sessao.iniciadaEm, sessao.encerradaEm)
  // O rótulo lê a duração por extenso: "1:12:05" seria lido como hora do dia.
  const duracaoPorExtenso = formatarDuracaoPorExtenso(sessao.iniciadaEm, sessao.encerradaEm)
  // "duração indisponível" já traz a palavra "duração"; não repetir no rótulo.
  const duracaoNoRotulo =
    duracaoPorExtenso === DURACAO_INDISPONIVEL ? duracaoPorExtenso : `duração ${duracaoPorExtenso}`

  return (
    <button
      ref={ref}
      type="button"
      className="flight-card"
      aria-label={`Voo de ${data} às ${hora}, ${duracaoNoRotulo}`}
      onClick={() => {
        onSelecionar(sessao)
      }}
    >
      <span style={inicioStyle}>
        {data} · {hora}
      </span>
      <span style={duracaoLinhaStyle}>
        <span style={rotuloStyle}>Duração</span>
        <span style={inicioStyle}>{duracao}</span>
      </span>
    </button>
  )
})
