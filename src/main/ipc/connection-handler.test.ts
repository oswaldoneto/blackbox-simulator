import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockIpcMainHandle, mockWebContentsSend } = vi.hoisted(() => ({
  mockIpcMainHandle: vi.fn(),
  mockWebContentsSend: vi.fn(),
}))

vi.mock('electron', () => ({
  ipcMain: { handle: mockIpcMainHandle },
  BrowserWindow: {},
}))

import { registerConnectionHandlers, emitConnectionState } from './connection-handler'
import { CONNECTION_GET_STATE, CONNECTION_STATE_CHANGED } from '../../shared/ipc-channels'
import type { EstadoConexao } from '../../shared/types'

function fakeWindow(destruida: boolean): unknown {
  return { isDestroyed: () => destruida, webContents: { send: mockWebContentsSend } }
}

describe('connectionHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('registerConnectionHandlers', () => {
    it('deve registrar handler no canal connection:get-state', () => {
      registerConnectionHandlers(() => 'desconectado')

      expect(mockIpcMainHandle).toHaveBeenCalledOnce()
      expect(mockIpcMainHandle.mock.calls[0][0]).toBe(CONNECTION_GET_STATE)
    })

    it('deve devolver o estado atual da conexão a cada chamada', () => {
      let estado: EstadoConexao = 'desconectado'
      registerConnectionHandlers(() => estado)
      const handler = mockIpcMainHandle.mock.calls[0][1] as () => EstadoConexao

      expect(handler()).toBe('desconectado')
      estado = 'conectado'
      expect(handler()).toBe('conectado')
    })
  })

  describe('emitConnectionState', () => {
    it('deve enviar o estado no canal connection:state-changed', () => {
      emitConnectionState((() => fakeWindow(false)) as never, 'conectado')

      expect(mockWebContentsSend).toHaveBeenCalledOnce()
      expect(mockWebContentsSend).toHaveBeenCalledWith(CONNECTION_STATE_CHANGED, 'conectado')
    })

    it('não deve enviar quando não há janela', () => {
      emitConnectionState(() => null, 'desconectado')
      expect(mockWebContentsSend).not.toHaveBeenCalled()
    })

    it('não deve enviar quando a janela foi destruída', () => {
      emitConnectionState((() => fakeWindow(true)) as never, 'desconectado')
      expect(mockWebContentsSend).not.toHaveBeenCalled()
    })
  })
})
