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

  it('deve gerar um id novo a cada showNotification', () => {
    const { result } = renderHook(() => useNotification())
    act(() => {
      result.current.showNotification('Primeira', 'info')
    })
    const id1 = result.current.notification?.id
    act(() => {
      result.current.showNotification('Segunda', 'success')
    })
    const id2 = result.current.notification?.id
    expect(typeof id1).toBe('number')
    expect(typeof id2).toBe('number')
    expect(id2).not.toBe(id1)
  })

  it('deve gerar um id novo mesmo quando o texto e o tipo se repetem', () => {
    const { result } = renderHook(() => useNotification())
    act(() => {
      result.current.showNotification('Coleta iniciada', 'success')
    })
    const primeira = result.current.notification
    act(() => {
      result.current.showNotification('Coleta iniciada', 'success')
    })
    const segunda = result.current.notification
    expect(segunda?.message).toBe('Coleta iniciada')
    expect(segunda?.id).not.toBe(primeira?.id)
    expect(segunda).not.toBe(primeira)
  })

  it('deve gerar id novo depois de clearNotification, sem reaproveitar o anterior', () => {
    const { result } = renderHook(() => useNotification())
    act(() => {
      result.current.showNotification('Aviso', 'info')
    })
    const id1 = result.current.notification?.id
    act(() => {
      result.current.clearNotification()
    })
    act(() => {
      result.current.showNotification('Aviso', 'info')
    })
    expect(result.current.notification?.id).not.toBe(id1)
  })

  it('deve manter showNotification e clearNotification estáveis entre renderizações', () => {
    const { result, rerender } = renderHook(() => useNotification())
    const { showNotification, clearNotification } = result.current
    act(() => {
      result.current.showNotification('Aviso', 'info')
    })
    rerender()
    expect(result.current.showNotification).toBe(showNotification)
    expect(result.current.clearNotification).toBe(clearNotification)
  })
})
