import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
// Mock the IPC layer before importing the hook
const { mockGetActiveSessao, mockOnSessionStarted, mockOnSessionEnded, mockOnSessionEndFailed } =
  vi.hoisted(() => ({
    mockGetActiveSessao: vi.fn(),
    mockOnSessionStarted: vi.fn(),
    mockOnSessionEnded: vi.fn(),
    mockOnSessionEndFailed: vi.fn(),
  }))

vi.mock('../ipc/session-ipc', () => ({
  getActiveSessao: () => mockGetActiveSessao(),
  onSessionStarted: (cb: (s: unknown) => void) => mockOnSessionStarted(cb),
  onSessionEnded: (cb: (s: unknown) => void) => mockOnSessionEnded(cb),
  onSessionEndFailed: (cb: (s: unknown) => void) => mockOnSessionEndFailed(cb),
}))

import { useActiveSession } from './use-active-session'
import type { Sessao } from '../../shared/types'

const sessaoAtiva: Sessao = {
  id: 'sess-001',
  iniciadaEm: '2024-01-01T00:00:00.000Z',
  encerradaEm: null,
  aeronave: 'Cessna 172',
  aerodromoOrigem: null,
  aerodromoDestino: null,
  status: 'ativa',
  parametrosNaoAplicaveis: [],
}

