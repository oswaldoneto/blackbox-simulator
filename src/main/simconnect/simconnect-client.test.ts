import { describe, it, expect, vi, beforeEach } from 'vitest'

// ----- mock node-simconnect -----
const {
  mockOpen,
  mockHandleOn,
  mockHandleClose,
  mockAddToDataDefinition,
  mockRequestDataOnSimObject,
  mockTransmitClientEvent,
  mockSetDataOnSimObject,
  mockMapClientEventToSimEvent,
} = vi.hoisted(() => ({
  mockTransmitClientEvent: vi.fn(),
  mockSetDataOnSimObject: vi.fn(),
  mockMapClientEventToSimEvent: vi.fn(),
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
  // Métodos que enviariam algo ao simulador: não podem ser chamados (RN-006).
  transmitClientEvent: mockTransmitClientEvent,
  setDataOnSimObject: mockSetDataOnSimObject,
  mapClientEventToSimEvent: mockMapClientEventToSimEvent,
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

type SimObjectDataHandler = (data: {
  requestID: number
  data: { readInt32: () => number; readFloat64: () => number }
}) => void

function getHandleListener(evento: string): (...args: unknown[]) => void {
  const call = mockHandleOn.mock.calls.find((c) => c[0] === evento)
  if (call === undefined) throw new Error(`listener ${evento} não registrado`)
  return call[1] as (...args: unknown[]) => void
}

/** Lê valores em sequência, como o buffer do SimConnect. */
function fakeBuffer(valores: number[]): { readInt32: () => number; readFloat64: () => number } {
  let i = 0
  return {
    readInt32: () => 0,
    readFloat64: vi.fn(() => valores[i++]),
  }
}

const SEIS_PARAMETROS: ParametroDeVoo[] = [
  { id: 'altitude_msl', nome: 'Altitude MSL', unidade: 'ft', ativo: true },
  { id: 'airspeed_ias', nome: 'Velocidade IAS', unidade: 'kt', ativo: true },
  { id: 'vertical_speed', nome: 'Velocidade vertical', unidade: 'fpm', ativo: true },
  { id: 'heading_magnetic', nome: 'Rumo magnético', unidade: '°', ativo: true },
  { id: 'pitch', nome: 'Arfagem', unidade: '°', ativo: true },
  { id: 'bank', nome: 'Rolagem', unidade: '°', ativo: true },
]

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

    it('não deve lançar erro e deve ficar desconectado se handle.close falhar', async () => {
      const spy = vi.fn()
      const client = new SimConnectClient()
      client.onConnectionChange(spy)
      client.connect([makeParametro()])
      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())
      mockHandleClose.mockImplementationOnce(() => {
        throw new Error('falha ao fechar')
      })

      expect(() => client.close()).not.toThrow()
      expect(client.getEstadoConexao()).toBe('desconectado')
      expect(spy).toHaveBeenLastCalledWith('desconectado')
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

  // --- UC-002: estado de conexão ---

  describe('onConnectionChange / getEstadoConexao', () => {
    it('deve começar desconectado', () => {
      const client = new SimConnectClient()
      expect(client.getEstadoConexao()).toBe('desconectado')
    })

    it('deve emitir "conectado" uma vez ao abrir a conexão', async () => {
      const spy = vi.fn()
      const client = new SimConnectClient()
      client.onConnectionChange(spy)
      client.connect([makeParametro()])

      await vi.waitFor(() => expect(spy).toHaveBeenCalled())
      expect(spy.mock.calls).toEqual([['conectado']])
      expect(client.getEstadoConexao()).toBe('conectado')
      client.close()
    })

    it.each(['close', 'quit', 'error'])(
      'deve emitir "desconectado" quando o handle dispara %s',
      async (evento) => {
        const spy = vi.fn()
        const client = new SimConnectClient()
        client.onConnectionChange(spy)
        client.connect([makeParametro()])
        await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

        getHandleListener(evento)(new Error('x'))

        expect(spy.mock.calls).toEqual([['conectado'], ['desconectado']])
        expect(client.getEstadoConexao()).toBe('desconectado')
        client.close()
      }
    )

    it('deve emitir só nas transições, sem repetir o mesmo estado', async () => {
      const spy = vi.fn()
      const client = new SimConnectClient()
      client.onConnectionChange(spy)
      client.connect([makeParametro()])
      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

      getHandleListener('close')()
      getHandleListener('quit')()
      client.close()

      expect(spy.mock.calls).toEqual([['conectado'], ['desconectado']])
    })

    it('não deve emitir nada ao fechar sem ter conectado', () => {
      const spy = vi.fn()
      const client = new SimConnectClient()
      client.onConnectionChange(spy)
      client.close()
      expect(spy).not.toHaveBeenCalled()
    })

    it('deve emitir "desconectado" ao chamar close() quando conectado', async () => {
      const spy = vi.fn()
      const client = new SimConnectClient()
      client.onConnectionChange(spy)
      client.connect([makeParametro()])
      await vi.waitFor(() => expect(spy).toHaveBeenCalledWith('conectado'))

      client.close()

      expect(spy).toHaveBeenLastCalledWith('desconectado')
    })
  })

  // --- UC-002 CA-002-2: lote de leituras por ciclo ---

  describe('onParameterBatch', () => {
    it('deve emitir um único lote por simObjectData com as leituras de todos os parâmetros ativos', async () => {
      const batchSpy = vi.fn()
      const client = new SimConnectClient()
      client.onParameterBatch(batchSpy)
      client.connect(SEIS_PARAMETROS)
      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

      const handler = getHandleListener('simObjectData') as SimObjectDataHandler
      handler({ requestID: 1, data: fakeBuffer([4500, 112, 650, 5, -5.2, 12.3]) })

      expect(batchSpy).toHaveBeenCalledOnce()
      const lote = batchSpy.mock.calls[0][0] as {
        timestamp: string
        leituras: { parametroId: string; valor: number }[]
      }
      expect(lote.leituras).toEqual([
        { parametroId: 'altitude_msl', valor: 4500 },
        { parametroId: 'airspeed_ias', valor: 112 },
        { parametroId: 'vertical_speed', valor: 650 },
        { parametroId: 'heading_magnetic', valor: 5 },
        { parametroId: 'pitch', valor: -5.2 },
        { parametroId: 'bank', valor: 12.3 },
      ])
      expect(Number.isNaN(Date.parse(lote.timestamp))).toBe(false)
      client.close()
    })

    it('deve usar o mesmo timestamp no lote e nas leituras individuais do ciclo', async () => {
      const batchSpy = vi.fn()
      const readingSpy = vi.fn()
      const client = new SimConnectClient()
      client.onParameterBatch(batchSpy)
      client.onParameterReading(readingSpy)
      client.connect(SEIS_PARAMETROS.slice(0, 2))
      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

      const handler = getHandleListener('simObjectData') as SimObjectDataHandler
      handler({ requestID: 1, data: fakeBuffer([100, 90]) })

      expect(readingSpy).toHaveBeenCalledTimes(2)
      const ts = batchSpy.mock.calls[0][0].timestamp
      readingSpy.mock.calls.forEach((c) => expect(c[0].timestamp).toBe(ts))
      client.close()
    })

    it('deve deixar fora do lote parâmetros inativos e sem simvar mapeado', async () => {
      const batchSpy = vi.fn()
      const client = new SimConnectClient()
      client.onParameterBatch(batchSpy)
      client.connect([
        makeParametro({ id: 'altitude_msl', ativo: true }),
        makeParametro({ id: 'airspeed_ias', ativo: false }),
        makeParametro({ id: 'desconhecido', ativo: true }),
      ])
      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

      const buffer = fakeBuffer([3000])
      const handler = getHandleListener('simObjectData') as SimObjectDataHandler
      handler({ requestID: 1, data: buffer })

      expect(batchSpy.mock.calls[0][0].leituras).toEqual([
        { parametroId: 'altitude_msl', valor: 3000 },
      ])
      expect(buffer.readFloat64).toHaveBeenCalledTimes(1)
      client.close()
    })

    it('não deve emitir lote para o pacote de combustão do motor', async () => {
      const batchSpy = vi.fn()
      const client = new SimConnectClient()
      client.onParameterBatch(batchSpy)
      client.connect([makeParametro()])
      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

      const handler = getHandleListener('simObjectData') as SimObjectDataHandler
      handler({ requestID: 0, data: { readInt32: () => 1, readFloat64: () => 0 } })

      expect(batchSpy).not.toHaveBeenCalled()
      client.close()
    })

    it('deve pedir os dados com período de 1 s (SimConnectPeriod.SECOND)', async () => {
      const client = new SimConnectClient()
      client.connect([makeParametro()])
      await vi.waitFor(() => expect(mockRequestDataOnSimObject).toHaveBeenCalledTimes(2))

      mockRequestDataOnSimObject.mock.calls.forEach((c) => expect(c[3]).toBe(2))
      client.close()
    })
  })

  // --- RN-006: não interferência ---

  describe('RN-006', () => {
    it('não deve enviar eventos nem dados ao simulador ao conectar e receber leituras', async () => {
      const client = new SimConnectClient()
      client.onParameterBatch(vi.fn())
      client.onEngineStarted(vi.fn())
      client.connect(SEIS_PARAMETROS)
      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

      const handler = getHandleListener('simObjectData') as SimObjectDataHandler
      handler({ requestID: 0, data: { readInt32: () => 1, readFloat64: () => 0 } })
      handler({ requestID: 1, data: fakeBuffer([1, 2, 3, 4, 5, 6]) })

      expect(mockTransmitClientEvent).not.toHaveBeenCalled()
      expect(mockSetDataOnSimObject).not.toHaveBeenCalled()
      expect(mockMapClientEventToSimEvent).not.toHaveBeenCalled()
      client.close()
    })
  })
})
