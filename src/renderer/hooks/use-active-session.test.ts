import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
// Mock the IPC layer before importing the hook
const mockGetActiveSessao = vi.fn()
const mockOnSessionStarted = vi.fn()

vi.mock('../ipc/session-ipc', () => ({
  getActiveSessao: () => mockGetActiveSessao(),
  onSessionStarted: (cb: (s: unknown) => void) => mockOnSessionStarted(cb),
}))

import { useActiveSession } from './use-active-session'
import type { Sessao } from '../../../shared/types'

const sessaoAtiva: Sessao = {
  id: 'sess-001',
  iniciadaEm: '2024-01-01T00:00:00.000Z',
  encerradaEm: null,
  aeronave: 'Cessna 172',
  aerodromoOrigem: null,
  aerodromoDestino: null,
  status: 'ativa',
}

describe('useActiveSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: onSessionStarted returns a no-op unsubscribe
    mockOnSessionStarted.mockReturnValue(vi.fn())
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

  it('deve chamar a função de remoção do listener ao desmontar', async () => {
    mockGetActiveSessao.mockResolvedValue(null)
    const removeListener = vi.fn()
    mockOnSessionStarted.mockReturnValue(removeListener)

    const { unmount } = renderHook(() => useActiveSession())
    await waitFor(() => {})
    unmount()
    expect(removeListener).toHaveBeenCalledOnce()
  })
})
