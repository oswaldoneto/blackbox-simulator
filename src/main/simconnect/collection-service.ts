import { SimConnectClient } from './simconnect-client'
import { criarSessao, buscarSessaoAtiva, encerrarSessao } from '../db/session-repository'
import { inserirLeitura, buscarUltimaLeituraEm } from '../db/reading-repository'
import { buscarParametrosAtivos } from '../db/parameter-repository'
import { derivarParametrosNaoAplicaveis } from './parametros-nao-aplicaveis'
import type { PerfilDaAeronave } from './parametros-nao-aplicaveis'
import {
  ESTADO_INICIAL_DETECTOR,
  avancarDetector,
  zerarContagem,
} from './detector-de-encerramento'
import type { EstadoDetector, EventoDetector } from './detector-de-encerramento'
import type { EstadoConexao, PacoteDeLeituras, Sessao } from '../../shared/types'

/**
 * Prazo, contado da inicialização, para a primeira amostra do motor confirmar ou
 * encerrar a sessão ativa restaurada do banco (decisão do HITL-1 do loop-004).
 */
export const VERIFICACAO_ABERTURA_MS = 15_000

type SessaoCreatedCallback = (sessao: Sessao) => void
type SessaoEncerradaCallback = (sessao: Sessao) => void
type FalhaAoEncerrarCallback = (sessao: Sessao) => void
type LeiturasCallback = (pacote: PacoteDeLeituras) => void
type ConexaoAlteradaCallback = (estado: EstadoConexao) => void

export class CollectionService {
  private client: SimConnectClient
  private sessaoAtiva: Sessao | null = null
  /**
   * Sessão ativa restaurada do banco na abertura, ainda sem confirmação do motor.
   * Enquanto está aqui, não grava leitura, não gera pacote e não é a sessão atual.
   */
  private sessaoEmVerificacao: Sessao | null = null
  private timerVerificacao: ReturnType<typeof setTimeout> | null = null
  private detector: EstadoDetector = ESTADO_INICIAL_DETECTOR
  private sessaoCreatedCallbacks: SessaoCreatedCallback[] = []
  private sessaoEncerradaCallbacks: SessaoEncerradaCallback[] = []
  private falhaAoEncerrarCallbacks: FalhaAoEncerrarCallback[] = []
  private leiturasCallbacks: LeiturasCallback[] = []
  private conexaoAlteradaCallbacks: ConexaoAlteradaCallback[] = []

  constructor() {
    this.client = new SimConnectClient()
  }

  /** Sessão iniciada pelo motor ou sessão restaurada confirmada na abertura. */
  onSessaoCriada(callback: SessaoCreatedCallback): void {
    this.sessaoCreatedCallbacks.push(callback)
  }

  /** Sessão encerrada pelo detector, emitida só depois de gravado o encerramento. */
  onSessaoEncerrada(callback: SessaoEncerradaCallback): void {
    this.sessaoEncerradaCallbacks.push(callback)
  }

