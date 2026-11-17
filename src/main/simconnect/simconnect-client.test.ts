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
      // Motor, parâmetros e solo (UC-003).
      await vi.waitFor(() => expect(mockRequestDataOnSimObject).toHaveBeenCalledTimes(3))

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

  // --- UC-006: posição, motor 1 e flapes ---

  describe('UC-006', () => {
    const DOZE_PARAMETROS: ParametroDeVoo[] = [
      ...SEIS_PARAMETROS,
      { id: 'latitude', nome: 'Latitude', unidade: '°', ativo: true },
      { id: 'longitude', nome: 'Longitude', unidade: '°', ativo: true },
      { id: 'throttle_1', nome: 'Manete', unidade: '%', ativo: true },
      { id: 'mixture_1', nome: 'Mistura', unidade: '%', ativo: true },
      { id: 'rpm_1', nome: 'RPM', unidade: 'rpm', ativo: true },
      { id: 'flaps', nome: 'Flapes', unidade: '%', ativo: true },
    ]

    /** Buffer do pacote do motor: combustão, ENGINE TYPE e FLAPS AVAILABLE, nessa ordem. */
    function bufferMotor(combustao: number, engineType: number, flapsAvailable: number) {
      const valores = [combustao, engineType, flapsAvailable]
      let i = 0
      return { readInt32: () => valores[i++], readFloat64: () => 0 }
    }

    function definicoes(defId: number): { simVar: string; unit: string | null; tipo: number }[] {
      return mockAddToDataDefinition.mock.calls
        .filter((c) => c[0] === defId)
        .map((c) => ({ simVar: c[1] as string, unit: c[2] as string | null, tipo: c[3] as number }))
    }

    it('deve registrar as 12 SimVars, uma FLOAT64 por parâmetro ativo, na ordem dos parâmetros', async () => {
      const client = new SimConnectClient()
      client.connect(DOZE_PARAMETROS)
      await vi.waitFor(() => expect(mockRequestDataOnSimObject).toHaveBeenCalled())

      const params = definicoes(1)
      expect(params.map((d) => d.simVar)).toEqual([
        'INDICATED ALTITUDE',
        'AIRSPEED INDICATED',
        'VERTICAL SPEED',
        'PLANE HEADING DEGREES MAGNETIC',
        'PLANE PITCH DEGREES',
        'PLANE BANK DEGREES',
        'PLANE LATITUDE',
        'PLANE LONGITUDE',
        'GENERAL ENG THROTTLE LEVER POSITION:1',
        'GENERAL ENG MIXTURE LEVER POSITION:1',
        'GENERAL ENG RPM:1',
        'TRAILING EDGE FLAPS LEFT PERCENT',
      ])
      params.forEach((d) => expect(d.tipo).toBe(8))
      client.close()
    })

    it('deve usar as unidades graus, percent e rpm nas SimVars novas', async () => {
      const client = new SimConnectClient()
      client.connect(DOZE_PARAMETROS)
      await vi.waitFor(() => expect(mockRequestDataOnSimObject).toHaveBeenCalled())

      const porSimVar = Object.fromEntries(definicoes(1).map((d) => [d.simVar, d.unit]))
      expect(porSimVar['PLANE LATITUDE']).toBe('degrees')
      expect(porSimVar['PLANE LONGITUDE']).toBe('degrees')
      expect(porSimVar['GENERAL ENG THROTTLE LEVER POSITION:1']).toBe('percent')
      expect(porSimVar['GENERAL ENG MIXTURE LEVER POSITION:1']).toBe('percent')
      expect(porSimVar['GENERAL ENG RPM:1']).toBe('rpm')
      expect(porSimVar['TRAILING EDGE FLAPS LEFT PERCENT']).toBe('percent')
      client.close()
    })

    it('deve ler manete, mistura e RPM do motor 1 (sufixo :1) (CA-006-3)', async () => {
      const client = new SimConnectClient()
      client.connect(DOZE_PARAMETROS)
      await vi.waitFor(() => expect(mockRequestDataOnSimObject).toHaveBeenCalled())

      const motor = definicoes(1)
        .map((d) => d.simVar)
        .filter((v) => v.startsWith('GENERAL ENG'))
      expect(motor).toHaveLength(3)
      motor.forEach((v) => expect(v.endsWith(':1')).toBe(true))
      client.close()
    })

    it('deve incluir ENGINE TYPE e FLAPS AVAILABLE na definição do motor, depois da combustão', async () => {
      const client = new SimConnectClient()
      client.connect(DOZE_PARAMETROS)
      await vi.waitFor(() => expect(mockRequestDataOnSimObject).toHaveBeenCalled())

      const motor = definicoes(0)
      expect(motor.map((d) => d.simVar)).toEqual([
        'ENG COMBUSTION:1',
        'ENGINE TYPE',
        'FLAPS AVAILABLE',
      ])
      motor.forEach((d) => expect(d.tipo).toBe(0))
      client.close()
    })

    it('deve entregar lote com os 12 valores brutos, na ordem dos parâmetros (CA-006-1)', async () => {
      const batchSpy = vi.fn()
      const client = new SimConnectClient()
      client.onParameterBatch(batchSpy)
      client.connect(DOZE_PARAMETROS)
      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

      const valores = [4500, 112, 650, 5, -2, 3, -23.5505199, -46.6333094, 85, 100, 2450, 30]
      const handler = getHandleListener('simObjectData') as SimObjectDataHandler
      handler({ requestID: 1, data: fakeBuffer(valores) })

      const lote = batchSpy.mock.calls[0][0] as { leituras: { parametroId: string; valor: number }[] }
      expect(lote.leituras).toEqual(
        DOZE_PARAMETROS.map((p, i) => ({ parametroId: p.id, valor: valores[i] }))
      )
      client.close()
    })

    it.each<[string, number, number, { motorAPistao: boolean; temFlapes: boolean }]>([
      ['pistão com flapes', 0, 1, { motorAPistao: true, temFlapes: true }],
      ['pistão sem flapes', 0, 0, { motorAPistao: true, temFlapes: false }],
      ['jato com flapes', 1, 1, { motorAPistao: false, temFlapes: true }],
      ['turboélice sem flapes', 5, 0, { motorAPistao: false, temFlapes: false }],
    ])(
      'deve entregar o perfil da aeronave (%s) ao avisar motor ligado',
      async (_nome, engineType, flapsAvailable, perfil) => {
        const spy = vi.fn()
        const client = new SimConnectClient()
        client.onEngineStarted(spy)
        client.connect([makeParametro()])
        await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

        const handler = getHandleListener('simObjectData') as SimObjectDataHandler
        handler({ requestID: 0, data: bufferMotor(1, engineType, flapsAvailable) })

        expect(spy).toHaveBeenCalledOnce()
        expect(spy).toHaveBeenCalledWith(perfil)
        client.close()
      }
    )

    it('não deve avisar motor ligado com combustão 0, mesmo lendo o perfil', async () => {
      const spy = vi.fn()
      const client = new SimConnectClient()
      client.onEngineStarted(spy)
      client.connect([makeParametro()])
      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

      const handler = getHandleListener('simObjectData') as SimObjectDataHandler
      handler({ requestID: 0, data: bufferMotor(0, 0, 1) })

      expect(spy).not.toHaveBeenCalled()
      client.close()
    })

    it('deve registrar listener de exception que só loga, sem mudar o estado da conexão', async () => {
      const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
      const spy = vi.fn()
      const client = new SimConnectClient()
      client.onConnectionChange(spy)
      client.connect([makeParametro()])
      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

      getHandleListener('exception')({
        exception: 7,
        exceptionName: 'NAME_UNRECOGNIZED',
        sendId: 3,
        index: 2,
      })

      expect(erro).toHaveBeenCalled()
      expect(String(erro.mock.calls[0][0])).toContain('NAME_UNRECOGNIZED')
      expect(client.getEstadoConexao()).toBe('conectado')
      expect(spy.mock.calls).toEqual([['conectado']])
      erro.mockRestore()
      client.close()
    })

    it('não deve enviar eventos nem dados ao simulador com os 12 parâmetros (RN-006)', async () => {
      const client = new SimConnectClient()
      client.onParameterBatch(vi.fn())
      client.onEngineStarted(vi.fn())
      client.connect(DOZE_PARAMETROS)
      await vi.waitFor(() => expect(mockHandleOn).toHaveBeenCalled())

      const handler = getHandleListener('simObjectData') as SimObjectDataHandler
      handler({ requestID: 0, data: bufferMotor(1, 0, 1) })
      handler({ requestID: 1, data: fakeBuffer([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) })

      expect(mockTransmitClientEvent).not.toHaveBeenCalled()
      expect(mockSetDataOnSimObject).not.toHaveBeenCalled()
      expect(mockMapClientEventToSimEvent).not.toHaveBeenCalled()
      client.close()
    })
  })

  // --- UC-003: amostras do motor e do solo para o encerramento ---

  describe('UC-003', () => {
    const DEF_ID_GROUND = 2
    const REQ_ID_GROUND = 2

    function bufferMotor(combustao: number): { readInt32: () => number; readFloat64: () => number } {
      const valores = [combustao, 0, 1]
      let i = 0
      return { readInt32: () => valores[i++], readFloat64: () => 0 }
    }

    function bufferSolo(noSolo: number): { readInt32: () => number; readFloat64: () => number } {
      return { readInt32: vi.fn(() => noSolo), readFloat64: vi.fn(() => 0) }
    }

    async function conectar(client: SimConnectClient): Promise<SimObjectDataHandler> {
      client.connect(SEIS_PARAMETROS)
      await vi.waitFor(() => expect(mockRequestDataOnSimObject).toHaveBeenCalledTimes(3))
      return getHandleListener('simObjectData') as SimObjectDataHandler
    }

    it('deve registrar SIM ON GROUND numa definição própria, Bool e INT32', async () => {
      const client = new SimConnectClient()
      await conectar(client)

      const solo = mockAddToDataDefinition.mock.calls.filter((c) => c[0] === DEF_ID_GROUND)
      expect(solo).toEqual([[DEF_ID_GROUND, 'SIM ON GROUND', 'Bool', 0]])
      // A SimVar de solo não entra nas definições do motor nem dos parâmetros.
      const outras = mockAddToDataDefinition.mock.calls.filter((c) => c[0] !== DEF_ID_GROUND)
      expect(outras.map((c) => c[1])).not.toContain('SIM ON GROUND')
      client.close()
    })

    it('deve manter a definição do motor inalterada (combustão, ENGINE TYPE, FLAPS AVAILABLE)', async () => {
      const client = new SimConnectClient()
      await conectar(client)

      const motor = mockAddToDataDefinition.mock.calls.filter((c) => c[0] === 0).map((c) => c[1])
      expect(motor).toEqual(['ENG COMBUSTION:1', 'ENGINE TYPE', 'FLAPS AVAILABLE'])
      client.close()
    })

    it('deve pedir o solo ao objeto do usuário a cada 1 s (SimConnectPeriod.SECOND)', async () => {
      const client = new SimConnectClient()
      await conectar(client)

      const pedido = mockRequestDataOnSimObject.mock.calls.find((c) => c[1] === DEF_ID_GROUND)
      expect(pedido).toEqual([REQ_ID_GROUND, DEF_ID_GROUND, 1, 2])
      client.close()
    })

    it.each<[number, boolean]>([
      [1, true],
      [0, false],
    ])('deve entregar onGroundSample com noSolo para SIM ON GROUND = %i', async (valor, noSolo) => {
      const spy = vi.fn()
      const client = new SimConnectClient()
      client.onGroundSample(spy)
      const handler = await conectar(client)

      handler({ requestID: REQ_ID_GROUND, data: bufferSolo(valor) })

      expect(spy).toHaveBeenCalledOnce()
      const amostra = spy.mock.calls[0][0] as { noSolo: boolean; timestamp: string }
      expect(amostra.noSolo).toBe(noSolo)
      expect(Number.isNaN(Date.parse(amostra.timestamp))).toBe(false)
      client.close()
    })

    it('não deve gerar lote, leitura nem amostra do motor com o pacote do solo', async () => {
      const batch = vi.fn()
      const reading = vi.fn()
      const motor = vi.fn()
      const client = new SimConnectClient()
      client.onParameterBatch(batch)
      client.onParameterReading(reading)
      client.onEngineSample(motor)
      const handler = await conectar(client)

      const buffer = bufferSolo(1)
      handler({ requestID: REQ_ID_GROUND, data: buffer })

      expect(batch).not.toHaveBeenCalled()
      expect(reading).not.toHaveBeenCalled()
      expect(motor).not.toHaveBeenCalled()
      expect(buffer.readFloat64).not.toHaveBeenCalled()
      client.close()
    })

    it('não deve gerar amostra do solo com os pacotes do motor e dos parâmetros', async () => {
      const solo = vi.fn()
      const client = new SimConnectClient()
      client.onGroundSample(solo)
      const handler = await conectar(client)

      handler({ requestID: 0, data: bufferMotor(1) })
      handler({ requestID: 1, data: fakeBuffer([1, 2, 3, 4, 5, 6]) })

      expect(solo).not.toHaveBeenCalled()
      client.close()
    })

    it('deve entregar onEngineSample a cada pacote do motor, ligado ou parado', async () => {
      const spy = vi.fn()
      const client = new SimConnectClient()
      client.onEngineSample(spy)
      const handler = await conectar(client)

      handler({ requestID: 0, data: bufferMotor(1) })
      handler({ requestID: 0, data: bufferMotor(1) })
      handler({ requestID: 0, data: bufferMotor(0) })

      expect(spy.mock.calls.map((c) => (c[0] as { combustao: boolean }).combustao)).toEqual([
        true,
        true,
        false,
      ])
      spy.mock.calls.forEach((c) =>
        expect(Number.isNaN(Date.parse((c[0] as { timestamp: string }).timestamp))).toBe(false)
      )
      client.close()
    })

    it('deve entregar onEngineSample depois de onEngineStarted na partida', async () => {
      const ordem: string[] = []
      const client = new SimConnectClient()
      client.onEngineSample(() => ordem.push('amostra'))
      client.onEngineStarted(() => ordem.push('partida'))
      const handler = await conectar(client)

      handler({ requestID: 0, data: bufferMotor(1) })

      expect(ordem).toEqual(['partida', 'amostra'])
      client.close()
    })

    it('deve avisar nova partida quando o motor volta depois de parar', async () => {
      const spy = vi.fn()
      const client = new SimConnectClient()
      client.onEngineStarted(spy)
      const handler = await conectar(client)

      handler({ requestID: 0, data: bufferMotor(1) })
      handler({ requestID: 0, data: bufferMotor(0) })
      handler({ requestID: 0, data: bufferMotor(1) })

      expect(spy).toHaveBeenCalledTimes(2)
      client.close()
    })

    it('não deve enviar eventos nem dados ao simulador com a definição de solo (RN-006)', async () => {
      const client = new SimConnectClient()
      client.onGroundSample(vi.fn())
      client.onEngineSample(vi.fn())
      const handler = await conectar(client)

      handler({ requestID: 0, data: bufferMotor(0) })
      handler({ requestID: REQ_ID_GROUND, data: bufferSolo(1) })

      expect(mockTransmitClientEvent).not.toHaveBeenCalled()
      expect(mockSetDataOnSimObject).not.toHaveBeenCalled()
      expect(mockMapClientEventToSimEvent).not.toHaveBeenCalled()
      client.close()
    })
  })
})
