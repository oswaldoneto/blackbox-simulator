import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FlightDetailPage } from './flight-detail-page'
import { formatarDataDoVoo, formatarHoraDoVoo } from '../../components/format-flight-time'
import type { Sessao } from '../../../shared/types'

afterEach(cleanup)

const SESSAO: Sessao = {
  id: 'voo-1',
  iniciadaEm: '2026-11-17T13:05:00.000Z',
  encerradaEm: '2026-11-18T15:08:09.000Z',
  aeronave: 'Cessna 172',
  aerodromoOrigem: null,
  aerodromoDestino: null,
  status: 'encerrada',
  parametrosNaoAplicaveis: [],
}

// Data e hora no fuso local (valores conferidos em format-flight-time.test.ts).
const DATA = formatarDataDoVoo(SESSAO.iniciadaEm)
const HORA = formatarHoraDoVoo(SESSAO.iniciadaEm)

function valorDe(rotulo: string): string | null {
  const dt = screen.getByText(rotulo, { selector: 'dt' })
  return dt.nextElementSibling?.textContent ?? null
}

describe('FlightDetailPage', () => {
  it('deve exibir o título "Voo de dd/mm/aaaa"', () => {
    render(<FlightDetailPage sessao={SESSAO} onVoltar={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 1, name: `Voo de ${DATA}` })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: `Voo de ${DATA}` })).toBeInTheDocument()
  })

  it('deve exibir data, hora de início e duração (horas sem limite)', () => {
    render(<FlightDetailPage sessao={SESSAO} onVoltar={vi.fn()} />)

    expect(valorDe('Data')).toBe(DATA)
    expect(valorDe('Hora de início')).toBe(HORA)
    expect(valorDe('Duração')).toBe('26:03:09')
  })

  it('deve exibir o aviso "Debriefing disponível em breve"', () => {
    render(<FlightDetailPage sessao={SESSAO} onVoltar={vi.fn()} />)
    expect(screen.getByText('Debriefing disponível em breve')).toBeInTheDocument()
  })

  it('não deve exibir a aeronave', () => {
    const { container } = render(<FlightDetailPage sessao={SESSAO} onVoltar={vi.fn()} />)
    expect(container.textContent).not.toContain('Cessna')
  })

  it('deve exibir "—" na duração quando a hora de fim é nula', () => {
    render(<FlightDetailPage sessao={{ ...SESSAO, encerradaEm: null }} onVoltar={vi.fn()} />)
    expect(valorDe('Duração')).toBe('—')
  })

  it('deve pôr o foco inicial no botão "Voltar à lista"', () => {
    render(<FlightDetailPage sessao={SESSAO} onVoltar={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Voltar à lista' })).toHaveFocus()
  })

  it('deve descrever "Voltar à lista" pelo título e pelo aviso (aria-describedby)', () => {
    render(<FlightDetailPage sessao={SESSAO} onVoltar={vi.fn()} />)

    const botao = screen.getByRole('button', { name: 'Voltar à lista' })
    const titulo = screen.getByRole('heading', { level: 1, name: `Voo de ${DATA}` })
    const aviso = screen.getByText('Debriefing disponível em breve')
    const ids = (botao.getAttribute('aria-describedby') ?? '').split(/\s+/)

    expect(titulo.id).not.toBe('')
    expect(aviso.id).not.toBe('')
    expect(ids).toEqual([titulo.id, aviso.id])
    expect(botao).toHaveAccessibleDescription(`Voo de ${DATA} Debriefing disponível em breve`)
  })

  it('deve manter o nome acessível do botão só como "Voltar à lista"', () => {
    render(<FlightDetailPage sessao={SESSAO} onVoltar={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Voltar à lista' })).toHaveAccessibleName(
      'Voltar à lista'
    )
  })

  it('deve chamar onVoltar no clique em "Voltar à lista"', async () => {
    const onVoltar = vi.fn()
    render(<FlightDetailPage sessao={SESSAO} onVoltar={onVoltar} />)

    await userEvent.click(screen.getByRole('button', { name: 'Voltar à lista' }))

    expect(onVoltar).toHaveBeenCalledOnce()
  })

  it('deve chamar onVoltar com Enter no botão com foco', async () => {
    const onVoltar = vi.fn()
    render(<FlightDetailPage sessao={SESSAO} onVoltar={onVoltar} />)

    await userEvent.keyboard('{Enter}')

    expect(onVoltar).toHaveBeenCalledOnce()
  })

  it('deve chamar onVoltar com Esc, mesmo com o foco fora do botão', async () => {
    const onVoltar = vi.fn()
    render(<FlightDetailPage sessao={SESSAO} onVoltar={onVoltar} />)
    ;(document.activeElement as HTMLElement).blur()

    await userEvent.keyboard('{Escape}')

    expect(onVoltar).toHaveBeenCalledOnce()
  })

  it('não deve reagir a outras teclas', async () => {
    const onVoltar = vi.fn()
    render(<FlightDetailPage sessao={SESSAO} onVoltar={onVoltar} />)
    ;(document.activeElement as HTMLElement).blur()

    await userEvent.keyboard('a{ArrowDown}')

    expect(onVoltar).not.toHaveBeenCalled()
  })

  it('deve parar de ouvir Esc depois de desmontar', async () => {
    const onVoltar = vi.fn()
    const { unmount } = render(<FlightDetailPage sessao={SESSAO} onVoltar={onVoltar} />)

    unmount()
    await userEvent.keyboard('{Escape}')

    expect(onVoltar).not.toHaveBeenCalled()
  })

  it('deve ter a lista de dados como lista de definição', () => {
    const { container } = render(<FlightDetailPage sessao={SESSAO} onVoltar={vi.fn()} />)
    const dl = container.querySelector('dl') as HTMLElement
    expect(within(dl).getAllByRole('term').map((t) => t.textContent)).toEqual([
      'Data',
      'Hora de início',
      'Duração',
    ])
  })
})
