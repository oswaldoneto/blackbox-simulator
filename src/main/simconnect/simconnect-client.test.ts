import { describe, it, expect, vi, beforeEach } from 'vitest'

// ----- mock node-simconnect -----
const {
  mockOpen,
  mockHandleOn,
  mockHandleClose,
  mockAddToDataDefinition,
  mockRequestDataOnSimObject,
} = vi.hoisted(() => ({
  mockOpen: vi.fn(),
  mockHandleOn: vi.fn(),
  mockHandleClose: vi.fn(),
  mockAddToDataDefinition: vi.fn(),
  mockRequestDataOnSimObject: vi.fn(),
}))

const fakeHandle = {
  on: mockHandleOn,
  close: mockHandleClose,
  addToDataDefinition: mockAddToDataDefinition,
  requestDataOnSimObject: mockRequestDataOnSimObject,
}

vi.mock('node-simconnect', () => ({
  open: mockOpen,
  Protocol: { KittyHawk: 2 },
  SimConnectDataType: { INT32: 0, FLOAT64: 8 },
  SimConnectPeriod: { SECOND: 2 },
  SimConnectConstants: { OBJECT_ID_USER: 1 },
}))

import { SimConnectClient } from './simconnect-client'
import type { ParametroDeVoo } from '../../shared/types'

function makeParametro(overrides: Partial<ParametroDeVoo> = {}): ParametroDeVoo {
  return {
    id: 'altitude_msl',
    nome: 'Altitude MSL',
    unidade: 'ft',
    ativo: true,
    ...overrides,
  }
}

