import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Sessao } from '../../shared/types'

const { mockListSessoesEncerradas, mockOnSessionEnded, mockOnSessionEndFailed, mockRemover } =
  vi.hoisted(() => ({
    mockListSessoesEncerradas: vi.fn(),
    mockOnSessionEnded: vi.fn(),
    mockOnSessionEndFailed: vi.fn(),
    mockRemover: vi.fn(),
  }))

vi.mock('../ipc/session-ipc', () => ({
  listSessoesEncerradas: () => mockListSessoesEncerradas(),
  onSessionEnded: (cb: (s: Sessao) => void) => mockOnSessionEnded(cb),
  onSessionEndFailed: (cb: (s: Sessao) => void) => mockOnSessionEndFailed(cb),
}))

import { useSessoesEncerradas, CARREGANDO_LIMITE_MS } from './use-sessoes-encerradas'

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

function sessao(id: string, overrides: Partial<Sessao> = {}): Sessao {
  return {
    id,
    iniciadaEm: '2026-11-17T10:00:00.000Z',
    encerradaEm: '2026-11-17T11:00:00.000Z',
    aeronave: '',
    aerodromoOrigem: null,
    aerodromoDestino: null,
    status: 'encerrada',
    parametrosNaoAplicaveis: [],
    ...overrides,
  }
}

let aoEncerrar: ((s: Sessao) => void) | null = null

async function resolverPromessas(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
  })
}

