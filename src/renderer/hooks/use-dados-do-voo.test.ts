import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { LeiturasDoVoo, ParametroDeVoo } from '../../shared/types'

const { mockGetLeiturasDoVoo, mockListActiveParametros } = vi.hoisted(() => ({
  mockGetLeiturasDoVoo: vi.fn(),
  mockListActiveParametros: vi.fn(),
}))

vi.mock('../ipc/session-ipc', () => ({
  getLeiturasDoVoo: (sessaoId: string) => mockGetLeiturasDoVoo(sessaoId),
}))

vi.mock('../ipc/parameter-ipc', () => ({
  listActiveParametros: () => mockListActiveParametros(),
}))

import { useDadosDoVoo } from './use-dados-do-voo'
import { CARREGANDO_LIMITE_MS } from '../components/limites-de-tempo'

interface Adiada<T> {
  promessa: Promise<T>
  resolver: (valor: T) => void
  rejeitar: (erro: unknown) => void
}

function adiada<T>(): Adiada<T> {
  let resolver: (valor: T) => void = () => {}
  let rejeitar: (erro: unknown) => void = () => {}
  const promessa = new Promise<T>((res, rej) => {
    resolver = res
    rejeitar = rej
  })
  return { promessa, resolver, rejeitar }
}

const CATALOGO: ParametroDeVoo[] = [
  { id: 'altitude_msl', nome: 'Altitude MSL', unidade: 'ft', ativo: true },
  { id: 'flaps', nome: 'Flapes', unidade: '%', ativo: false },
]

function leituras(sessaoId: string): LeiturasDoVoo {
  return {
    sessaoId,
    series: [{ parametroId: 'altitude_msl', instantes: [1000], valores: [1500] }],
  }
}

