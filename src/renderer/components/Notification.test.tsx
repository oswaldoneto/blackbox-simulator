import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import { Notification } from './Notification'

afterEach(cleanup)

describe('Notification', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve renderizar a mensagem passada via props', () => {
    const onClose = vi.fn()
    const { getByText } = render(<Notification message="Coleta iniciada" type="success" onClose={onClose} />)
    expect(getByText('Coleta iniciada')).toBeInTheDocument()
  })

  it('deve chamar onClose após 4 segundos', () => {
    const onClose = vi.fn()
    render(<Notification message="Teste" type="info" onClose={onClose} />)
    expect(onClose).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('deve não chamar onClose antes de 4 segundos', () => {
    const onClose = vi.fn()
    render(<Notification message="Teste" type="info" onClose={onClose} />)
    act(() => {
      vi.advanceTimersByTime(3999)
    })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('deve aplicar a cor correta para tipo success', () => {
    const onClose = vi.fn()
    const { container } = render(<Notification message="ok" type="success" onClose={onClose} />)
    const el = container.querySelector('[role="status"]') as HTMLElement
    expect(el.getAttribute('style')).toContain('var(--color-success)')
  })

  it('deve aplicar a cor correta para tipo error', () => {
    const onClose = vi.fn()
    const { container } = render(<Notification message="erro" type="error" onClose={onClose} />)
    const el = container.querySelector('[role="status"]') as HTMLElement
    expect(el.getAttribute('style')).toContain('var(--color-error)')
  })

  it('deve aplicar a cor correta para tipo info', () => {
    const onClose = vi.fn()
    const { container } = render(<Notification message="info" type="info" onClose={onClose} />)
    const el = container.querySelector('[role="status"]') as HTMLElement
    expect(el.getAttribute('style')).toContain('var(--color-accent)')
  })
})
