import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { EstadoConexao } from '../../shared/types'

const { mockGetConnectionState, mockOnConnectionStateChanged } = vi.hoisted(() => ({
  mockGetConnectionState: vi.fn(),
  mockOnConnectionStateChanged: vi.fn(),
}))

vi.mock('../ipc/connection-ipc', () => ({
  getConnectionState: () => mockGetConnectionState(),
  onConnectionStateChanged: (cb: (e: EstadoConexao) => void) => mockOnConnectionStateChanged(cb),
}))

import { useConnectionState } from './use-connection-state'

let capturado: ((estado: EstadoConexao) => void) | null = null

describe('useConnectionState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturado = null
    mockOnConnectionStateChanged.mockImplementation((cb: (e: EstadoConexao) => void) => {
      capturado = cb
      return vi.fn()
    })
  })

  it('deve começar como "desconectado"', () => {
    mockGetConnectionState.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useConnectionState())
    expect(result.current).toBe('desconectado')
  })

  it('deve adotar o estado devolvido por getConnectionState', async () => {
    mockGetConnectionState.mockResolvedValue('conectado')
    const { result } = renderHook(() => useConnectionState())
    await waitFor(() => expect(result.current).toBe('conectado'))
  })

  it('deve atualizar ao receber evento de mudança de conexão', async () => {
    mockGetConnectionState.mockResolvedValue('conectado')
    const { result } = renderHook(() => useConnectionState())
    await waitFor(() => expect(result.current).toBe('conectado'))

    act(() => capturado!('desconectado'))

    expect(result.current).toBe('desconectado')
  })

  it('deve manter o evento recebido durante a consulta inicial, mais recente que a resposta', async () => {
    let resolver: (e: EstadoConexao) => void = () => {}
    mockGetConnectionState.mockReturnValue(
      new Promise<EstadoConexao>((r) => {
        resolver = r
      })
    )
    const { result } = renderHook(() => useConnectionState())

    act(() => capturado!('conectado'))
    await act(async () => {
      resolver('desconectado')
    })

    expect(result.current).toBe('conectado')
  })

  it('deve logar e ficar "desconectado" quando getConnectionState falha', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const falha = new Error('ipc')
    mockGetConnectionState.mockRejectedValue(falha)

    const { result } = renderHook(() => useConnectionState())

    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('useConnectionState'), falha)
    )
    expect(result.current).toBe('desconectado')
    consoleError.mockRestore()
  })

  it('deve seguir os eventos de conexão depois de getConnectionState falhar', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockGetConnectionState.mockRejectedValue(new Error('ipc'))
    const { result } = renderHook(() => useConnectionState())
    await waitFor(() => expect(consoleError).toHaveBeenCalled())

    act(() => capturado!('conectado'))

    expect(result.current).toBe('conectado')
    consoleError.mockRestore()
  })

  it('deve ignorar a resposta de getConnectionState que chega depois de desmontar', async () => {
    let resolver: (e: EstadoConexao) => void = () => {}
    mockGetConnectionState.mockReturnValue(
      new Promise<EstadoConexao>((r) => {
        resolver = r
      })
    )
    const { result, unmount } = renderHook(() => useConnectionState())
    unmount()
    await act(async () => {
      resolver('conectado')
    })
    expect(result.current).toBe('desconectado')
  })

  it('deve remover o listener ao desmontar', () => {
    const remove = vi.fn()
    mockOnConnectionStateChanged.mockReturnValue(remove)
    mockGetConnectionState.mockReturnValue(new Promise(() => {}))
    const { unmount } = renderHook(() => useConnectionState())
    unmount()
    expect(remove).toHaveBeenCalledOnce()
  })
})
