import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { agoraDoPainel, useAgoraDoPainel } from './use-agora-do-painel'
import { RELOGIO_SEM_SINAL_MS } from './limites-de-tempo'
import type { EstadoPainel } from './panel-state'

type Estado = Exclude<EstadoPainel, 'sem-sessao'>

const T0 = Date.parse('2026-11-17T12:00:00.000Z')

describe('agoraDoPainel', () => {
  it('deve usar o último pacote na sessão ativa (T1)', () => {
    expect(agoraDoPainel({ estado: 'ativa', ultimoInstante: T0, relogio: T0 + 5000, congelado: null })).toBe(T0)
  })

  it('deve devolver null na sessão ativa antes do primeiro pacote', () => {
    expect(agoraDoPainel({ estado: 'ativa', ultimoInstante: null, relogio: T0, congelado: null })).toBeNull()
  })

  it('deve usar o maior entre o relógio e o último pacote no sem sinal (decisão 1)', () => {
    expect(
      agoraDoPainel({ estado: 'sem-sinal', ultimoInstante: T0, relogio: T0 + 3000, congelado: null })
    ).toBe(T0 + 3000)
    expect(
      agoraDoPainel({ estado: 'sem-sinal', ultimoInstante: T0, relogio: T0 - 3000, congelado: null })
    ).toBe(T0)
    expect(agoraDoPainel({ estado: 'sem-sinal', ultimoInstante: null, relogio: T0, congelado: null })).toBe(T0)
  })

  it('deve usar o valor congelado na sessão encerrada, ou o último pacote sem ele', () => {
    expect(
      agoraDoPainel({ estado: 'encerrada', ultimoInstante: T0, relogio: T0 + 9000, congelado: T0 + 4000 })
    ).toBe(T0 + 4000)
    expect(agoraDoPainel({ estado: 'encerrada', ultimoInstante: T0, relogio: T0 + 9000, congelado: null })).toBe(T0)
  })
})

describe('useAgoraDoPainel', () => {
  type Props = { estado: Estado; ultimo: number | null }

  function renderAgora(inicial: Props) {
    return renderHook((props: Props) => useAgoraDoPainel(props.estado, props.ultimo), {
      initialProps: inicial,
    })
  }

  function avancar(ms: number): void {
    act(() => {
      vi.advanceTimersByTime(ms)
    })
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(T0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve usar passo de 1 s no relógio do sem sinal', () => {
    expect(RELOGIO_SEM_SINAL_MS).toBe(1000)
  })

  it('não deve ligar timer na sessão ativa e deve seguir o último pacote', () => {
    const { result, rerender } = renderAgora({ estado: 'ativa', ultimo: T0 - 500 })

    expect(vi.getTimerCount()).toBe(0)
    expect(result.current).toBe(T0 - 500)

    avancar(5000)
    expect(result.current).toBe(T0 - 500)

    rerender({ estado: 'ativa', ultimo: T0 + 4500 })
    expect(result.current).toBe(T0 + 4500)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('deve avançar o "agora" a cada 1 s no sem sinal, sem pacotes novos', () => {
    const { result } = renderAgora({ estado: 'sem-sinal', ultimo: T0 - 3000 })

    expect(result.current).toBe(T0)

    avancar(1000)
    expect(result.current).toBe(T0 + 1000)

    avancar(1000)
    expect(result.current).toBe(T0 + 2000)
  })

  it('deve atualizar o relógio logo ao entrar no sem sinal', () => {
    const { result, rerender } = renderAgora({ estado: 'ativa', ultimo: T0 })
    vi.setSystemTime(T0 + 2000) // o relógio local andou sem o hook saber

    rerender({ estado: 'sem-sinal', ultimo: T0 })
    avancar(0)

    expect(result.current).toBe(T0 + 2000)
  })

  it('deve congelar o "agora" quando a sessão encerra durante o sem sinal', () => {
    const { result, rerender } = renderAgora({ estado: 'sem-sinal', ultimo: T0 - 3000 })
    avancar(2000)
    expect(result.current).toBe(T0 + 2000)

    rerender({ estado: 'encerrada', ultimo: T0 - 3000 })
    expect(result.current).toBe(T0 + 2000)

    avancar(5000)
    expect(result.current).toBe(T0 + 2000)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('deve congelar no último pacote quando a sessão encerra ativa', () => {
    const { result, rerender } = renderAgora({ estado: 'ativa', ultimo: T0 })

    rerender({ estado: 'encerrada', ultimo: T0 })
    avancar(5000)

    expect(result.current).toBe(T0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('deve voltar a seguir o último pacote e parar o relógio quando o sinal volta', () => {
    const { result, rerender } = renderAgora({ estado: 'sem-sinal', ultimo: T0 - 3000 })
    avancar(3000)

    rerender({ estado: 'ativa', ultimo: T0 + 3500 })

    expect(result.current).toBe(T0 + 3500)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('deve limpar o timer ao desmontar', () => {
    const { unmount } = renderAgora({ estado: 'sem-sinal', ultimo: null })
    expect(vi.getTimerCount()).toBeGreaterThan(0)

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
