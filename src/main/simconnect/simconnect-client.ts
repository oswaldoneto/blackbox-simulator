import {
  open,
  Protocol,
  SimConnectDataType,
  SimConnectPeriod,
  SimConnectConstants,
} from 'node-simconnect'
import type { ConnectionHandle } from 'node-simconnect'
import type { ParametroDeVoo } from '../../shared/types'

const APP_NAME = 'BlackboxSimulator'
const RETRY_INTERVAL_MS = 5_000

/** Mapping from parametroId slug to the SimConnect variable name and unit. */
const SIMVAR_MAP: Record<string, { simVar: string; unit: string }> = {
  altitude_msl: { simVar: 'INDICATED ALTITUDE', unit: 'feet' },
  airspeed_ias: { simVar: 'AIRSPEED INDICATED', unit: 'knots' },
  vertical_speed: { simVar: 'VERTICAL SPEED', unit: 'feet per minute' },
  heading_magnetic: { simVar: 'PLANE HEADING DEGREES MAGNETIC', unit: 'degrees' },
  pitch: { simVar: 'PLANE PITCH DEGREES', unit: 'degrees' },
  bank: { simVar: 'PLANE BANK DEGREES', unit: 'degrees' },
}

/** Definition IDs: index 0 = ENG COMBUSTION, indices 1..N = parameter slugs */
const DEF_ID_ENGINE = 0 as const
const DEF_ID_PARAMS = 1 as const

/** Request IDs */
const REQ_ID_ENGINE = 0 as const
const REQ_ID_PARAMS = 1 as const

export type ParameterReadingPayload = {
  parametroId: string
  valor: number
  timestamp: string
}

type EngineStartedCallback = () => void
type ParameterReadingCallback = (payload: ParameterReadingPayload) => void

export class SimConnectClient {
  private engineStartedCallbacks: EngineStartedCallback[] = []
  private parameterReadingCallbacks: ParameterReadingCallback[] = []
  private parametros: ParametroDeVoo[] = []
  private handle: ConnectionHandle | null = null
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private lastEngineCombustion = false

  onEngineStarted(callback: EngineStartedCallback): void {
    this.engineStartedCallbacks.push(callback)
  }

  onParameterReading(callback: ParameterReadingCallback): void {
    this.parameterReadingCallbacks.push(callback)
  }

  connect(parametros: ParametroDeVoo[]): void {
    this.parametros = parametros
    this.tryConnect()
  }

  close(): void {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
    if (this.handle !== null) {
      try {
        this.handle.close()
      } catch (err) {
        console.error('[SimConnect] Error closing connection:', err)
      }
      this.handle = null
    }
  }

  private tryConnect(): void {
    open(APP_NAME, Protocol.KittyHawk)
      .then(({ handle }) => {
        console.log('[SimConnect] Connected.')
        this.handle = handle

        handle.on('error', (err) => {
          console.error('[SimConnect] Connection error:', err)
          this.handle = null
          this.scheduleRetry()
        })

        handle.on('close', () => {
          console.warn('[SimConnect] Connection closed.')
          this.handle = null
          this.scheduleRetry()
        })

        handle.on('quit', () => {
          console.warn('[SimConnect] Simulator quit.')
          this.handle = null
          this.scheduleRetry()
        })

        this.registerDefinitions(handle)
        this.requestData(handle)

        handle.on('simObjectData', (recvData) => {
          if (recvData.requestID === REQ_ID_ENGINE) {
            const combustion = recvData.data.readInt32() !== 0
            if (combustion && !this.lastEngineCombustion) {
              this.engineStartedCallbacks.forEach((cb) => cb())
            }
            this.lastEngineCombustion = combustion
          }

          if (recvData.requestID === REQ_ID_PARAMS) {
            const timestamp = new Date().toISOString()
            const activeParams = this.parametros.filter((p) => p.ativo)
            for (const param of activeParams) {
              if (SIMVAR_MAP[param.id] !== undefined) {
                const valor = recvData.data.readFloat64()
                this.parameterReadingCallbacks.forEach((cb) =>
                  cb({ parametroId: param.id, valor, timestamp })
                )
              }
            }
          }
        })
      })
      .catch((err: unknown) => {
        console.error('[SimConnect] Could not connect, retrying in 5s:', err)
        this.scheduleRetry()
      })
  }

  private scheduleRetry(): void {
    if (this.retryTimer !== null) return
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      this.tryConnect()
    }, RETRY_INTERVAL_MS)
  }

  private registerDefinitions(handle: ConnectionHandle): void {
    // Definition for engine combustion check
    handle.addToDataDefinition(
      DEF_ID_ENGINE,
      'ENG COMBUSTION:1',
      null,
      SimConnectDataType.INT32
    )

    // Definition for flight parameters (one per active parametro, in order)
    const activeParams = this.parametros.filter((p) => p.ativo)
    for (const param of activeParams) {
      const mapping = SIMVAR_MAP[param.id]
      if (mapping !== undefined) {
        handle.addToDataDefinition(
          DEF_ID_PARAMS,
          mapping.simVar,
          mapping.unit,
          SimConnectDataType.FLOAT64
        )
      }
    }
  }

  private requestData(handle: ConnectionHandle): void {
    handle.requestDataOnSimObject(
      REQ_ID_ENGINE,
      DEF_ID_ENGINE,
      SimConnectConstants.OBJECT_ID_USER,
      SimConnectPeriod.SECOND
    )

    handle.requestDataOnSimObject(
      REQ_ID_PARAMS,
      DEF_ID_PARAMS,
      SimConnectConstants.OBJECT_ID_USER,
      SimConnectPeriod.SECOND
    )
  }
}
