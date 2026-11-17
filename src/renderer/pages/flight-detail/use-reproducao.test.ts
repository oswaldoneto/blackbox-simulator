import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReproducao, INTERVALO_DA_REPRODUCAO_MS } from './use-reproducao'

const DURACAO = 60

function avancar(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

// CA-005-1, CA-005-4, CA-005-13
describe('useReproducao', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve abrir pausada em 0, a 1×, sem timer', () => {
    const { result } = renderHook(() => useReproducao(DURACAO))

    expect(result.current.reproducao).toEqual({ posicao: 0, tocando: false, velocidade: 1 })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('deve avançar 1 s por segundo de relógio a 1× enquanto toca, com passo de 250 ms', () => {
    const { result } = renderHook(() => useReproducao(DURACAO))

    act(() => result.current.alternar())
    expect(vi.getTimerCount()).toBe(1)
    avancar(INTERVALO_DA_REPRODUCAO_MS)
    expect(result.current.reproducao.posicao).toBe(0.25)
    avancar(750)
    expect(result.current.reproducao.posicao).toBe(1)
    expect(INTERVALO_DA_REPRODUCAO_MS).toBe(250)
  })

  it.each([
    [4, 4],
    [16, 16],
  ] as const)('deve avançar a %i×', (velocidade, esperado) => {
    const { result } = renderHook(() => useReproducao(DURACAO))

    act(() => result.current.mudarVelocidade(velocidade))
    act(() => result.current.alternar())
    avancar(1000)

    expect(result.current.reproducao.posicao).toBe(esperado)
  })

  it('não deve deixar timer ao pausar', () => {
    const { result } = renderHook(() => useReproducao(DURACAO))
    act(() => result.current.alternar())
    avancar(1000)

    act(() => result.current.alternar())

    expect(result.current.reproducao).toMatchObject({ posicao: 1, tocando: false })
    expect(vi.getTimerCount()).toBe(0)
    avancar(5000)
    expect(result.current.reproducao.posicao).toBe(1)
  })

  it('deve pausar no fim, sem timer, e recomeçar do zero ao reproduzir de novo', () => {
    const { result } = renderHook(() => useReproducao(DURACAO))
    act(() => result.current.mudarVelocidade(16))
    act(() => result.current.alternar())

    avancar(10_000)

    expect(result.current.reproducao).toEqual({ posicao: DURACAO, tocando: false, velocidade: 16 })
    expect(vi.getTimerCount()).toBe(0)

    act(() => result.current.alternar())
    expect(result.current.reproducao).toMatchObject({ posicao: 0, tocando: true })
  })

  it('deve posicionar pela linha do tempo, preso entre 0 e a duração', () => {
    const { result } = renderHook(() => useReproducao(DURACAO))

    act(() => result.current.posicionar(30))
    expect(result.current.reproducao.posicao).toBe(30)
    act(() => result.current.posicionar(999))
    expect(result.current.reproducao.posicao).toBe(DURACAO)
  })

  it('não deve deixar timer ao desmontar tocando', () => {
    const { result, unmount } = renderHook(() => useReproducao(DURACAO))
    act(() => result.current.alternar())
    expect(vi.getTimerCount()).toBe(1)

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
