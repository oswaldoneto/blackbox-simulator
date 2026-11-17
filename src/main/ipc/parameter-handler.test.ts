import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockIpcMainHandle, mockWebContentsSend, mockBuscarParametrosAtivos } = vi.hoisted(() => ({
  mockIpcMainHandle: vi.fn(),
  mockWebContentsSend: vi.fn(),
  mockBuscarParametrosAtivos: vi.fn(),
}))

vi.mock('electron', () => ({
  ipcMain: { handle: mockIpcMainHandle },
  BrowserWindow: {},
}))

vi.mock('../db/parameter-repository', () => ({
  buscarParametrosAtivos: mockBuscarParametrosAtivos,
}))

import { registerParameterHandlers, emitParameterReadings } from './parameter-handler'
import { PARAMETER_LIST_ACTIVE, PARAMETER_READINGS } from '../../shared/ipc-channels'
import type { PacoteDeLeituras, ParametroDeVoo } from '../../shared/types'

function makePacote(): PacoteDeLeituras {
  return {
    sessaoId: 'sessao-1',
    timestamp: '2024-01-01T00:00:01.000Z',
    leituras: [{ parametroId: 'altitude_msl', valor: 4500 }],
  }
}

function fakeWindow(destruida: boolean): unknown {
  return { isDestroyed: () => destruida, webContents: { send: mockWebContentsSend } }
}

describe('parameterHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('registerParameterHandlers', () => {
    it('deve registrar handler no canal parameter:list-active', () => {
      registerParameterHandlers()

      expect(mockIpcMainHandle).toHaveBeenCalledOnce()
      expect(mockIpcMainHandle.mock.calls[0][0]).toBe(PARAMETER_LIST_ACTIVE)
    })

    it('deve devolver os parâmetros ativos do repositório (RN-002)', () => {
      const ativos: ParametroDeVoo[] = [
        { id: 'altitude_msl', nome: 'Altitude MSL', unidade: 'ft', ativo: true },
        { id: 'pitch', nome: 'Arfagem', unidade: '°', ativo: true },
      ]
      mockBuscarParametrosAtivos.mockReturnValue(ativos)

      registerParameterHandlers()
      const handler = mockIpcMainHandle.mock.calls[0][1] as () => ParametroDeVoo[]
      const resultado = handler()

      expect(mockBuscarParametrosAtivos).toHaveBeenCalledOnce()
      expect(resultado).toEqual(ativos)
      expect(resultado.every((p) => p.ativo)).toBe(true)
    })
  })

  describe('emitParameterReadings', () => {
    it('deve enviar o pacote no canal parameter:readings', () => {
      const pacote = makePacote()
      emitParameterReadings((() => fakeWindow(false)) as never, pacote)

      expect(mockWebContentsSend).toHaveBeenCalledOnce()
      expect(mockWebContentsSend).toHaveBeenCalledWith(PARAMETER_READINGS, pacote)
    })

    it('não deve enviar quando não há janela', () => {
      emitParameterReadings(() => null, makePacote())
      expect(mockWebContentsSend).not.toHaveBeenCalled()
    })

    it('não deve enviar quando a janela foi destruída', () => {
      emitParameterReadings((() => fakeWindow(true)) as never, makePacote())
      expect(mockWebContentsSend).not.toHaveBeenCalled()
    })
  })
})
