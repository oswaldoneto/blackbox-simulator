import { describe, it, expect, vi, beforeEach } from 'vitest'

// ----- mocks (hoisted so vi.mock factories can reference them) -----
const { mockIpcMainHandle, mockWebContentsSend, mockBuscarSessaoAtiva } = vi.hoisted(() => ({
  mockIpcMainHandle: vi.fn(),
  mockWebContentsSend: vi.fn(),
  mockBuscarSessaoAtiva: vi.fn(),
}))

vi.mock('electron', () => ({
  ipcMain: { handle: mockIpcMainHandle },
  BrowserWindow: {},
}))

vi.mock('../db/session-repository', () => ({
  buscarSessaoAtiva: mockBuscarSessaoAtiva,
}))

import { registerSessionHandlers, emitSessionStarted, emitSessionEnded } from './session-handler'
import type { Sessao } from '../../shared/types'
import { SESSION_GET_ACTIVE, SESSION_STARTED, SESSION_ENDED } from '../../shared/ipc-channels'

function makeSessao(overrides: Partial<Sessao> = {}): Sessao {
  return {
    id: 'sessao-1',
    iniciadaEm: '2024-01-01T00:00:00.000Z',
    encerradaEm: null,
    aeronave: '',
    aerodromoOrigem: null,
    aerodromoDestino: null,
    status: 'ativa',
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

    it('deve retornar sessão ativa via canal session:get-active', () => {
      const sessao = makeSessao()
      mockBuscarSessaoAtiva.mockReturnValue(sessao)

      registerSessionHandlers(() => null)

      const handler = mockIpcMainHandle.mock.calls[0][1] as () => Sessao | null
      const resultado = handler()

      expect(resultado).toEqual(sessao)
      expect(resultado!.status).toBe('ativa')
    })

    it('deve retornar null quando não há sessão ativa', () => {
      mockBuscarSessaoAtiva.mockReturnValue(null)

      registerSessionHandlers(() => null)

      const handler = mockIpcMainHandle.mock.calls[0][1] as () => Sessao | null
      const resultado = handler()

      expect(resultado).toBeNull()
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
})
