import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { EstadoConexao, PacoteDeLeituras, Sessao } from '../../shared/types'

const { mockOnParameterReadings, mockRemoveListener } = vi.hoisted(() => ({
  mockOnParameterReadings: vi.fn(),
  mockRemoveListener: vi.fn(),
}))

vi.mock('../ipc/parameter-ipc', () => ({
  onParameterReadings: (cb: (p: PacoteDeLeituras) => void) => mockOnParameterReadings(cb),
}))

import { useLiveReadings } from './use-live-readings'
import { SEM_DADOS_LIMITE_MS } from '../components/limites-de-tempo'

let listeners: ((p: PacoteDeLeituras) => void)[] = []

function emitir(pacote: PacoteDeLeituras): void {
  act(() => {
    listeners.forEach((cb) => cb(pacote))
  })
}

function avancar(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function makeSessao(overrides: Partial<Sessao> = {}): Sessao {
  return {
    id: 'sess-1',
    iniciadaEm: '2024-01-01T00:00:00.000Z',
    encerradaEm: null,
    aeronave: '',
    aerodromoOrigem: null,
    aerodromoDestino: null,
    status: 'ativa',
    parametrosNaoAplicaveis: [],
    ...overrides,
  }
}

function pacote(sessaoId: string, altitude: number, ias = 100): PacoteDeLeituras {
  return {
    sessaoId,
    timestamp: '2024-01-01T00:00:01.000Z',
    leituras: [
      { parametroId: 'altitude_msl', valor: altitude },
      { parametroId: 'airspeed_ias', valor: ias },
    ],
  }
}

type Props = { sessao: Sessao | null; conexao: EstadoConexao }

function renderLeituras(inicial: Props) {
  return renderHook((props: Props) => useLiveReadings(props.sessao, props.conexao), {
    initialProps: inicial,
  })
}

describe('useLiveReadings', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    listeners = []
    mockOnParameterReadings.mockImplementation((cb: (p: PacoteDeLeituras) => void) => {
      listeners.push(cb)
      return () => {
        mockRemoveListener()
        listeners = listeners.filter((l) => l !== cb)
      }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('deve usar limite de 2 s sem pacote para marcar sem dados', () => {
    expect(SEM_DADOS_LIMITE_MS).toBe(2000)
  })

  it('não deve ouvir pacotes nem marcar sem dados quando não há sessão', () => {
    const { result } = renderLeituras({ sessao: null, conexao: 'conectado' })

    avancar(5000)

    expect(mockOnParameterReadings).not.toHaveBeenCalled()
    expect(result.current).toEqual({ valores: {}, semDados: false })
  })

  it('deve atualizar os valores a cada pacote da sessão ativa', () => {
    const sessao = makeSessao()
    const { result } = renderLeituras({ sessao, conexao: 'conectado' })

    emitir(pacote('sess-1', 4500, 112))
    expect(result.current.valores).toEqual({ altitude_msl: 4500, airspeed_ias: 112 })

    avancar(1000)
    emitir(pacote('sess-1', 4520, 113))
    expect(result.current.valores).toEqual({ altitude_msl: 4520, airspeed_ias: 113 })
    expect(result.current.semDados).toBe(false)
  })

  it('deve ignorar pacotes de outra sessão', () => {
    const { result } = renderLeituras({ sessao: makeSessao(), conexao: 'conectado' })

    emitir(pacote('sess-1', 4500))
    emitir(pacote('outra-sessao', 9999))

    expect(result.current.valores.altitude_msl).toBe(4500)
  })

  it('deve marcar sem dados após 2 s sem pacote e não antes', () => {
    const { result } = renderLeituras({ sessao: makeSessao(), conexao: 'conectado' })
    emitir(pacote('sess-1', 4500))

    avancar(SEM_DADOS_LIMITE_MS - 1)
    expect(result.current.semDados).toBe(false)

    avancar(1)
    expect(result.current.semDados).toBe(true)
  })

  it('deve marcar sem dados após 2 s quando nenhum pacote chegou desde o início da sessão', () => {
    const { result } = renderLeituras({ sessao: makeSessao(), conexao: 'conectado' })

    avancar(SEM_DADOS_LIMITE_MS)

    expect(result.current.semDados).toBe(true)
  })

  it('deve voltar a ter dados quando chega pacote novo depois do limite', () => {
    const { result } = renderLeituras({ sessao: makeSessao(), conexao: 'conectado' })
    emitir(pacote('sess-1', 4500))
    avancar(3000)
    expect(result.current.semDados).toBe(true)

    emitir(pacote('sess-1', 4600))

    expect(result.current.semDados).toBe(false)
    expect(result.current.valores.altitude_msl).toBe(4600)
  })

  it('não deve marcar sem dados enquanto chegam pacotes a cada 1 s', () => {
    const { result } = renderLeituras({ sessao: makeSessao(), conexao: 'conectado' })

    for (let i = 0; i < 10; i++) {
      emitir(pacote('sess-1', 4500 + i))
      avancar(1000)
      expect(result.current.semDados).toBe(false)
    }
  })

  it('não deve reiniciar o limite com pacotes de outra sessão', () => {
    const { result } = renderLeituras({ sessao: makeSessao(), conexao: 'conectado' })
    emitir(pacote('sess-1', 4500))

    avancar(1500)
    emitir(pacote('outra-sessao', 1))
    avancar(500)

    expect(result.current.semDados).toBe(true)
  })

  it('deve zerar os valores quando a conexão cai com a sessão ativa', () => {
    const sessao = makeSessao()
    const { result, rerender } = renderLeituras({ sessao, conexao: 'conectado' })
    emitir(pacote('sess-1', 4500))

    rerender({ sessao, conexao: 'desconectado' })

    expect(result.current.valores).toEqual({})
  })

  it('deve zerar os valores quando começa uma nova sessão', () => {
    const { result, rerender } = renderLeituras({ sessao: makeSessao(), conexao: 'conectado' })
    emitir(pacote('sess-1', 4500))

    rerender({ sessao: makeSessao({ id: 'sess-2' }), conexao: 'conectado' })
    expect(result.current.valores).toEqual({})
    expect(result.current.semDados).toBe(false)

    emitir(pacote('sess-1', 1111))
    expect(result.current.valores).toEqual({})

    emitir(pacote('sess-2', 2222))
    expect(result.current.valores.altitude_msl).toBe(2222)
  })

  it('deve congelar os últimos valores quando a sessão é encerrada', () => {
    const sessao = makeSessao()
    const { result, rerender } = renderLeituras({ sessao, conexao: 'conectado' })
    emitir(pacote('sess-1', 4500, 112))

    rerender({
      sessao: { ...sessao, status: 'encerrada', encerradaEm: '2024-01-01T01:00:00.000Z' },
      conexao: 'conectado',
    })

    expect(result.current.valores).toEqual({ altitude_msl: 4500, airspeed_ias: 112 })
    expect(mockRemoveListener).toHaveBeenCalledOnce()

    emitir(pacote('sess-1', 9999))
    emitir(pacote('outra-sessao', 8888))
    avancar(5000)

    expect(result.current.valores).toEqual({ altitude_msl: 4500, airspeed_ias: 112 })
    expect(result.current.semDados).toBe(false)
  })

  it('deve manter os valores congelados se a conexão cair com a sessão encerrada', () => {
    const sessao = makeSessao()
    const encerrada: Sessao = { ...sessao, status: 'encerrada' }
    const { result, rerender } = renderLeituras({ sessao, conexao: 'conectado' })
    emitir(pacote('sess-1', 4500))
    rerender({ sessao: encerrada, conexao: 'conectado' })

    rerender({ sessao: encerrada, conexao: 'desconectado' })

    expect(result.current.valores.altitude_msl).toBe(4500)
  })

  it('deve remover o listener e o timer ao desmontar', () => {
    const { unmount } = renderLeituras({ sessao: makeSessao(), conexao: 'conectado' })

    unmount()

    expect(mockRemoveListener).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
})
