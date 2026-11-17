import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest'
import { render, screen, cleanup, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Sessao } from '../../../shared/types'
import { formatarDataDoVoo, formatarHoraDoVoo } from '../../components/format-flight-time'

const { mockListSessoesEncerradas, mockOnSessionEnded } = vi.hoisted(() => ({
  mockListSessoesEncerradas: vi.fn(),
  mockOnSessionEnded: vi.fn(),
}))

vi.mock('../../ipc/session-ipc', () => ({
  listSessoesEncerradas: () => mockListSessoesEncerradas(),
  onSessionEnded: (cb: (s: Sessao) => void) => mockOnSessionEnded(cb),
}))

import { FlightListPage } from './flight-list-page'

const TEXTO_VAZIO = 'Nenhum voo registrado. Inicie o simulador e ligue o motor para começar.'
const TEXTO_ERRO =
  'Não foi possível carregar a lista de voos. Feche e abra o aplicativo para tentar de novo.'
const TEXTO_CARREGANDO = 'Carregando voos...'

function sessao(id: string, iniciadaEm: string, encerradaEm: string | null): Sessao {
  return {
    id,
    iniciadaEm,
    encerradaEm,
    aeronave: '',
    aerodromoOrigem: null,
    aerodromoDestino: null,
    status: 'encerrada',
    parametrosNaoAplicaveis: [],
  }
}

// Já na ordem do main (iniciada_em DESC).
const RECENTE = sessao('recente', '2026-11-17T13:00:00.000Z', '2026-11-17T14:30:15.000Z')
const CURTA = sessao('curta', '2026-11-16T10:00:00.000Z', '2026-11-16T10:00:04.000Z')
const ANTIGA_ZERO = sessao('antiga', '2026-11-01T09:00:00.000Z', '2026-11-01T09:00:00.000Z')

function rotulo(s: Sessao, duracao: string): string {
  return `Voo de ${formatarDataDoVoo(s.iniciadaEm)} às ${formatarHoraDoVoo(s.iniciadaEm)}, duração ${duracao}`
}

let aoEncerrar: ((s: Sessao) => void) | null = null

async function resolverPromessas(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
  })
}

