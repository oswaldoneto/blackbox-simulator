import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FlightCard } from './flight-card'
import { formatarDataDoVoo, formatarHoraDoVoo } from './format-flight-time'
import type { Sessao } from '../../shared/types'

afterEach(cleanup)

function sessao(overrides: Partial<Sessao> = {}): Sessao {
  return {
    id: 'voo-1',
    iniciadaEm: '2026-11-17T13:05:00.000Z',
    encerradaEm: '2026-11-17T14:20:30.000Z',
    aeronave: 'Cessna 172',
    aerodromoOrigem: 'SBSP',
    aerodromoDestino: 'SBRJ',
    status: 'encerrada',
    parametrosNaoAplicaveis: [],
    ...overrides,
  }
}

// Data e hora seguem o fuso local da máquina (valores conferidos em format-flight-time.test.ts).
const s = sessao()
const DATA = formatarDataDoVoo(s.iniciadaEm)
const HORA = formatarHoraDoVoo(s.iniciadaEm)

describe('FlightCard', () => {
  it('deve ser um botão com aria-label "Voo de dd/mm/aaaa às HH:mm, duração <por extenso>"', () => {
    render(<FlightCard sessao={s} onSelecionar={vi.fn()} />)

    const card = screen.getByRole('button')
    expect(card).toHaveAttribute(
      'aria-label',
      `Voo de ${DATA} às ${HORA}, duração 1 hora, 15 minutos e 30 segundos`
    )
    expect(card).toHaveAttribute('type', 'button')
    expect(DATA).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(HORA).toMatch(/^\d{2}:\d{2}$/)
  })

  it('deve exibir "dd/mm/aaaa · HH:mm" e "Duração h:mm:ss"', () => {
    render(<FlightCard sessao={s} onSelecionar={vi.fn()} />)

    expect(screen.getByText(`${DATA} · ${HORA}`)).toBeInTheDocument()
    expect(screen.getByText('Duração')).toBeInTheDocument()
    expect(screen.getByText('1:15:30')).toBeInTheDocument()
  })

  it('deve exibir duração "0:00:00" para sessão de duração 0', () => {
    render(
      <FlightCard sessao={sessao({ encerradaEm: s.iniciadaEm })} onSelecionar={vi.fn()} />
    )
    expect(screen.getByText('0:00:00')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveAccessibleName(
      `Voo de ${DATA} às ${HORA}, duração 0 segundos`
    )
  })

  it('não deve ler a duração em h:mm:ss no aria-label (seria lida como hora do dia)', () => {
    render(<FlightCard sessao={s} onSelecionar={vi.fn()} />)
    const rotulo = screen.getByRole('button').getAttribute('aria-label') ?? ''
    expect(rotulo).not.toMatch(/\d+:\d{2}:\d{2}/)
    // O texto visível continua em h:mm:ss.
    expect(screen.getByText('1:15:30')).toBeInTheDocument()
  })

  it('deve exibir "—" na duração quando a hora de fim é nula', () => {
    render(<FlightCard sessao={sessao({ encerradaEm: null })} onSelecionar={vi.fn()} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('deve ler "duração indisponível" no aria-label, sem "—", quando a hora de fim é nula', () => {
    render(<FlightCard sessao={sessao({ encerradaEm: null })} onSelecionar={vi.fn()} />)
    const card = screen.getByRole('button')
    expect(card).toHaveAccessibleName(`Voo de ${DATA} às ${HORA}, duração indisponível`)
    expect(card.getAttribute('aria-label')).not.toContain('duração duração')
    expect(card.getAttribute('aria-label')).not.toContain('—')
  })

  it('não deve exibir a aeronave, os aeródromos nem indicador de estado', () => {
    const { container } = render(<FlightCard sessao={s} onSelecionar={vi.fn()} />)

    const texto = container.textContent ?? ''
    expect(texto).not.toContain('Cessna')
    expect(texto).not.toContain('SBSP')
    expect(texto).not.toContain('SBRJ')
    expect(texto).not.toMatch(/encerrad|ativa/i)
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed')
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-selected')
  })

  it('deve usar Plex Mono 14 px na data, hora e duração', () => {
    render(<FlightCard sessao={s} onSelecionar={vi.fn()} />)
    const inicio = screen.getByText(`${DATA} · ${HORA}`)
    expect(inicio.getAttribute('style')).toContain('IBM Plex Mono')
    expect(inicio.getAttribute('style')).toContain('font-size: 14px')
  })

  it('deve chamar onSelecionar com a sessão no clique', async () => {
    const onSelecionar = vi.fn()
    render(<FlightCard sessao={s} onSelecionar={onSelecionar} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onSelecionar).toHaveBeenCalledOnce()
    expect(onSelecionar).toHaveBeenCalledWith(s)
  })

  it('deve chamar onSelecionar com Enter quando o card está com foco', async () => {
    const onSelecionar = vi.fn()
    render(<FlightCard sessao={s} onSelecionar={onSelecionar} />)

    await userEvent.tab()
    expect(screen.getByRole('button')).toHaveFocus()
    await userEvent.keyboard('{Enter}')

    expect(onSelecionar).toHaveBeenCalledWith(s)
  })

  it('deve repassar a ref para o botão (foco devolvido pela lista)', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<FlightCard ref={ref} sessao={s} onSelecionar={vi.fn()} />)
    expect(ref.current).toBe(screen.getByRole('button'))
  })
})