function avancar(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function emitirEncerrada(s: Sessao = sessao('nova')): void {
  act(() => {
    aoEncerrar!(s)
  })
}

describe('useSessoesEncerradas', () => {
  let consoleError: MockInstance<Parameters<typeof console.error>, void>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    aoEncerrar = null
    mockOnSessionEnded.mockImplementation((cb: (s: Sessao) => void) => {
      aoEncerrar = cb
      return mockRemover
    })
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
    vi.useRealTimers()
  })

  it('deve buscar as sessões encerradas uma vez na montagem e começar sem lista, sem erro e sem indicador', () => {
    mockListSessoesEncerradas.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useSessoesEncerradas())

    expect(mockListSessoesEncerradas).toHaveBeenCalledOnce()
    expect(result.current).toEqual({ sessoes: null, erro: false, carregando: false })
  })

  it('deve devolver a lista na ordem recebida do main', async () => {
    const lista = [sessao('b'), sessao('a')]
    mockListSessoesEncerradas.mockResolvedValue(lista)

    const { result } = renderHook(() => useSessoesEncerradas())
    await resolverPromessas()

    expect(result.current.sessoes).toEqual(lista)
    expect(result.current.erro).toBe(false)
    expect(result.current.carregando).toBe(false)
  })

  it('deve devolver lista vazia quando não há sessões encerradas', async () => {
    mockListSessoesEncerradas.mockResolvedValue([])

    const { result } = renderHook(() => useSessoesEncerradas())
    await resolverPromessas()

    expect(result.current.sessoes).toEqual([])
  })

  describe('indicador de carregamento (500 ms)', () => {
    it('deve usar o limite de 500 ms', () => {
      expect(CARREGANDO_LIMITE_MS).toBe(500)
    })

    it('não deve mostrar o indicador antes de 500 ms e deve mostrá-lo aos 500 ms', () => {
      mockListSessoesEncerradas.mockReturnValue(new Promise(() => {}))
      const { result } = renderHook(() => useSessoesEncerradas())

      avancar(499)
      expect(result.current.carregando).toBe(false)
      avancar(1)
      expect(result.current.carregando).toBe(true)
      expect(result.current.sessoes).toBeNull()
    })

    it('não deve mostrar o indicador quando a lista chega antes de 500 ms', async () => {
      const busca = adiada<Sessao[]>()
      mockListSessoesEncerradas.mockReturnValue(busca.promessa)
      const { result } = renderHook(() => useSessoesEncerradas())

      avancar(300)
      busca.resolver([sessao('a')])
      await resolverPromessas()
      avancar(1000)

      expect(result.current.carregando).toBe(false)
      expect(result.current.sessoes).toHaveLength(1)
    })

    it('deve tirar o indicador quando a lista chega depois de 500 ms', async () => {
      const busca = adiada<Sessao[]>()
      mockListSessoesEncerradas.mockReturnValue(busca.promessa)
      const { result } = renderHook(() => useSessoesEncerradas())

      avancar(800)
      expect(result.current.carregando).toBe(true)
      busca.resolver([sessao('a')])
      await resolverPromessas()

      expect(result.current.carregando).toBe(false)
      expect(result.current.sessoes).toHaveLength(1)
    })

    it('não deve mostrar o indicador numa nova busca com a lista já carregada', async () => {
      mockListSessoesEncerradas.mockResolvedValueOnce([sessao('a')])
      const { result } = renderHook(() => useSessoesEncerradas())
      await resolverPromessas()

      mockListSessoesEncerradas.mockReturnValueOnce(new Promise(() => {}))
      emitirEncerrada()
      avancar(2000)

      expect(result.current.carregando).toBe(false)
      expect(result.current.sessoes).toHaveLength(1)
    })
  })

  describe('erro', () => {
    it('deve marcar erro, sair do carregamento e logar quando a primeira carga falha', async () => {
      const busca = adiada<Sessao[]>()
      mockListSessoesEncerradas.mockReturnValue(busca.promessa)
      const { result } = renderHook(() => useSessoesEncerradas())
      avancar(600)
      expect(result.current.carregando).toBe(true)

      const falha = new Error('ipc')
      busca.rejeitar(falha)
      await resolverPromessas()

      expect(result.current).toEqual({ sessoes: null, erro: true, carregando: false })
      expect(consoleError).toHaveBeenCalledWith(
        '[useSessoesEncerradas] Falha ao listar as sessões encerradas:',
        falha
      )
    })

    it('não deve tentar de novo sozinho depois da falha da primeira carga', async () => {
      mockListSessoesEncerradas.mockRejectedValue(new Error('ipc'))
      const { result } = renderHook(() => useSessoesEncerradas())
      await resolverPromessas()

      avancar(60_000)
      await resolverPromessas()

      expect(mockListSessoesEncerradas).toHaveBeenCalledOnce()
      expect(result.current.erro).toBe(true)
    })

    it('deve manter a lista anterior, sem erro, e logar quando uma nova busca falha', async () => {
      mockListSessoesEncerradas.mockResolvedValueOnce([sessao('a')])
      const { result } = renderHook(() => useSessoesEncerradas())
      await resolverPromessas()

      const falha = new Error('database is locked')
      mockListSessoesEncerradas.mockRejectedValueOnce(falha)
      emitirEncerrada()
      await resolverPromessas()

      expect(result.current.sessoes!.map((s) => s.id)).toEqual(['a'])
      expect(result.current.erro).toBe(false)
      expect(consoleError).toHaveBeenCalledWith(
        '[useSessoesEncerradas] Falha ao listar as sessões encerradas:',
        falha
      )
    })

    it('deve trocar o erro pela lista quando uma sessão encerra depois da falha e a nova busca dá certo', async () => {
      mockListSessoesEncerradas.mockRejectedValueOnce(new Error('ipc'))
      const { result } = renderHook(() => useSessoesEncerradas())
      await resolverPromessas()
      expect(result.current.erro).toBe(true)

      mockListSessoesEncerradas.mockResolvedValueOnce([sessao('nova')])
      emitirEncerrada()
      await resolverPromessas()

      expect(result.current).toEqual({ sessoes: [sessao('nova')], erro: false, carregando: false })
    })
  })

  describe('atualização por push', () => {
    it('deve buscar de novo quando chega session:ended e mostrar a lista nova', async () => {
      mockListSessoesEncerradas.mockResolvedValueOnce([sessao('a')])
      const { result } = renderHook(() => useSessoesEncerradas())
      await resolverPromessas()

      mockListSessoesEncerradas.mockResolvedValueOnce([sessao('b'), sessao('a')])
      emitirEncerrada(sessao('b'))
      await resolverPromessas()

      expect(mockListSessoesEncerradas).toHaveBeenCalledTimes(2)
      expect(result.current.sessoes!.map((s) => s.id)).toEqual(['b', 'a'])
    })

    it('não deve ouvir session:end-failed nem buscar de novo por ele', async () => {
      mockListSessoesEncerradas.mockResolvedValue([sessao('a')])
      renderHook(() => useSessoesEncerradas())
      await resolverPromessas()

      expect(mockOnSessionEndFailed).not.toHaveBeenCalled()
      expect(mockListSessoesEncerradas).toHaveBeenCalledOnce()
    })

    it('deve descartar a resposta de uma busca anterior que chega depois da mais recente', async () => {
      const primeira = adiada<Sessao[]>()
      const segunda = adiada<Sessao[]>()
      mockListSessoesEncerradas
        .mockReturnValueOnce(primeira.promessa)
        .mockReturnValueOnce(segunda.promessa)
      const { result } = renderHook(() => useSessoesEncerradas())

      emitirEncerrada(sessao('b'))
      segunda.resolver([sessao('b'), sessao('a')])
      await resolverPromessas()
      primeira.resolver([sessao('antiga')])
      await resolverPromessas()

      expect(result.current.sessoes!.map((s) => s.id)).toEqual(['b', 'a'])
    })

    it('deve ignorar a falha de uma busca anterior que chega depois da mais recente', async () => {
      const primeira = adiada<Sessao[]>()
      const segunda = adiada<Sessao[]>()
      mockListSessoesEncerradas
        .mockReturnValueOnce(primeira.promessa)
        .mockReturnValueOnce(segunda.promessa)
      const { result } = renderHook(() => useSessoesEncerradas())

      emitirEncerrada()
      primeira.rejeitar(new Error('antiga'))
      await resolverPromessas()
      expect(result.current.erro).toBe(false)

      segunda.resolver([sessao('a')])
      await resolverPromessas()
      expect(result.current).toEqual({ sessoes: [sessao('a')], erro: false, carregando: false })
    })
  })

  describe('limpeza', () => {
    it('deve remover o listener de session:ended ao desmontar', () => {
      mockListSessoesEncerradas.mockReturnValue(new Promise(() => {}))
      const { unmount } = renderHook(() => useSessoesEncerradas())

      unmount()

      expect(mockRemover).toHaveBeenCalledOnce()
    })

    it('deve ignorar a resposta e o prazo do indicador depois de desmontar', async () => {
      const busca = adiada<Sessao[]>()
      mockListSessoesEncerradas.mockReturnValue(busca.promessa)
      const { result, unmount } = renderHook(() => useSessoesEncerradas())

      unmount()
      avancar(1000)
      busca.resolver([sessao('a')])
      await resolverPromessas()

      expect(result.current).toEqual({ sessoes: null, erro: false, carregando: false })
      expect(vi.getTimerCount()).toBe(0)
    })

    it('deve ignorar a falha depois de desmontar, só com log', async () => {
      const busca = adiada<Sessao[]>()
      mockListSessoesEncerradas.mockReturnValue(busca.promessa)
      const { result, unmount } = renderHook(() => useSessoesEncerradas())

      unmount()
      busca.rejeitar(new Error('ipc'))
      await resolverPromessas()

      expect(result.current.erro).toBe(false)
      expect(consoleError).toHaveBeenCalled()
    })
  })
})
