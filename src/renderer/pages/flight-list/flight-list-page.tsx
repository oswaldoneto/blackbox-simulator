import React, { useEffect, useRef } from 'react'
import { useSessoesEncerradas } from '../../hooks/use-sessoes-encerradas'
import { FlightCard } from '../../components/flight-card'
import type { Sessao } from '../../../shared/types'

interface FlightListPageProps {
  onSelecionar: (sessao: Sessao) => void
  /** Sessão cujo card recebe o foco quando a lista carrega (volta da tela do voo). */
  focoSessaoId?: string | null
  /**
   * Leva o foco ao título "Voos" ao montar, quando não há card de origem (troca de tela).
   * Com card de origem, o título só recebe o foco se o card não estiver mais na lista.
   */
  focarTitulo?: boolean
}

const tituloStyle: React.CSSProperties = {
  margin: '0 0 16px',
  fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  fontSize: '20px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const mensagemStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  fontSize: '14px',
  fontWeight: 400,
  color: 'var(--color-text-secondary)',
}

const vazioStyle: React.CSSProperties = {
  ...mensagemStyle,
  padding: '48px 16px',
  textAlign: 'center',
}

const listaStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  margin: 0,
  padding: 0,
  listStyle: 'none',
}

const TEXTO_CARREGANDO = 'Carregando voos...'
const TEXTO_VAZIO = 'Nenhum voo registrado. Inicie o simulador e ligue o motor para começar.'
const TEXTO_ERRO =
  'Não foi possível carregar a lista de voos. Feche e abra o aplicativo para tentar de novo.'

/** Lista de voos (UC-004): sessões encerradas, da mais recente para a mais antiga. */
export function FlightListPage({
  onSelecionar,
  focoSessaoId = null,
  focarTitulo = false,
}: FlightListPageProps): React.ReactElement {
  const { sessoes, erro, carregando } = useSessoesEncerradas()
  const cards = useRef(new Map<string, HTMLButtonElement>())
  const titulo = useRef<HTMLHeadingElement>(null)
  const focoAplicado = useRef(false)

  // Sem card de origem, o foco vai ao título assim que a tela aparece (uma vez só).
  useEffect(() => {
    if (focoAplicado.current || !focarTitulo || focoSessaoId !== null) {
      return
    }
    focoAplicado.current = true
    titulo.current?.focus()
  }, [focarTitulo, focoSessaoId])

  // Devolve o foco ao card de origem só na primeira vez que a lista aparece.
  useEffect(() => {
    if (focoAplicado.current || sessoes === null || focoSessaoId === null) {
      return
    }
    focoAplicado.current = true
    const card = cards.current.get(focoSessaoId)
    if (card !== undefined) {
      card.focus()
    } else if (focarTitulo) {
      titulo.current?.focus()
    }
  }, [sessoes, focoSessaoId, focarTitulo])

  return (
    <section aria-labelledby="flight-list-title">
      <h1 id="flight-list-title" ref={titulo} tabIndex={-1} style={tituloStyle}>
        Voos
      </h1>
      {sessoes === null && erro && (
        <p style={mensagemStyle} role="alert">
          {TEXTO_ERRO}
        </p>
      )}
      {sessoes === null && !erro && carregando && (
        <p style={mensagemStyle} role="status">
          {TEXTO_CARREGANDO}
        </p>
      )}
      {sessoes !== null && sessoes.length === 0 && <p style={vazioStyle}>{TEXTO_VAZIO}</p>}
      {sessoes !== null && sessoes.length > 0 && (
        <ul style={listaStyle}>
          {sessoes.map((sessao) => (
            <li key={sessao.id}>
              <FlightCard
                ref={(elemento) => {
                  if (elemento === null) {
                    cards.current.delete(sessao.id)
                  } else {
                    cards.current.set(sessao.id, elemento)
                  }
                }}
                sessao={sessao}
                onSelecionar={onSelecionar}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
