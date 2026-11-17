import { describe, it, expect, vi, beforeEach } from 'vitest'

// ----- mocks (hoisted so vi.mock factories can reference them) -----
const { mockIpcMainHandle, mockWebContentsSend, mockBuscarSessaoAtiva } = vi.hoisted(() => ({
  mockIpcMainHandle: vi.fn(),
  mockWebContentsSend: vi.fn(),
  // O handler não pode mais ler o banco (UC-003): o mock existe para provar isso.
  mockBuscarSessaoAtiva: vi.fn(),
}))

vi.mock('electron', () => ({
  ipcMain: { handle: mockIpcMainHandle },
  BrowserWindow: {},
}))

vi.mock('../db/session-repository', () => ({
  buscarSessaoAtiva: mockBuscarSessaoAtiva,
}))

import {
  registerSessionHandlers,
  emitSessionStarted,
  emitSessionEnded,
  emitSessionEndFailed,
} from './session-handler'
import type { Sessao } from '../../shared/types'
import {
  SESSION_GET_ACTIVE,
  SESSION_STARTED,
  SESSION_ENDED,
  SESSION_END_FAILED,
} from '../../shared/ipc-channels'

function makeSessao(overrides: Partial<Sessao> = {}): Sessao {
  return {
    id: 'sessao-1',
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

describe('sessionHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('registerSessionHandlers', () => {
    it('deve registrar handler no canal session:get-active', () => {
      registerSessionHandlers(() => null)

      expect(mockIpcMainHandle).toHaveBeenCalledOnce()
      const channel = mockIpcMainHandle.mock.calls[0][0] as string
      expect(channel).toBe(SESSION_GET_ACTIVE)
    })

    it('deve retornar a sessão ativa da memória do main via canal session:get-active', () => {
      const sessao = makeSessao()
      const getSessaoAtual = vi.fn().mockReturnValue(sessao)

      registerSessionHandlers(getSessaoAtual)

      const handler = mockIpcMainHandle.mock.calls[0][1] as () => Sessao | null
      const resultado = handler()

      expect(resultado).toEqual(sessao)
      expect(resultado!.status).toBe('ativa')
      expect(getSessaoAtual).toHaveBeenCalledOnce()
    })

    it('deve retornar null quando não há sessão ativa na memória', () => {
      registerSessionHandlers(() => null)

      const handler = mockIpcMainHandle.mock.calls[0][1] as () => Sessao | null
      const resultado = handler()

      expect(resultado).toBeNull()
    })

    it('deve retornar null com sessão ativa gravada em verificação na abertura, sem ler o banco', () => {
      // No banco há uma sessão ativa, mas ela ainda está em verificação (fora da memória).
      mockBuscarSessaoAtiva.mockReturnValue(makeSessao({ id: 'em-verificacao' }))

      registerSessionHandlers(() => null)

      const handler = mockIpcMainHandle.mock.calls[0][1] as () => Sessao | null
      expect(handler()).toBeNull()
      expect(mockBuscarSessaoAtiva).not.toHaveBeenCalled()
    })

    it('deve consultar a memória a cada chamada, sem guardar a resposta', () => {
      let atual: Sessao | null = null
      registerSessionHandlers(() => atual)
      const handler = mockIpcMainHandle.mock.calls[0][1] as () => Sessao | null

      expect(handler()).toBeNull()
      atual = makeSessao({ id: 'confirmada' })
      expect(handler()!.id).toBe('confirmada')
    })
  })

  describe('emitSessionStarted', () => {
    it('deve emitir session:started ao renderer quando sessão é criada', () => {
      const sessao = makeSessao({ id: 'nova-sessao' })
      const fakeWin = { isDestroyed: () => false, webContents: { send: mockWebContentsSend } }
      const getWindow = vi.fn().mockReturnValue(fakeWin)

      emitSessionStarted(getWindow as never, sessao)

      expect(mockWebContentsSend).toHaveBeenCalledOnce()
      const [channel, payload] = mockWebContentsSend.mock.calls[0] as [string, Sessao]
      expect(channel).toBe(SESSION_STARTED)
      expect(payload.id).toBe('nova-sessao')
      expect(payload.status).toBe('ativa')
    })

    it('não deve emitir session:started quando não há janela', () => {
      emitSessionStarted(() => null, makeSessao())
      expect(mockWebContentsSend).not.toHaveBeenCalled()
    })

    it('não deve emitir session:started quando a janela foi destruída', () => {
      const fakeWin = { isDestroyed: () => true, webContents: { send: mockWebContentsSend } }
      emitSessionStarted((() => fakeWin) as never, makeSessao())
      expect(mockWebContentsSend).not.toHaveBeenCalled()
    })
  })

  describe('emitSessionEnded', () => {
    it('deve emitir session:ended ao renderer quando sessão é encerrada', () => {
      const sessao = makeSessao({ id: 'sessao-encerrada', status: 'encerrada', encerradaEm: '2024-01-01T01:00:00.000Z' })
      const fakeWin = { isDestroyed: () => false, webContents: { send: mockWebContentsSend } }
      const getWindow = vi.fn().mockReturnValue(fakeWin)

      emitSessionEnded(getWindow as never, sessao)

      expect(mockWebContentsSend).toHaveBeenCalledOnce()
      const [channel, payload] = mockWebContentsSend.mock.calls[0] as [string, Sessao]
      expect(channel).toBe(SESSION_ENDED)
      expect(payload.id).toBe('sessao-encerrada')
      expect(payload.status).toBe('encerrada')
    })

    it('não deve emitir session:ended quando não há janela', () => {
      emitSessionEnded(() => null, makeSessao())
      expect(mockWebContentsSend).not.toHaveBeenCalled()
    })

    it('não deve emitir session:ended quando a janela foi destruída', () => {
      const fakeWin = { isDestroyed: () => true, webContents: { send: mockWebContentsSend } }
      emitSessionEnded((() => fakeWin) as never, makeSessao())
      expect(mockWebContentsSend).not.toHaveBeenCalled()
    })
  })

  describe('emitSessionEndFailed', () => {
    it('deve emitir session:end-failed com a sessão como estava na memória', () => {
      const sessao = makeSessao({ id: 'sessao-falha' })
      const fakeWin = { isDestroyed: () => false, webContents: { send: mockWebContentsSend } }

      emitSessionEndFailed((() => fakeWin) as never, sessao)

      expect(mockWebContentsSend).toHaveBeenCalledOnce()
      const [channel, payload] = mockWebContentsSend.mock.calls[0] as [string, Sessao]
      expect(channel).toBe(SESSION_END_FAILED)
      expect(channel).toBe('session:end-failed')
      expect(payload).toEqual(sessao)
    })

    it('não deve emitir session:end-failed quando não há janela', () => {
      emitSessionEndFailed(() => null, makeSessao())
      expect(mockWebContentsSend).not.toHaveBeenCalled()
    })

    it('não deve emitir session:end-failed quando a janela foi destruída', () => {
      const fakeWin = { isDestroyed: () => true, webContents: { send: mockWebContentsSend } }
      emitSessionEndFailed((() => fakeWin) as never, makeSessao())
      expect(mockWebContentsSend).not.toHaveBeenCalled()
    })
  })
})