  /**
   * Falha ao gravar o encerramento. Recebe a sessão como estava na memória (no banco
   * ela continua ativa e é encerrada na próxima abertura).
   */
  onFalhaAoEncerrar(callback: FalhaAoEncerrarCallback): void {
    this.falhaAoEncerrarCallbacks.push(callback)
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

  /** Sessão ativa na memória; `null` sem sessão ou com a sessão restaurada em verificação. */
  getSessaoAtual(): Sessao | null {
    return this.sessaoAtiva
  }

  inicializar(): void {
    const parametros = buscarParametrosAtivos()

    this.client.onEngineStarted((perfil) => {
      if (this.sessaoEmVerificacao !== null) {
        this.confirmarSessaoRestaurada()
        return
      }
      this.iniciarSessao(perfil)
    })

    this.client.onEngineSample(({ combustao, timestamp }) => {
      if (this.sessaoEmVerificacao !== null) {
        if (combustao) {
          this.confirmarSessaoRestaurada()
        } else {
          this.encerrarSessaoRestaurada()
        }
      }
      this.avancar({ tipo: 'motor', combustao, timestamp })
    })

    this.client.onGroundSample(({ noSolo, timestamp }) => {
      this.avancar({ tipo: 'solo', noSolo, timestamp })
    })

    // Parâmetros N/A da sessão não geram leitura nem entram no pacote (RN-007).
    this.client.onParameterReading(({ parametroId, valor, timestamp }) => {
      if (this.sessaoAtiva === null) return
      if (this.naoAplicavel(parametroId)) return
      inserirLeitura({
        sessaoId: this.sessaoAtiva.id,
        parametroId,
        timestamp,
        valor,
      })
    })

    this.client.onParameterBatch(({ timestamp, leituras }) => {
      if (this.sessaoAtiva === null) return
      const pacote: PacoteDeLeituras = {
        sessaoId: this.sessaoAtiva.id,
        timestamp,
        leituras: leituras.filter((leitura) => !this.naoAplicavel(leitura.parametroId)),
      }
      this.leiturasCallbacks.forEach((cb) => cb(pacote))
    })

    this.client.onConnectionChange((estado) => {
      // A queda de conexão não encerra a sessão; o detector mantém a contagem.
      if (estado === 'desconectado') {
        this.avancar({ tipo: 'conexao-perdida' })
      }
      this.conexaoAlteradaCallbacks.forEach((cb) => cb(estado))
    })

    this.client.connect(parametros)

    // Sessão ativa gravada (app fechado ou reiniciado com sessão ativa): fica em
    // verificação até a primeira amostra do motor. Motor ligado confirma a sessão, com a
    // lista de parâmetros N/A gravada na criação dela (CA-001-2); motor parado ou falta de
    // amostra no prazo encerra a sessão com a hora da última leitura (UC-003).
    const sessaoExistente = buscarSessaoAtiva()
    if (sessaoExistente !== null) {
      this.sessaoEmVerificacao = sessaoExistente
      this.timerVerificacao = setTimeout(() => {
        this.timerVerificacao = null
        if (this.sessaoEmVerificacao !== null) {
          console.warn(
            `[CollectionService] Sem dado do motor em ${VERIFICACAO_ABERTURA_MS} ms;` +
              ` encerrando a sessão restaurada ${this.sessaoEmVerificacao.id}`
          )
          this.encerrarSessaoRestaurada()
        }
      }, VERIFICACAO_ABERTURA_MS)
    }
  }

  /** Fecha a conexão com o SimConnect. Não encerra a sessão ativa. */
  fecharConexao(): void {
    this.limparTimerVerificacao()
    this.client.close()
  }

  private naoAplicavel(parametroId: string): boolean {
    if (this.sessaoAtiva === null) return false
    return (this.sessaoAtiva.parametrosNaoAplicaveis as readonly string[]).includes(parametroId)
  }

  /** Passa o evento ao detector e encerra a sessão ativa quando ele indicar. */
  private avancar(evento: EventoDetector): void {
    const resultado = avancarDetector(this.detector, evento)
    this.detector = resultado.estado
    if (resultado.encerradaEm !== null && this.sessaoAtiva !== null) {
      this.encerrarSessaoAtiva(resultado.encerradaEm)
    }
  }

  /** Cria a sessão com a lista de N/A decidida pelo perfil da aeronave, válida a sessão toda. */
  private iniciarSessao(perfil: PerfilDaAeronave): void {
    if (this.sessaoAtiva !== null) return

    const novaSessao = criarSessao({
      iniciadaEm: new Date().toISOString(),
      encerradaEm: null,
      aeronave: '',
      aerodromoOrigem: null,
      aerodromoDestino: null,
      status: 'ativa',
      parametrosNaoAplicaveis: derivarParametrosNaoAplicaveis(perfil),
    })

    this.sessaoAtiva = novaSessao
    this.detector = zerarContagem(this.detector)
    this.sessaoCreatedCallbacks.forEach((cb) => cb(novaSessao))
  }

  /**
   * Grava o encerramento da sessão ativa. A sessão sai da memória nos dois casos, para
   * que nenhuma leitura seja gravada depois e o religamento abra uma sessão nova (RN-003).
   * Sucesso emite `onSessaoEncerrada`; falha loga e emite `onFalhaAoEncerrar`.
   */
  private encerrarSessaoAtiva(encerradaEm: string): void {
    const sessao = this.sessaoAtiva
    if (sessao === null) return
    this.sessaoAtiva = null
    this.detector = zerarContagem(this.detector)

    let encerrada: Sessao
    try {
      encerrada = encerrarSessao(sessao.id, encerradaEm)
    } catch (err) {
      console.error(`[CollectionService] Falha ao gravar o encerramento da sessão ${sessao.id}:`, err)
      this.falhaAoEncerrarCallbacks.forEach((cb) => cb(sessao))
      return
    }
    this.sessaoEncerradaCallbacks.forEach((cb) => cb(encerrada))
  }

  /** Motor ligado na abertura: a sessão restaurada volta a ser a sessão ativa. */
  private confirmarSessaoRestaurada(): void {
    const sessao = this.sessaoEmVerificacao
    if (sessao === null) return
    this.sessaoEmVerificacao = null
    this.limparTimerVerificacao()

    this.sessaoAtiva = sessao
    this.detector = zerarContagem(this.detector)
    this.sessaoCreatedCallbacks.forEach((cb) => cb(sessao))
  }

  /**
   * Motor parado na abertura, ou sem dado do motor no prazo: encerra a sessão restaurada
   * com a hora da última leitura (ou a de início, sem leitura). Silencioso: não emite
   * evento ao renderer, nem em caso de falha (só log; a próxima abertura tenta de novo).
   */
  private encerrarSessaoRestaurada(): void {
    const sessao = this.sessaoEmVerificacao
    if (sessao === null) return
    this.sessaoEmVerificacao = null
    this.limparTimerVerificacao()

    try {
      const encerradaEm = buscarUltimaLeituraEm(sessao.id) ?? sessao.iniciadaEm
      encerrarSessao(sessao.id, encerradaEm)
    } catch (err) {
      console.error(
        `[CollectionService] Falha ao gravar o encerramento da sessão restaurada ${sessao.id}:`,
        err
      )
    }
  }

  private limparTimerVerificacao(): void {
    if (this.timerVerificacao !== null) {
      clearTimeout(this.timerVerificacao)
      this.timerVerificacao = null
    }
  }
}
