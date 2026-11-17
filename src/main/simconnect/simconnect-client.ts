import {
  open,
  Protocol,
  SimConnectDataType,
  SimConnectPeriod,
  SimConnectConstants,
} from 'node-simconnect'
import type { ConnectionHandle } from 'node-simconnect'
import type { EstadoConexao, LeituraDoPacote, ParametroDeVoo } from '../../shared/types'
import { PARAMETER_IDS, isParametroId } from '../../shared/parameter-ids'
import type { ParametroId } from '../../shared/parameter-ids'
import type { PerfilDaAeronave } from './parametros-nao-aplicaveis'

const APP_NAME = 'BlackboxSimulator'
const RETRY_INTERVAL_MS = 5_000

/** Mapping from parametroId slug to the SimConnect variable name and unit. */
const SIMVAR_MAP: Record<ParametroId, { simVar: string; unit: string }> = {
  [PARAMETER_IDS.ALTITUDE_MSL]: { simVar: 'INDICATED ALTITUDE', unit: 'feet' },
  [PARAMETER_IDS.AIRSPEED_IAS]: { simVar: 'AIRSPEED INDICATED', unit: 'knots' },
  [PARAMETER_IDS.VERTICAL_SPEED]: { simVar: 'VERTICAL SPEED', unit: 'feet per minute' },
  [PARAMETER_IDS.HEADING_MAGNETIC]: { simVar: 'PLANE HEADING DEGREES MAGNETIC', unit: 'degrees' },
  [PARAMETER_IDS.PITCH]: { simVar: 'PLANE PITCH DEGREES', unit: 'degrees' },
  [PARAMETER_IDS.BANK]: { simVar: 'PLANE BANK DEGREES', unit: 'degrees' },
  [PARAMETER_IDS.LATITUDE]: { simVar: 'PLANE LATITUDE', unit: 'degrees' },
  [PARAMETER_IDS.LONGITUDE]: { simVar: 'PLANE LONGITUDE', unit: 'degrees' },
  [PARAMETER_IDS.THROTTLE_1]: { simVar: 'GENERAL ENG THROTTLE LEVER POSITION:1', unit: 'percent' },
  [PARAMETER_IDS.MIXTURE_1]: { simVar: 'GENERAL ENG MIXTURE LEVER POSITION:1', unit: 'percent' },
  [PARAMETER_IDS.RPM_1]: { simVar: 'GENERAL ENG RPM:1', unit: 'rpm' },
  [PARAMETER_IDS.FLAPS]: { simVar: 'TRAILING EDGE FLAPS LEFT PERCENT', unit: 'percent' },
}

/** SimVar e unidade do parâmetro, ou `undefined` se o slug não é conhecido. */
function simVarDoParametro(parametroId: string): { simVar: string; unit: string } | undefined {
  return isParametroId(parametroId) ? SIMVAR_MAP[parametroId] : undefined
}

/** Valor de `ENGINE TYPE` para motor a pistão; qualquer outro conta como não pistão. */
const ENGINE_TYPE_PISTAO = 0

/**
 * Definition IDs: DEF_ID_ENGINE = ENG COMBUSTION:1, ENGINE TYPE e FLAPS AVAILABLE
 * (nessa ordem, todos INT32); DEF_ID_PARAMS = um FLOAT64 por parâmetro ativo.
 */
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

export type ParameterBatchPayload = {
  timestamp: string
  leituras: LeituraDoPacote[]
}

type EngineStartedCallback = (perfil: PerfilDaAeronave) => void
type ParameterReadingCallback = (payload: ParameterReadingPayload) => void
type ParameterBatchCallback = (payload: ParameterBatchPayload) => void
type ConnectionChangeCallback = (estado: EstadoConexao) => void

export class SimConnectClient {
  private engineStartedCallbacks: EngineStartedCallback[] = []
  private parameterReadingCallbacks: ParameterReadingCallback[] = []
  private parameterBatchCallbacks: ParameterBatchCallback[] = []
  private connectionChangeCallbacks: ConnectionChangeCallback[] = []
  private estadoConexao: EstadoConexao = 'desconectado'
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

