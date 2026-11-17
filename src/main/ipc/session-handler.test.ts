import { describe, it, expect, vi, beforeEach } from 'vitest'

// ----- mocks (hoisted so vi.mock factories can reference them) -----
const {
  mockIpcMainHandle,
  mockWebContentsSend,
  mockBuscarSessaoAtiva,
  mockListarSessoesEncerradas,
  mockListarLeiturasDoVoo,
} = vi.hoisted(() => ({
  mockIpcMainHandle: vi.fn(),
  mockWebContentsSend: vi.fn(),
  // O handler não pode mais ler o banco (UC-003): o mock existe para provar isso.
  mockBuscarSessaoAtiva: vi.fn(),
  mockListarSessoesEncerradas: vi.fn(),
  mockListarLeiturasDoVoo: vi.fn(),
}))

vi.mock('electron', () => ({
  ipcMain: { handle: mockIpcMainHandle },
  BrowserWindow: {},
}))

vi.mock('../db/session-repository', () => ({
  buscarSessaoAtiva: mockBuscarSessaoAtiva,
  listarSessoesEncerradas: mockListarSessoesEncerradas,
}))

vi.mock('../db/reading-repository', () => ({
  listarLeiturasDoVoo: mockListarLeiturasDoVoo,
}))

import {
  registerSessionHandlers,
  emitSessionStarted,
  emitSessionEnded,
  emitSessionEndFailed,
} from './session-handler'
import type { LeiturasDoVoo, Sessao } from '../../shared/types'
import {
  SESSION_GET_ACTIVE,
  SESSION_LIST_ENDED,
  SESSION_GET_READINGS,
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

/** Handler registrado no canal (a ordem de registro não importa). */
function handlerDoCanal<T>(canal: string): () => T {
  const chamada = mockIpcMainHandle.mock.calls.find((c) => c[0] === canal)
  if (chamada === undefined) {
    throw new Error(`Nenhum handler registrado em ${canal}`)
  }
  return chamada[1] as () => T
}

describe('sessionHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('registerSessionHandlers', () => {
    it('deve registrar handlers nos canais session:get-active, session:list-ended e session:get-readings', () => {
      registerSessionHandlers(() => null)

      expect(mockIpcMainHandle).toHaveBeenCalledTimes(3)
      const canais = mockIpcMainHandle.mock.calls.map((c) => c[0] as string)
      expect(canais).toEqual(
        expect.arrayContaining([SESSION_GET_ACTIVE, SESSION_LIST_ENDED, SESSION_GET_READINGS])
      )
      expect(SESSION_LIST_ENDED).toBe('session:list-ended')
      expect(SESSION_GET_READINGS).toBe('session:get-readings')
    })

    it('deve retornar a sessão ativa da memória do main via canal session:get-active', () => {
      const sessao = makeSessao()
      const getSessaoAtual = vi.fn().mockReturnValue(sessao)

      registerSessionHandlers(getSessaoAtual)

      const handler = handlerDoCanal<Sessao | null>(SESSION_GET_ACTIVE)
      const resultado = handler()

      expect(resultado).toEqual(sessao)
      expect(resultado!.status).toBe('ativa')
      expect(getSessaoAtual).toHaveBeenCalledOnce()
    })

    it('deve retornar null quando não há sessão ativa na memória', () => {
      registerSessionHandlers(() => null)

      const handler = handlerDoCanal<Sessao | null>(SESSION_GET_ACTIVE)
      const resultado = handler()

      expect(resultado).toBeNull()
    })

    it('deve retornar null com sessão ativa gravada em verificação na abertura, sem ler o banco', () => {
      // No banco há uma sessão ativa, mas ela ainda está em verificação (fora da memória).
      mockBuscarSessaoAtiva.mockReturnValue(makeSessao({ id: 'em-verificacao' }))

      registerSessionHandlers(() => null)

      const handler = handlerDoCanal<Sessao | null>(SESSION_GET_ACTIVE)
      expect(handler()).toBeNull()
      expect(mockBuscarSessaoAtiva).not.toHaveBeenCalled()
    })

    it('deve consultar a memória a cada chamada, sem guardar a resposta', () => {
      let atual: Sessao | null = null
      registerSessionHandlers(() => atual)
      const handler = handlerDoCanal<Sessao | null>(SESSION_GET_ACTIVE)

      expect(handler()).toBeNull()
      atual = makeSessao({ id: 'confirmada' })
      expect(handler()!.id).toBe('confirmada')
    })

    it('não deve ler as sessões encerradas ao responder session:get-active', () => {
      registerSessionHandlers(() => null)
      handlerDoCanal<Sessao | null>(SESSION_GET_ACTIVE)()
      expect(mockListarSessoesEncerradas).not.toHaveBeenCalled()
    })
  })

  describe('session:list-ended', () => {
    it('deve responder com a lista de sessões encerradas do repositório', () => {
      const lista = [
        makeSessao({ id: 'b', status: 'encerrada', encerradaEm: '2024-01-02T01:00:00.000Z' }),
        makeSessao({ id: 'a', status: 'encerrada', encerradaEm: '2024-01-01T01:00:00.000Z' }),
      ]
      mockListarSessoesEncerradas.mockReturnValue(lista)
      registerSessionHandlers(() => null)

      const resultado = handlerDoCanal<Sessao[]>(SESSION_LIST_ENDED)()

      expect(resultado).toEqual(lista)
      expect(mockListarSessoesEncerradas).toHaveBeenCalledOnce()
    })

    it('deve responder com lista vazia quando não há sessões encerradas', () => {
      mockListarSessoesEncerradas.mockReturnValue([])
      registerSessionHandlers(() => null)

      expect(handlerDoCanal<Sessao[]>(SESSION_LIST_ENDED)()).toEqual([])
    })

    it('deve logar e relançar o erro quando a leitura do banco falha', () => {
      const falha = new Error('database is locked')
      mockListarSessoesEncerradas.mockImplementation(() => {
        throw falha
      })
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      registerSessionHandlers(() => null)

      expect(() => handlerDoCanal<Sessao[]>(SESSION_LIST_ENDED)()).toThrow(falha)
      expect(consoleError).toHaveBeenCalledWith(
        '[SessionHandler] Falha ao listar as sessões encerradas:',
        falha
      )
      consoleError.mockRestore()
    })

    it('deve ler o banco a cada chamada, sem guardar a resposta', () => {
      registerSessionHandlers(() => null)
      const handler = handlerDoCanal<Sessao[]>(SESSION_LIST_ENDED)
      mockListarSessoesEncerradas.mockReturnValueOnce([])
      expect(handler()).toEqual([])
      mockListarSessoesEncerradas.mockReturnValueOnce([makeSessao({ id: 'nova', status: 'encerrada' })])
      expect(handler().map((x) => x.id)).toEqual(['nova'])
    })
  })

  // --- UC-005 (CA-005-1, CA-005-11): leituras do voo ---

  describe('session:get-readings', () => {
    type HandlerLeituras = (evento: unknown, sessaoId: unknown) => LeiturasDoVoo

    function handlerLeituras(): HandlerLeituras {
      const chamada = mockIpcMainHandle.mock.calls.find((c) => c[0] === SESSION_GET_READINGS)
      if (chamada === undefined) {
        throw new Error('Nenhum handler registrado em session:get-readings')
      }
      return chamada[1] as HandlerLeituras
    }

    const leituras: LeiturasDoVoo = {
      sessaoId: 'voo-1',
      series: [{ parametroId: 'altitude_msl', instantes: [1000, 2000], valores: [500, 510] }],
    }

    beforeEach(() => {
      vi.spyOn(console, 'info').mockImplementation(() => undefined)
    })

    it('deve responder com as leituras do repositório para o sessaoId pedido', () => {
      mockListarLeiturasDoVoo.mockReturnValue(leituras)
      registerSessionHandlers(() => null)

      expect(handlerLeituras()({}, 'voo-1')).toEqual(leituras)
      expect(mockListarLeiturasDoVoo).toHaveBeenCalledWith('voo-1')
    })

    it.each([[undefined], [''], [42], [null], [{ id: 'voo-1' }]])(
      'deve logar e rejeitar sessaoId inválido (%j) sem ler o banco',
      (sessaoId) => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        registerSessionHandlers(() => null)

        expect(() => handlerLeituras()({}, sessaoId)).toThrow()
        expect(mockListarLeiturasDoVoo).not.toHaveBeenCalled()
        expect(consoleError).toHaveBeenCalledWith(
          '[SessionHandler] Falha ao buscar as leituras do voo:',
          expect.any(Error)
        )
        consoleError.mockRestore()
      }
    )

    it('deve logar e relançar o erro quando o repositório falha', () => {
      const falha = new Error('Sessão voo-x não encontrada')
      mockListarLeiturasDoVoo.mockImplementation(() => {
        throw falha
      })
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      registerSessionHandlers(() => null)

      expect(() => handlerLeituras()({}, 'voo-x')).toThrow(falha)
      expect(consoleError).toHaveBeenCalledWith(
        '[SessionHandler] Falha ao buscar as leituras do voo:',
        falha
      )
      consoleError.mockRestore()
    })

    it('deve ler o banco a cada chamada, sem cache (reabrir o voo carrega de novo)', () => {
      mockListarLeiturasDoVoo.mockReturnValue(leituras)
      registerSessionHandlers(() => null)
      const handler = handlerLeituras()

      handler({}, 'voo-1')
      handler({}, 'voo-1')

      expect(mockListarLeiturasDoVoo).toHaveBeenCalledTimes(2)
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
