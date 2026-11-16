import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNotification } from './use-notification'

describe('useNotification', () => {
  it('deve iniciar sem notificação', () => {
    const { result } = renderHook(() => useNotification())
    expect(result.current.notification).toBeNull()
  })

  it('deve exibir notificação ao chamar showNotification', () => {
    const { result } = renderHook(() => useNotification())
    act(() => {
      result.current.showNotification('Sessão iniciada', 'success')
    })
    expect(result.current.notification).not.toBeNull()
    expect(result.current.notification?.message).toBe('Sessão iniciada')
    expect(result.current.notification?.type).toBe('success')
  })

  it('deve limpar notificação ao chamar clearNotification', () => {
    const { result } = renderHook(() => useNotification())
    act(() => {
      result.current.showNotification('Algum aviso', 'info')
    })
    expect(result.current.notification).not.toBeNull()
    act(() => {
      result.current.clearNotification()
    })
    expect(result.current.notification).toBeNull()
  })

  it('deve substituir notificação anterior ao chamar showNotification novamente', () => {
    const { result } = renderHook(() => useNotification())
    act(() => {
      result.current.showNotification('Primeira', 'info')
    })
    act(() => {
      result.current.showNotification('Segunda', 'error')
    })
    expect(result.current.notification?.message).toBe('Segunda')
    expect(result.current.notification?.type).toBe('error')
  })
})
