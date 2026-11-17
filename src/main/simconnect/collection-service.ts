import { SimConnectClient } from './simconnect-client'
import { criarSessao, buscarSessaoAtiva } from '../db/session-repository'
import { inserirLeitura } from '../db/reading-repository'
import { buscarParametrosAtivos } from '../db/parameter-repository'
import type { EstadoConexao, PacoteDeLeituras, Sessao } from '../../shared/types'

type SessaoCreatedCallback = (sessao: Sessao) => void
type LeiturasCallback = (pacote: PacoteDeLeituras) => void
type ConexaoAlteradaCallback = (estado: EstadoConexao) => void

export class CollectionService {
  private client: SimConnectClient
  private sessaoAtiva: Sessao | null = null
  private sessaoCreatedCallbacks: SessaoCreatedCallback[] = []
  private leiturasCallbacks: LeiturasCallback[] = []
  private conexaoAlteradaCallbacks: ConexaoAlteradaCallback[] = []

  constructor() {
    this.client = new SimConnectClient()
  }

  onSessaoCriada(callback: SessaoCreatedCallback): void {
    this.sessaoCreatedCallbacks.push(callback)
  }

  /** Recebe um pacote por ciclo de coleta, no mesmo ciclo da leitura, só com sessão ativa. */
  onLeituras(callback: LeiturasCallback): void {
    this.leiturasCallbacks.push(callback)
  }

  /** Recebe o novo estado da conexão com o SimConnect quando ele muda. */
  onConexaoAlterada(callback: ConexaoAlteradaCallback): void {
    this.conexaoAlteradaCallbacks.push(callback)
  }

  getEstadoConexao(): EstadoConexao {
    return this.client.getEstadoConexao()
  }

  inicializar(): void {
    const parametros = buscarParametrosAtivos()

    this.client.onEngineStarted(() => {
      this.iniciarSessao()
    })

    this.client.onParameterReading(({ parametroId, valor, timestamp }) => {
      if (this.sessaoAtiva === null) return
      inserirLeitura({
        sessaoId: this.sessaoAtiva.id,
        parametroId,
        timestamp,
        valor,
      })
    })

    this.client.onParameterBatch(({ timestamp, leituras }) => {
      if (this.sessaoAtiva === null) return
      const pacote: PacoteDeLeituras = { sessaoId: this.sessaoAtiva.id, timestamp, leituras }
      this.leiturasCallbacks.forEach((cb) => cb(pacote))
    })

    this.client.onConnectionChange((estado) => {
      this.conexaoAlteradaCallbacks.forEach((cb) => cb(estado))
    })

    this.client.connect(parametros)

    // CA-001-2: se já existe sessão ativa no banco (reinício da app), mantém referência
    const sessaoExistente = buscarSessaoAtiva()
    if (sessaoExistente !== null) {
      this.sessaoAtiva = sessaoExistente
    }
  }

  encerrar(): void {
    this.client.close()
  }

  private iniciarSessao(): void {
    if (this.sessaoAtiva !== null) return

    const novaSessao = criarSessao({
      iniciadaEm: new Date().toISOString(),
      encerradaEm: null,
      aeronave: '',
      aerodromoOrigem: null,
      aerodromoDestino: null,
      status: 'ativa',
    })

    this.sessaoAtiva = novaSessao
    this.sessaoCreatedCallbacks.forEach((cb) => cb(novaSessao))
  }
}