  /** Recebe todas as leituras de um ciclo, uma vez por `simObjectData` de parâmetros. */
  onParameterBatch(callback: ParameterBatchCallback): void {
    this.parameterBatchCallbacks.push(callback)
  }

  /** Recebe o novo estado da conexão, só quando ele muda. */
  onConnectionChange(callback: ConnectionChangeCallback): void {
    this.connectionChangeCallbacks.push(callback)
  }

  getEstadoConexao(): EstadoConexao {
    return this.estadoConexao
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
    this.setEstadoConexao('desconectado')
  }

  private setEstadoConexao(estado: EstadoConexao): void {
    if (estado === this.estadoConexao) return
    this.estadoConexao = estado
    this.connectionChangeCallbacks.forEach((cb) => cb(estado))
  }

  private tryConnect(): void {
    open(APP_NAME, Protocol.KittyHawk)
      .then(({ handle }) => {
        console.log('[SimConnect] Connected.')
        this.handle = handle
        this.setEstadoConexao('conectado')

        handle.on('error', (err) => {
          console.error('[SimConnect] Connection error:', err)
          this.handle = null
          this.setEstadoConexao('desconectado')
          this.scheduleRetry()
        })

        // Uma SimVar inválida na definição gera exception e pode deixar a definição sem dados.
        handle.on('exception', (recvException) => {
          console.error(
            `[SimConnect] Exception ${recvException.exception} (${recvException.exceptionName}),` +
              ` sendId ${recvException.sendId}, index ${recvException.index}`
          )
        })

        handle.on('close', () => {
          console.warn('[SimConnect] Connection closed.')
          this.handle = null
          this.setEstadoConexao('desconectado')
          this.scheduleRetry()
        })

        handle.on('quit', () => {
          console.warn('[SimConnect] Simulator quit.')
          this.handle = null
          this.setEstadoConexao('desconectado')
          this.scheduleRetry()
        })

        this.registerDefinitions(handle)
        this.requestData(handle)

        handle.on('simObjectData', (recvData) => {
          if (recvData.requestID === REQ_ID_ENGINE) {
            const combustion = recvData.data.readInt32() !== 0
            const engineType = recvData.data.readInt32()
            const flapsAvailable = recvData.data.readInt32()
            if (combustion && !this.lastEngineCombustion) {
              const perfil: PerfilDaAeronave = {
                motorAPistao: engineType === ENGINE_TYPE_PISTAO,
                temFlapes: flapsAvailable !== 0,
              }
              this.engineStartedCallbacks.forEach((cb) => cb(perfil))
            }
            this.lastEngineCombustion = combustion
          }

          if (recvData.requestID === REQ_ID_PARAMS) {
            const timestamp = new Date().toISOString()
            const activeParams = this.parametros.filter((p) => p.ativo)
            const leituras: LeituraDoPacote[] = []
            for (const param of activeParams) {
              if (simVarDoParametro(param.id) !== undefined) {
                const valor = recvData.data.readFloat64()
                leituras.push({ parametroId: param.id, valor })
                this.parameterReadingCallbacks.forEach((cb) =>
                  cb({ parametroId: param.id, valor, timestamp })
                )
              }
            }
            this.parameterBatchCallbacks.forEach((cb) => cb({ timestamp, leituras }))
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
    // Engine definition: combustion (start detection) and aircraft profile (N/A)
    handle.addToDataDefinition(
      DEF_ID_ENGINE,
      'ENG COMBUSTION:1',
      null,
      SimConnectDataType.INT32
    )
    handle.addToDataDefinition(DEF_ID_ENGINE, 'ENGINE TYPE', 'Enum', SimConnectDataType.INT32)
    handle.addToDataDefinition(DEF_ID_ENGINE, 'FLAPS AVAILABLE', 'Bool', SimConnectDataType.INT32)

    // Definition for flight parameters (one per active parametro, in order)
    const activeParams = this.parametros.filter((p) => p.ativo)
    for (const param of activeParams) {
      const mapping = simVarDoParametro(param.id)
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