async function resolverPromessas(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

function avancar(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('useDadosDoVoo', () => {
  let consoleError: MockInstance<Parameters<typeof console.error>, void>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockListActiveParametros.mockResolvedValue(CATALOGO)
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    consoleError.mockRestore()
  })

  it('deve pedir o catálogo e as leituras do voo juntos, uma vez', () => {
    mockGetLeiturasDoVoo.mockReturnValue(new Promise(() => {}))
    renderHook(() => useDadosDoVoo('voo-1'))

    expect(mockGetLeiturasDoVoo).toHaveBeenCalledOnce()
    expect(mockGetLeiturasDoVoo).toHaveBeenCalledWith('voo-1')
    expect(mockListActiveParametros).toHaveBeenCalledOnce()
  })

  // CA-005-11
  it('deve ficar carregando sem mensagem até 500 ms e mostrar a mensagem aos 500 ms', () => {
    mockGetLeiturasDoVoo.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useDadosDoVoo('voo-1'))

    expect(result.current).toEqual({ estado: 'carregando', mostrarCarregando: false })
    avancar(CARREGANDO_LIMITE_MS - 1)
    expect(result.current).toEqual({ estado: 'carregando', mostrarCarregando: false })
    avancar(1)
    expect(result.current).toEqual({ estado: 'carregando', mostrarCarregando: true })
    expect(CARREGANDO_LIMITE_MS).toBe(500)
  })

  it('deve ficar pronto com as leituras e só os parâmetros ativos do catálogo', async () => {
    mockGetLeiturasDoVoo.mockResolvedValue(leituras('voo-1'))
    const { result } = renderHook(() => useDadosDoVoo('voo-1'))

    await resolverPromessas()

    expect(result.current).toEqual({
      estado: 'pronto',
      parametros: [CATALOGO[0]],
      leituras: leituras('voo-1'),
    })
  })

  it('não deve mostrar o carregando quando a resposta chega antes de 500 ms', async () => {
    mockGetLeiturasDoVoo.mockResolvedValue(leituras('voo-1'))
    const { result } = renderHook(() => useDadosDoVoo('voo-1'))
    await resolverPromessas()

    avancar(CARREGANDO_LIMITE_MS * 2)

    expect(result.current.estado).toBe('pronto')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('deve logar e devolver erro quando as leituras falham', async () => {
    const falha = new Error('Sessão não encontrada')
    mockGetLeiturasDoVoo.mockRejectedValue(falha)
    const { result } = renderHook(() => useDadosDoVoo('voo-1'))

    await resolverPromessas()

    expect(result.current).toEqual({ estado: 'erro' })
    expect(consoleError).toHaveBeenCalledWith(
      '[useDadosDoVoo] Falha ao carregar os dados do voo:',
      falha
    )
    avancar(CARREGANDO_LIMITE_MS)
    expect(result.current).toEqual({ estado: 'erro' })
  })

  it('deve devolver erro quando o catálogo falha', async () => {
    mockListActiveParametros.mockRejectedValue(new Error('falha'))
    mockGetLeiturasDoVoo.mockResolvedValue(leituras('voo-1'))
    const { result } = renderHook(() => useDadosDoVoo('voo-1'))

    await resolverPromessas()

    expect(result.current).toEqual({ estado: 'erro' })
  })

  it('deve passar de carregando com mensagem para erro', async () => {
    const pedido = adiada<LeiturasDoVoo>()
    mockGetLeiturasDoVoo.mockReturnValue(pedido.promessa)
    const { result } = renderHook(() => useDadosDoVoo('voo-1'))
    avancar(CARREGANDO_LIMITE_MS)
    expect(result.current).toEqual({ estado: 'carregando', mostrarCarregando: true })

    pedido.rejeitar(new Error('x'))
    await resolverPromessas()

    expect(result.current).toEqual({ estado: 'erro' })
  })

  it('deve ignorar a resposta que chega depois de desmontar, sem deixar timer', async () => {
    const pedido = adiada<LeiturasDoVoo>()
    mockGetLeiturasDoVoo.mockReturnValue(pedido.promessa)
    const { unmount } = renderHook(() => useDadosDoVoo('voo-1'))

    unmount()
    expect(vi.getTimerCount()).toBe(0)
    pedido.resolver(leituras('voo-1'))
    await resolverPromessas()

    expect(consoleError).not.toHaveBeenCalled()
  })

  it('deve ignorar a resposta de um voo antigo quando o voo muda na mesma montagem', async () => {
    const antigo = adiada<LeiturasDoVoo>()
    const novo = adiada<LeiturasDoVoo>()
    mockGetLeiturasDoVoo.mockImplementation((id: string) =>
      id === 'voo-a' ? antigo.promessa : novo.promessa
    )
    const { result, rerender } = renderHook(({ id }) => useDadosDoVoo(id), {
      initialProps: { id: 'voo-a' },
    })

    rerender({ id: 'voo-b' })
    expect(result.current).toEqual({ estado: 'carregando', mostrarCarregando: false })
    antigo.resolver(leituras('voo-a'))
    await resolverPromessas()
    expect(result.current.estado).toBe('carregando')

    novo.resolver(leituras('voo-b'))
    await resolverPromessas()
    expect(result.current).toMatchObject({ estado: 'pronto', leituras: { sessaoId: 'voo-b' } })
  })

  it('deve ignorar resposta com sessaoId diferente do pedido', async () => {
    mockGetLeiturasDoVoo.mockResolvedValue(leituras('outro'))
    const { result } = renderHook(() => useDadosDoVoo('voo-1'))

    await resolverPromessas()

    expect(result.current.estado).toBe('carregando')
  })

  it('deve buscar de novo a cada montagem, sem cache', async () => {
    mockGetLeiturasDoVoo.mockResolvedValue(leituras('voo-1'))
    const primeira = renderHook(() => useDadosDoVoo('voo-1'))
    await resolverPromessas()
    primeira.unmount()

    renderHook(() => useDadosDoVoo('voo-1'))
    await resolverPromessas()

    expect(mockGetLeiturasDoVoo).toHaveBeenCalledTimes(2)
  })
})