describe('FlightListPage', () => {
  let consoleError: MockInstance<Parameters<typeof console.error>, void>

  beforeEach(() => {
    vi.clearAllMocks()
    aoEncerrar = null
    mockOnSessionEnded.mockImplementation((cb: (s: Sessao) => void) => {
      aoEncerrar = cb
      return () => {
        aoEncerrar = null
      }
    })
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    consoleError.mockRestore()
    vi.useRealTimers()
  })

  it('deve exibir o título "Voos" como cabeçalho da seção', async () => {
    mockListSessoesEncerradas.mockResolvedValue([])
    render(<FlightListPage onSelecionar={vi.fn()} />)
    await resolverPromessas()

    expect(screen.getByRole('heading', { level: 1, name: 'Voos' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Voos' })).toBeInTheDocument()
  })

  it('deve exibir as sessões em ordem cronológica inversa, com data, hora e duração (inclusive curta e de duração 0)', async () => {
    mockListSessoesEncerradas.mockResolvedValue([RECENTE, CURTA, ANTIGA_ZERO])
    render(<FlightListPage onSelecionar={vi.fn()} />)
    await resolverPromessas()

    const lista = screen.getByRole('list')
    const cards = within(lista).getAllByRole('button')
    expect(cards.map((c) => c.getAttribute('aria-label'))).toEqual([
      rotulo(RECENTE, '1 hora, 30 minutos e 15 segundos'),
      rotulo(CURTA, '4 segundos'),
      rotulo(ANTIGA_ZERO, '0 segundos'),
    ])
    expect(within(lista).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.queryByText(TEXTO_VAZIO)).not.toBeInTheDocument()
  })

  it('deve exibir o estado vazio quando não há sessões encerradas', async () => {
    mockListSessoesEncerradas.mockResolvedValue([])
    render(<FlightListPage onSelecionar={vi.fn()} />)
    await resolverPromessas()

    expect(screen.getByText(TEXTO_VAZIO)).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByText(TEXTO_CARREGANDO)).not.toBeInTheDocument()
  })

  it('não deve exibir mensagem nenhuma enquanto a lista carrega nos primeiros 500 ms', () => {
    vi.useFakeTimers()
    mockListSessoesEncerradas.mockReturnValue(new Promise(() => {}))
    render(<FlightListPage onSelecionar={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(499)
    })

    expect(screen.queryByText(TEXTO_CARREGANDO)).not.toBeInTheDocument()
    expect(screen.queryByText(TEXTO_VAZIO)).not.toBeInTheDocument()
    expect(screen.queryByText(TEXTO_ERRO)).not.toBeInTheDocument()
  })

  it('deve exibir "Carregando voos..." com role="status" depois de 500 ms', () => {
    vi.useFakeTimers()
    mockListSessoesEncerradas.mockReturnValue(new Promise(() => {}))
    render(<FlightListPage onSelecionar={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(screen.getByRole('status')).toHaveTextContent(TEXTO_CARREGANDO)
  })

  it('deve exibir a mensagem de erro com role="alert" quando a primeira carga falha', async () => {
    mockListSessoesEncerradas.mockRejectedValue(new Error('ipc'))
    render(<FlightListPage onSelecionar={vi.fn()} />)
    await resolverPromessas()

    expect(screen.getByRole('alert')).toHaveTextContent(TEXTO_ERRO)
    expect(screen.queryByText(TEXTO_VAZIO)).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('deve manter a lista, sem mensagem de erro, quando uma nova busca falha', async () => {
    mockListSessoesEncerradas.mockResolvedValueOnce([RECENTE])
    render(<FlightListPage onSelecionar={vi.fn()} />)
    await resolverPromessas()

    mockListSessoesEncerradas.mockRejectedValueOnce(new Error('ipc'))
    act(() => aoEncerrar!(CURTA))
    await resolverPromessas()

    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.queryByText(TEXTO_ERRO)).not.toBeInTheDocument()
    expect(consoleError).toHaveBeenCalled()
  })

  it('deve atualizar a lista sozinha quando uma sessão encerra com ela aberta', async () => {
    mockListSessoesEncerradas.mockResolvedValueOnce([])
    render(<FlightListPage onSelecionar={vi.fn()} />)
    await resolverPromessas()
    expect(screen.getByText(TEXTO_VAZIO)).toBeInTheDocument()

    mockListSessoesEncerradas.mockResolvedValueOnce([RECENTE])
    act(() => aoEncerrar!(RECENTE))
    await resolverPromessas()

    expect(screen.queryByText(TEXTO_VAZIO)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: rotulo(RECENTE, '1 hora, 30 minutos e 15 segundos') })).toBeInTheDocument()
  })

  it('deve chamar onSelecionar com a sessão do card clicado', async () => {
    mockListSessoesEncerradas.mockResolvedValue([RECENTE, CURTA])
    const onSelecionar = vi.fn()
    render(<FlightListPage onSelecionar={onSelecionar} />)
    await resolverPromessas()

    await userEvent.click(screen.getByRole('button', { name: rotulo(CURTA, '4 segundos') }))

    expect(onSelecionar).toHaveBeenCalledOnce()
    expect(onSelecionar).toHaveBeenCalledWith(CURTA)
  })

  it('deve percorrer os voos com Tab, na ordem da lista, e abrir com Enter', async () => {
    mockListSessoesEncerradas.mockResolvedValue([RECENTE, CURTA, ANTIGA_ZERO])
    const onSelecionar = vi.fn()
    render(<FlightListPage onSelecionar={onSelecionar} />)
    await resolverPromessas()
    const cards = screen.getAllByRole('button')

    await userEvent.tab()
    expect(cards[0]).toHaveFocus()
    await userEvent.tab()
    expect(cards[1]).toHaveFocus()
    await userEvent.keyboard('{Enter}')

    expect(onSelecionar).toHaveBeenCalledWith(CURTA)
  })

  it('deve pôr o foco no card da sessão de origem quando a lista carrega (volta da tela do voo)', async () => {
    mockListSessoesEncerradas.mockResolvedValue([RECENTE, CURTA, ANTIGA_ZERO])
    render(<FlightListPage onSelecionar={vi.fn()} focoSessaoId="curta" />)
    await resolverPromessas()

    expect(screen.getByRole('button', { name: rotulo(CURTA, '4 segundos') })).toHaveFocus()
  })

  it('não deve roubar o foco de novo quando a lista é atualizada por session:ended', async () => {
    mockListSessoesEncerradas.mockResolvedValueOnce([CURTA])
    render(<FlightListPage onSelecionar={vi.fn()} focoSessaoId="curta" />)
    await resolverPromessas()
    const outro = document.createElement('button')
    document.body.appendChild(outro)
    outro.focus()

    mockListSessoesEncerradas.mockResolvedValueOnce([RECENTE, CURTA])
    act(() => aoEncerrar!(RECENTE))
    await resolverPromessas()

    expect(outro).toHaveFocus()
    outro.remove()
  })

  it('não deve pôr foco em card nenhum sem sessão de origem', async () => {
    mockListSessoesEncerradas.mockResolvedValue([RECENTE])
    render(<FlightListPage onSelecionar={vi.fn()} />)
    await resolverPromessas()

    expect(document.body).toHaveFocus()
  })

  it('deve seguir sem erro quando a sessão de origem não está mais na lista', async () => {
    mockListSessoesEncerradas.mockResolvedValue([RECENTE])
    render(<FlightListPage onSelecionar={vi.fn()} focoSessaoId="sumiu" />)
    await resolverPromessas()

    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(document.body).toHaveFocus()
  })

  it('deve pôr o foco no título "Voos" ao montar com focarTitulo e sem sessão de origem', async () => {
    mockListSessoesEncerradas.mockResolvedValue([RECENTE])
    render(<FlightListPage onSelecionar={vi.fn()} focarTitulo />)

    const titulo = screen.getByRole('heading', { level: 1, name: 'Voos' })
    // O título recebe o foco já na montagem, antes de a lista chegar.
    expect(titulo).toHaveFocus()
    expect(titulo).toHaveAttribute('tabindex', '-1')

    await resolverPromessas()
    expect(titulo).toHaveFocus()
  })

  it('deve pôr o foco no card de origem, e não no título, com focarTitulo e sessão de origem na lista', async () => {
    mockListSessoesEncerradas.mockResolvedValue([RECENTE, CURTA])
    render(<FlightListPage onSelecionar={vi.fn()} focoSessaoId="curta" focarTitulo />)
    await resolverPromessas()

    expect(screen.getByRole('button', { name: rotulo(CURTA, '4 segundos') })).toHaveFocus()
  })

  it('deve pôr o foco no título "Voos" com focarTitulo quando a sessão de origem não está mais na lista', async () => {
    mockListSessoesEncerradas.mockResolvedValue([RECENTE])
    render(<FlightListPage onSelecionar={vi.fn()} focoSessaoId="sumiu" focarTitulo />)
    await resolverPromessas()

    expect(screen.getByRole('heading', { level: 1, name: 'Voos' })).toHaveFocus()
  })

  it('deve pôr o foco no título "Voos" com focarTitulo quando a lista de volta está vazia', async () => {
    mockListSessoesEncerradas.mockResolvedValue([])
    render(<FlightListPage onSelecionar={vi.fn()} focoSessaoId="curta" focarTitulo />)
    await resolverPromessas()

    expect(screen.getByRole('heading', { level: 1, name: 'Voos' })).toHaveFocus()
  })

  it('não deve devolver o foco ao título quando a lista é atualizada por session:ended', async () => {
    mockListSessoesEncerradas.mockResolvedValueOnce([CURTA])
    render(<FlightListPage onSelecionar={vi.fn()} focarTitulo />)
    await resolverPromessas()
    const card = screen.getByRole('button', { name: rotulo(CURTA, '4 segundos') })
    card.focus()

    mockListSessoesEncerradas.mockResolvedValueOnce([RECENTE, CURTA])
    act(() => aoEncerrar!(RECENTE))
    await resolverPromessas()

    expect(screen.getByRole('button', { name: rotulo(CURTA, '4 segundos') })).toHaveFocus()
  })
})
