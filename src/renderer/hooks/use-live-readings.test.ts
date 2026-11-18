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
import { JANELA_VAZIA } from '../components/janela-de-leituras'

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
    expect(result.current).toEqual({
      valores: {},
      semDados: false,
      janela: JANELA_VAZIA,
      valoresDescartados: false,
    })
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

  // --- loop-007: janela dos gráficos de linha (UC-002) ---

  describe('janela dos gráficos', () => {
    const BASE = Date.parse('2024-01-01T00:00:00.000Z')

    function pacoteEm(sessaoId: string, segundo: number, altitude: number): PacoteDeLeituras {
      return {
        sessaoId,
        timestamp: new Date(BASE + segundo * 1000).toISOString(),
        leituras: [{ parametroId: 'altitude_msl', valor: altitude }],
      }
    }

    function altitudes(janela: { series: Readonly<Record<string, readonly { v: number }[]>> }): number[] {
      return (janela.series.altitude_msl ?? []).map((p) => p.v)
    }

    it('deve começar vazia ao abrir com a sessão ativa e encher a partir do primeiro pacote (CA-002-17)', () => {
      const { result } = renderLeituras({ sessao: makeSessao(), conexao: 'conectado' })

      expect(result.current.janela).toEqual(JANELA_VAZIA)

      emitir(pacoteEm('sess-1', 1, 4500))
      emitir(pacoteEm('sess-1', 2, 4510))

      expect(altitudes(result.current.janela)).toEqual([4500, 4510])
      expect(result.current.janela.ultimoInstante).toBe(BASE + 2000)
    })

    it('deve acrescentar um ponto a cada pacote da sessão ativa (CA-002-2)', () => {
      const { result } = renderLeituras({ sessao: makeSessao(), conexao: 'conectado' })

      for (let i = 1; i <= 5; i++) {
        emitir(pacoteEm('sess-1', i, 4500 + i))
        avancar(1000)
      }

      expect(altitudes(result.current.janela)).toEqual([4501, 4502, 4503, 4504, 4505])
    })

    it('não deve pôr na janela pacotes de outra sessão', () => {
      const { result } = renderLeituras({ sessao: makeSessao(), conexao: 'conectado' })

      emitir(pacoteEm('sess-1', 1, 4500))
      emitir(pacoteEm('outra-sessao', 2, 9999))

      expect(altitudes(result.current.janela)).toEqual([4500])
    })

    it('deve zerar a janela quando começa uma nova sessão (CA-002-15)', () => {
      const { result, rerender } = renderLeituras({ sessao: makeSessao(), conexao: 'conectado' })
      emitir(pacoteEm('sess-1', 1, 4500))
      emitir(pacoteEm('sess-1', 2, 4510))

      rerender({ sessao: makeSessao({ id: 'sess-2' }), conexao: 'conectado' })
      expect(result.current.janela).toEqual(JANELA_VAZIA)

      emitir(pacoteEm('sess-2', 3, 1200))
      expect(altitudes(result.current.janela)).toEqual([1200])
    })

    it('deve zerar a janela quando a nova sessão começa depois de uma encerrada', () => {
      const sessao = makeSessao()
      const { result, rerender } = renderLeituras({ sessao, conexao: 'conectado' })
      emitir(pacoteEm('sess-1', 1, 4500))
      rerender({ sessao: { ...sessao, status: 'encerrada' }, conexao: 'conectado' })

      rerender({ sessao: makeSessao({ id: 'sess-2' }), conexao: 'conectado' })

      expect(result.current.janela).toEqual(JANELA_VAZIA)
      expect(result.current.valoresDescartados).toBe(false)
    })

    it('deve zerar os valores e manter a janela quando a conexão cai (CA-002-4)', () => {
      const sessao = makeSessao()
      const { result, rerender } = renderLeituras({ sessao, conexao: 'conectado' })
      emitir(pacoteEm('sess-1', 1, 4500))
      emitir(pacoteEm('sess-1', 2, 4510))
      const janelaAntes = result.current.janela

      rerender({ sessao, conexao: 'desconectado' })

      expect(result.current.valores).toEqual({})
      expect(result.current.valoresDescartados).toBe(true)
      expect(result.current.janela).toBe(janelaAntes)
    })

    it('deve continuar a mesma janela na reconexão, com a falha entre as leituras (CA-002-15)', () => {
      const sessao = makeSessao()
      const { result, rerender } = renderLeituras({ sessao, conexao: 'conectado' })
      emitir(pacoteEm('sess-1', 1, 4500))
      emitir(pacoteEm('sess-1', 2, 4510))
      rerender({ sessao, conexao: 'desconectado' })

      rerender({ sessao, conexao: 'conectado' })
      expect(result.current.valoresDescartados).toBe(true)

      emitir(pacoteEm('sess-1', 12, 4600))

      expect(altitudes(result.current.janela)).toEqual([4500, 4510, 4600])
      const instantes = result.current.janela.series.altitude_msl.map((p) => p.t - BASE)
      expect(instantes).toEqual([1000, 2000, 12000])
      expect(result.current.valoresDescartados).toBe(false)
      expect(result.current.valores).toEqual({ altitude_msl: 4600 })
    })

    it('deve manter a janela quando fica sem dados por 2 s com a conexão aberta', () => {
      const { result } = renderLeituras({ sessao: makeSessao(), conexao: 'conectado' })
      emitir(pacoteEm('sess-1', 1, 4500))

      avancar(SEM_DADOS_LIMITE_MS)

      expect(result.current.semDados).toBe(true)
      expect(altitudes(result.current.janela)).toEqual([4500])
      expect(result.current.valoresDescartados).toBe(false)
    })

    it('deve congelar a janela com os pacotes da espera de 15 s quando a sessão encerra (CA-002-4, P3)', () => {
      const sessao = makeSessao()
      const { result, rerender } = renderLeituras({ sessao, conexao: 'conectado' })
      emitir(pacoteEm('sess-1', 1, 4500))
      // Motor desligado: os pacotes da espera de 15 s chegam antes de session:ended.
      for (let s = 2; s <= 16; s++) {
        emitir(pacoteEm('sess-1', s, 4500 - s))
      }

      rerender({ sessao: { ...sessao, status: 'encerrada' }, conexao: 'conectado' })
      const congelada = result.current.janela

      emitir(pacoteEm('sess-1', 17, 9999))
      avancar(5000)

      expect(result.current.janela).toBe(congelada)
      expect(altitudes(congelada)).toHaveLength(16)
      expect(congelada.ultimoInstante).toBe(BASE + 16000)
      expect(result.current.valoresDescartados).toBe(false)
    })

    it('deve marcar os valores descartados quando a sessão encerra com a conexão caída', () => {
      const sessao = makeSessao()
      const { result, rerender } = renderLeituras({ sessao, conexao: 'conectado' })
      emitir(pacoteEm('sess-1', 1, 4500))
      rerender({ sessao, conexao: 'desconectado' })

      rerender({ sessao: { ...sessao, status: 'encerrada' }, conexao: 'desconectado' })

      expect(result.current.valores).toEqual({})
      expect(result.current.valoresDescartados).toBe(true)
      expect(altitudes(result.current.janela)).toEqual([4500])
    })

    it('não deve marcar valores descartados quando a conexão cai com a sessão já encerrada', () => {
      const sessao = makeSessao()
      const encerrada: Sessao = { ...sessao, status: 'encerrada' }
      const { result, rerender } = renderLeituras({ sessao, conexao: 'conectado' })
      emitir(pacoteEm('sess-1', 1, 4500))
      rerender({ sessao: encerrada, conexao: 'conectado' })

      rerender({ sessao: encerrada, conexao: 'desconectado' })

      expect(result.current.valoresDescartados).toBe(false)
      expect(altitudes(result.current.janela)).toEqual([4500])
    })

    it('deve começar vazia ao remontar o hook na mesma sessão (reabertura do app, CA-002-17)', () => {
      const primeira = renderLeituras({ sessao: makeSessao(), conexao: 'conectado' })
      emitir(pacoteEm('sess-1', 1, 4500))
      primeira.unmount()

      const segunda = renderLeituras({ sessao: makeSessao(), conexao: 'conectado' })

      expect(segunda.result.current.janela).toEqual(JANELA_VAZIA)
    })
  })

  it('deve remover o listener e o timer ao desmontar', () => {
    const { unmount } = renderLeituras({ sessao: makeSessao(), conexao: 'conectado' })

    unmount()

    expect(mockRemoveListener).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
})