describe('SimConnectClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHandleOn.mockReturnValue(undefined)
    mockOpen.mockResolvedValue({ handle: fakeHandle })
  })

  describe('onEngineStarted / onParameterReading', () => {
    it('deve registrar callback de onEngineStarted sem erro', () => {
      const client = new SimConnectClient()
      const cb = vi.fn()
      expect(() => client.onEngineStarted(cb)).not.toThrow()
    })

    it('deve registrar callback de onParameterReading sem erro', () => {
      const client = new SimConnectClient()
      const cb = vi.fn()
      expect(() => client.onParameterReading(cb)).not.toThrow()
    })
  })

  describe('connect', () => {
    it('deve chamar open ao conectar', async () => {
      const client = new SimConnectClient()
      client.connect([makeParametro()])
      await vi.waitFor(() => expect(mockOpen).toHaveBeenCalledOnce())
    })

    it('deve registrar ouvintes de error/close/quit no handle após conectar', async () => {
      const client = new SimConnectClient()
      client.connect([makeParametro()])
      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

      const registeredEvents = mockHandleOn.mock.calls.map((c) => c[0])
      expect(registeredEvents).toContain('error')
      expect(registeredEvents).toContain('close')
      expect(registeredEvents).toContain('quit')
      expect(registeredEvents).toContain('simObjectData')
    })

    it('deve chamar addToDataDefinition para parâmetros ativos com simvar mapeado', async () => {
      const client = new SimConnectClient()
      client.connect([makeParametro({ id: 'altitude_msl', ativo: true })])
      await vi.waitFor(() => expect(mockAddToDataDefinition).toHaveBeenCalled())
    })

    it('deve agendar retry se open rejeitar', async () => {
      vi.useFakeTimers()
      mockOpen.mockRejectedValueOnce(new Error('connection refused'))
      // second call succeeds
      mockOpen.mockResolvedValueOnce({ handle: fakeHandle })

      const client = new SimConnectClient()
      client.connect([])

      await vi.waitFor(() => expect(mockOpen).toHaveBeenCalledTimes(1))
      await vi.advanceTimersByTimeAsync(5_100)
      expect(mockOpen).toHaveBeenCalledTimes(2)
      vi.useRealTimers()
    })
  })

  describe('close', () => {
    it('deve fechar o handle quando conectado', async () => {
      const client = new SimConnectClient()
      client.connect([makeParametro()])
      // wait for the full .then() chain to complete (handle is set and handle.on registered)
      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

      client.close()
      expect(mockHandleClose).toHaveBeenCalledOnce()
    })

    it('deve não lançar erro se fechar sem conexão ativa', () => {
      const client = new SimConnectClient()
      expect(() => client.close()).not.toThrow()
    })
  })

  describe('simObjectData — engine combustion', () => {
    it('deve disparar callback onEngineStarted na transição false→true de combustão', async () => {
      const engineStartedSpy = vi.fn()
      const client = new SimConnectClient()
      client.onEngineStarted(engineStartedSpy)
      client.connect([makeParametro()])

      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

      // find the simObjectData handler and invoke it with engine-on payload
      const simObjCall = mockHandleOn.mock.calls.find((c) => c[0] === 'simObjectData')
      expect(simObjCall).toBeDefined()
      const simObjectDataHandler = simObjCall![1] as (data: {
        requestID: number
        data: { readInt32: () => number; readFloat64: () => number }
      }) => void

      // First call: combustion = true (transition from initial false)
      simObjectDataHandler({
        requestID: 0,
        data: { readInt32: () => 1, readFloat64: () => 0 },
      })

      expect(engineStartedSpy).toHaveBeenCalledOnce()
    })

    it('não deve disparar onEngineStarted se combustão já era true', async () => {
      const engineStartedSpy = vi.fn()
      const client = new SimConnectClient()
      client.onEngineStarted(engineStartedSpy)
      client.connect([makeParametro()])

      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

      const simObjCall = mockHandleOn.mock.calls.find((c) => c[0] === 'simObjectData')
      const simObjectDataHandler = simObjCall![1] as (data: {
        requestID: number
        data: { readInt32: () => number; readFloat64: () => number }
      }) => void

      // First call: true → fires
      simObjectDataHandler({ requestID: 0, data: { readInt32: () => 1, readFloat64: () => 0 } })
      // Second call: still true → must NOT fire again
      simObjectDataHandler({ requestID: 0, data: { readInt32: () => 1, readFloat64: () => 0 } })

      expect(engineStartedSpy).toHaveBeenCalledTimes(1)
    })

    it('deve emitir onParameterReading para parâmetros ativos com simvar mapeado', async () => {
      const readingSpy = vi.fn()
      const client = new SimConnectClient()
      client.onParameterReading(readingSpy)
      client.connect([makeParametro({ id: 'altitude_msl', ativo: true })])

      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

      const simObjCall = mockHandleOn.mock.calls.find((c) => c[0] === 'simObjectData')
      const simObjectDataHandler = simObjCall![1] as (data: {
        requestID: number
        data: { readInt32: () => number; readFloat64: () => number }
      }) => void

      simObjectDataHandler({ requestID: 1, data: { readInt32: () => 0, readFloat64: () => 3500 } })

      expect(readingSpy).toHaveBeenCalledOnce()
      expect(readingSpy.mock.calls[0][0].parametroId).toBe('altitude_msl')
      expect(readingSpy.mock.calls[0][0].valor).toBe(3500)
    })

    it('não deve emitir onParameterReading para parâmetros inativos', async () => {
      const readingSpy = vi.fn()
      const client = new SimConnectClient()
      client.onParameterReading(readingSpy)
      // inactive parameter
      client.connect([makeParametro({ id: 'altitude_msl', ativo: false })])

      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

      const simObjCall = mockHandleOn.mock.calls.find((c) => c[0] === 'simObjectData')
      const simObjectDataHandler = simObjCall![1] as (data: {
        requestID: number
        data: { readInt32: () => number; readFloat64: () => number }
      }) => void

      simObjectDataHandler({ requestID: 1, data: { readInt32: () => 0, readFloat64: () => 999 } })

      expect(readingSpy).not.toHaveBeenCalled()
    })
  })
})