describe('useActiveSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: onSessionStarted returns a no-op unsubscribe
    mockOnSessionStarted.mockReturnValue(vi.fn())
    mockOnSessionEnded.mockReturnValue(vi.fn())
    mockOnSessionEndFailed.mockReturnValue(vi.fn())
  })

  it('deve iniciar com loading = true', () => {
    // getActiveSessao never resolves during this check
    mockGetActiveSessao.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useActiveSession())
    expect(result.current.loading).toBe(true)
  })

  it('deve definir loading = false após getActiveSessao responder', async () => {
    mockGetActiveSessao.mockResolvedValue(null)
    const { result } = renderHook(() => useActiveSession())
    expect(result.current.loading).toBe(true)
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('deve definir sessaoAtiva com o valor retornado por getActiveSessao', async () => {
    mockGetActiveSessao.mockResolvedValue(sessaoAtiva)
    const { result } = renderHook(() => useActiveSession())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.sessaoAtiva).toEqual(sessaoAtiva)
  })

  it('deve manter sessaoAtiva null quando getActiveSessao retorna null', async () => {
    mockGetActiveSessao.mockResolvedValue(null)
    const { result } = renderHook(() => useActiveSession())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.sessaoAtiva).toBeNull()
  })

  it('deve atualizar sessaoAtiva ao receber evento SESSION_STARTED', async () => {
    mockGetActiveSessao.mockResolvedValue(null)
    // Capture the callback registered by onSessionStarted
    let capturedCallback: ((sessao: Sessao) => void) | null = null
    mockOnSessionStarted.mockImplementation((cb: (sessao: Sessao) => void) => {
      capturedCallback = cb
      return vi.fn()
    })

    const { result } = renderHook(() => useActiveSession())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.sessaoAtiva).toBeNull()
    expect(capturedCallback).not.toBeNull()

    act(() => {
      capturedCallback!(sessaoAtiva)
    })

    expect(result.current.sessaoAtiva).toEqual(sessaoAtiva)
  })

  it('deve chamar a função de remoção dos listeners ao desmontar', async () => {
    mockGetActiveSessao.mockResolvedValue(null)
    const removeStarted = vi.fn()
    const removeEnded = vi.fn()
    const removeEndFailed = vi.fn()
    mockOnSessionStarted.mockReturnValue(removeStarted)
    mockOnSessionEnded.mockReturnValue(removeEnded)
    mockOnSessionEndFailed.mockReturnValue(removeEndFailed)

    const { result, unmount } = renderHook(() => useActiveSession())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    unmount()
    expect(removeStarted).toHaveBeenCalledOnce()
    expect(removeEnded).toHaveBeenCalledOnce()
    expect(removeEndFailed).toHaveBeenCalledOnce()
  })

  it('deve guardar a sessão encerrada ao receber evento SESSION_ENDED', async () => {
    mockGetActiveSessao.mockResolvedValue(sessaoAtiva)
    let capturedEnded: ((sessao: Sessao) => void) | null = null
    mockOnSessionEnded.mockImplementation((cb: (sessao: Sessao) => void) => {
      capturedEnded = cb
      return vi.fn()
    })

    const { result } = renderHook(() => useActiveSession())
    await waitFor(() => {
      expect(result.current.sessaoAtiva).toEqual(sessaoAtiva)
    })

    const encerrada: Sessao = {
      ...sessaoAtiva,
      status: 'encerrada',
      encerradaEm: '2024-01-01T01:00:00.000Z',
    }
    act(() => {
      capturedEnded!(encerrada)
    })

    expect(result.current.sessaoAtiva).toEqual(encerrada)
    expect(result.current.sessaoAtiva?.status).toBe('encerrada')
  })

  describe('falha e corrida na consulta inicial', () => {
    let consoleError: MockInstance<Parameters<typeof console.error>, void>

    beforeEach(() => {
      consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleError.mockRestore()
    })

    it('deve logar, sair do carregamento e seguir sem sessão quando getActiveSessao falha', async () => {
      const falha = new Error('ipc')
      mockGetActiveSessao.mockRejectedValue(falha)

      const { result } = renderHook(() => useActiveSession())

      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.sessaoAtiva).toBeNull()
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('useActiveSession'), falha)
    })

    it('deve aceitar SESSION_STARTED depois de getActiveSessao falhar', async () => {
      mockGetActiveSessao.mockRejectedValue(new Error('ipc'))
      let started: ((s: Sessao) => void) | null = null
      mockOnSessionStarted.mockImplementation((cb: (s: Sessao) => void) => {
        started = cb
        return vi.fn()
      })

      const { result } = renderHook(() => useActiveSession())
      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => started!(sessaoAtiva))

      expect(result.current.sessaoAtiva).toEqual(sessaoAtiva)
    })

    it('deve sair do carregamento ao receber SESSION_STARTED antes da resposta', () => {
      mockGetActiveSessao.mockReturnValue(new Promise(() => {}))
      let started: ((s: Sessao) => void) | null = null
      mockOnSessionStarted.mockImplementation((cb: (s: Sessao) => void) => {
        started = cb
        return vi.fn()
      })

      const { result } = renderHook(() => useActiveSession())
      expect(result.current.loading).toBe(true)

      act(() => started!(sessaoAtiva))

      expect(result.current.loading).toBe(false)
      expect(result.current.sessaoAtiva).toEqual(sessaoAtiva)
    })

    it('deve descartar a resposta tardia de getActiveSessao quando SESSION_STARTED chegou antes', async () => {
      let resolver: (s: Sessao | null) => void = () => {}
      mockGetActiveSessao.mockReturnValue(
        new Promise<Sessao | null>((r) => {
          resolver = r
        })
      )
      let started: ((s: Sessao) => void) | null = null
      mockOnSessionStarted.mockImplementation((cb: (s: Sessao) => void) => {
        started = cb
        return vi.fn()
      })

      const { result } = renderHook(() => useActiveSession())
      act(() => started!(sessaoAtiva))

      await act(async () => {
        resolver(null)
      })

      expect(result.current.sessaoAtiva).toEqual(sessaoAtiva)
      expect(result.current.loading).toBe(false)
    })

    it('deve descartar a resposta tardia de getActiveSessao quando SESSION_ENDED chegou antes', async () => {
      let resolver: (s: Sessao | null) => void = () => {}
      mockGetActiveSessao.mockReturnValue(
        new Promise<Sessao | null>((r) => {
          resolver = r
        })
      )
      let ended: ((s: Sessao) => void) | null = null
      mockOnSessionEnded.mockImplementation((cb: (s: Sessao) => void) => {
        ended = cb
        return vi.fn()
      })
      const encerrada: Sessao = {
        ...sessaoAtiva,
        status: 'encerrada',
        encerradaEm: '2024-01-01T01:00:00.000Z',
      }

      const { result } = renderHook(() => useActiveSession())
      act(() => ended!(encerrada))

      // A resposta tardia traz um valor diferente (a sessão ainda ativa) e deve ser descartada.
      await act(async () => {
        resolver(sessaoAtiva)
      })

      expect(result.current.sessaoAtiva).toEqual(encerrada)
      expect(result.current.loading).toBe(false)
    })

    it('deve manter a sessão do evento quando getActiveSessao falha depois do evento', async () => {
      let rejeitar: (e: unknown) => void = () => {}
      mockGetActiveSessao.mockReturnValue(
        new Promise((_, rej) => {
          rejeitar = rej
        })
      )
      let started: ((s: Sessao) => void) | null = null
      mockOnSessionStarted.mockImplementation((cb: (s: Sessao) => void) => {
        started = cb
        return vi.fn()
      })

      const { result } = renderHook(() => useActiveSession())
      act(() => started!(sessaoAtiva))
      await act(async () => {
        rejeitar(new Error('ipc'))
      })

      expect(result.current.sessaoAtiva).toEqual(sessaoAtiva)
      expect(result.current.loading).toBe(false)
      expect(consoleError).toHaveBeenCalled()
    })

    it('deve ignorar a resposta de getActiveSessao que chega depois de desmontar', async () => {
      let resolver: (s: Sessao | null) => void = () => {}
      mockGetActiveSessao.mockReturnValue(
        new Promise<Sessao | null>((r) => {
          resolver = r
        })
      )
      const { result, unmount } = renderHook(() => useActiveSession())
      unmount()
      await act(async () => {
        resolver(sessaoAtiva)
      })
      expect(result.current.sessaoAtiva).toBeNull()
      expect(result.current.loading).toBe(true)
    })
  })

  // --- UC-003: falha ao gravar o encerramento (session:end-failed) ---

  describe('session:end-failed', () => {
    function capturarEndFailed(): { emitir: (s: Sessao) => void } {
      let cb: ((s: Sessao) => void) | null = null
      mockOnSessionEndFailed.mockImplementation((c: (s: Sessao) => void) => {
        cb = c
        return vi.fn()
      })
      return { emitir: (s) => act(() => cb!(s)) }
    }

    it('deve marcar como encerrada, só para exibição, a sessão recebida na falha', async () => {
      mockGetActiveSessao.mockResolvedValue(sessaoAtiva)
      const endFailed = capturarEndFailed()

      const { result } = renderHook(() => useActiveSession())
      await waitFor(() => expect(result.current.sessaoAtiva).toEqual(sessaoAtiva))

      endFailed.emitir(sessaoAtiva)

      expect(result.current.sessaoAtiva).toEqual({ ...sessaoAtiva, status: 'encerrada' })
      // Não inventa hora de fim: no banco a sessão continua sem encerramento.
      expect(result.current.sessaoAtiva?.encerradaEm).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    it('não deve alterar o objeto recebido no evento', async () => {
      mockGetActiveSessao.mockResolvedValue(sessaoAtiva)
      const endFailed = capturarEndFailed()
      const recebida: Sessao = { ...sessaoAtiva }

      const { result } = renderHook(() => useActiveSession())
      await waitFor(() => expect(result.current.loading).toBe(false))
      endFailed.emitir(recebida)

      expect(recebida.status).toBe('ativa')
    })

    it('deve sair do carregamento e descartar a resposta tardia de getActiveSessao quando a falha chegou antes', async () => {
      let resolver: (s: Sessao | null) => void = () => {}
      mockGetActiveSessao.mockReturnValue(
        new Promise<Sessao | null>((r) => {
          resolver = r
        })
      )
      const endFailed = capturarEndFailed()

      const { result } = renderHook(() => useActiveSession())
      expect(result.current.loading).toBe(true)
      endFailed.emitir(sessaoAtiva)
      expect(result.current.loading).toBe(false)

      await act(async () => {
        resolver(sessaoAtiva)
      })

      expect(result.current.sessaoAtiva?.status).toBe('encerrada')
    })

    it('deve aceitar uma nova sessão depois da falha (religamento)', async () => {
      mockGetActiveSessao.mockResolvedValue(sessaoAtiva)
      const endFailed = capturarEndFailed()
      let started: ((s: Sessao) => void) | null = null
      mockOnSessionStarted.mockImplementation((cb: (s: Sessao) => void) => {
        started = cb
        return vi.fn()
      })

      const { result } = renderHook(() => useActiveSession())
      await waitFor(() => expect(result.current.loading).toBe(false))
      endFailed.emitir(sessaoAtiva)

      const nova: Sessao = { ...sessaoAtiva, id: 'sess-002' }
      act(() => started!(nova))

      expect(result.current.sessaoAtiva).toEqual(nova)
    })
  })
})
