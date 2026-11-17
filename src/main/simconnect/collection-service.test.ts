import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest'

// ----- mocks (hoisted so vi.mock factories can reference them) -----
type ReadingPayload = { parametroId: string; valor: number; timestamp: string }
type BatchPayload = { timestamp: string; leituras: { parametroId: string; valor: number }[] }
type EstadoConexaoMock = 'conectado' | 'desconectado'
type AmostraMotor = { combustao: boolean; timestamp: string }
type AmostraSolo = { noSolo: boolean; timestamp: string }

const {
  mockCriarSessao,
  mockBuscarSessaoAtiva,
  mockEncerrarSessao,
  mockInserirLeitura,
  mockBuscarUltimaLeituraEm,
  mockBuscarParametrosAtivos,
  mockClientConnect,
  mockClientClose,
  mockClientOnEngineStarted,
  mockClientOnEngineSample,
  mockClientOnGroundSample,
  mockClientOnParameterReading,
  mockClientOnParameterBatch,
  mockClientOnConnectionChange,
  mockClientGetEstadoConexao,
} = vi.hoisted(() => ({
  mockCriarSessao: vi.fn(),
  mockBuscarSessaoAtiva: vi.fn(),
  mockEncerrarSessao: vi.fn(),
  mockInserirLeitura: vi.fn(),
  mockBuscarUltimaLeituraEm: vi.fn(),
  mockBuscarParametrosAtivos: vi.fn(),
  mockClientConnect: vi.fn(),
  mockClientClose: vi.fn(),
  mockClientOnEngineStarted: vi.fn(),
  mockClientOnEngineSample: vi.fn(),
  mockClientOnGroundSample: vi.fn(),
  mockClientOnParameterReading: vi.fn(),
  mockClientOnParameterBatch: vi.fn(),
  mockClientOnConnectionChange: vi.fn(),
  mockClientGetEstadoConexao: vi.fn(),
}))

// Callbacks registrados pelo serviço no client, recapturados a cada teste em beforeEach.
let capturedEngineStartedCallbacks: ((perfil: PerfilDaAeronave) => void)[] = []
let capturedEngineSampleCallbacks: ((a: AmostraMotor) => void)[] = []
let capturedGroundSampleCallbacks: ((a: AmostraSolo) => void)[] = []
let capturedParameterReadingCallbacks: ((p: ReadingPayload) => void)[] = []
let capturedParameterBatchCallbacks: ((p: BatchPayload) => void)[] = []
let capturedConnectionChangeCallbacks: ((estado: EstadoConexaoMock) => void)[] = []

vi.mock('./simconnect-client', () => ({
  SimConnectClient: vi.fn().mockImplementation(() => ({
    onEngineStarted: mockClientOnEngineStarted,
    onEngineSample: mockClientOnEngineSample,
    onGroundSample: mockClientOnGroundSample,
    onParameterReading: mockClientOnParameterReading,
    onParameterBatch: mockClientOnParameterBatch,
    onConnectionChange: mockClientOnConnectionChange,
    getEstadoConexao: mockClientGetEstadoConexao,
    connect: mockClientConnect,
    close: mockClientClose,
  })),
}))

vi.mock('../db/session-repository', () => ({
  criarSessao: mockCriarSessao,
  buscarSessaoAtiva: mockBuscarSessaoAtiva,
  encerrarSessao: mockEncerrarSessao,
}))

vi.mock('../db/reading-repository', () => ({
  inserirLeitura: mockInserirLeitura,
  buscarUltimaLeituraEm: mockBuscarUltimaLeituraEm,
}))

vi.mock('../db/parameter-repository', () => ({
  buscarParametrosAtivos: mockBuscarParametrosAtivos,
}))

import { CollectionService, VERIFICACAO_ABERTURA_MS } from './collection-service'
import type { Sessao, ParametroDeVoo } from '../../shared/types'
import type { PerfilDaAeronave } from './parametros-nao-aplicaveis'

// ---- helpers ----

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

/** Aeronave com motor a pistão e flapes (ex.: Cessna 172): nada é N/A. */
const PERFIL_PISTAO_COM_FLAPES: PerfilDaAeronave = { motorAPistao: true, temFlapes: true }

/**
 * Dispara o aviso de motor ligado com o perfil da aeronave e, como o client real, a
 * amostra do motor ligado logo depois.
 */
function ligarMotor(
  perfil: PerfilDaAeronave = PERFIL_PISTAO_COM_FLAPES,
  timestamp = '2024-01-01T00:00:00.000Z'
): void {
  capturedEngineStartedCallbacks.forEach((cb) => cb(perfil))
  capturedEngineSampleCallbacks.forEach((cb) => cb({ combustao: true, timestamp }))
}

function amostraMotor(combustao: boolean, timestamp: string): void {
  capturedEngineSampleCallbacks.forEach((cb) => cb({ combustao, timestamp }))
}

function amostraSolo(noSolo: boolean, timestamp: string): void {
  capturedGroundSampleCallbacks.forEach((cb) => cb({ noSolo, timestamp }))
}

function makeParametro(overrides: Partial<ParametroDeVoo> = {}): ParametroDeVoo {
  return {
    id: 'altitude_msl',
    nome: 'Altitude MSL',
    unidade: 'ft',
    ativo: true,
    ...overrides,
  }
}

describe('CollectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedEngineStartedCallbacks = []
    capturedEngineSampleCallbacks = []
    capturedGroundSampleCallbacks = []
    capturedParameterReadingCallbacks = []
    capturedParameterBatchCallbacks = []
    capturedConnectionChangeCallbacks = []

    // Re-wire captured arrays after clearAllMocks resets the implementations
    mockClientOnEngineStarted.mockImplementation((cb: (perfil: PerfilDaAeronave) => void) => {
      capturedEngineStartedCallbacks.push(cb)
    })
    mockClientOnEngineSample.mockImplementation((cb: (a: AmostraMotor) => void) => {
      capturedEngineSampleCallbacks.push(cb)
    })
    mockClientOnGroundSample.mockImplementation((cb: (a: AmostraSolo) => void) => {
      capturedGroundSampleCallbacks.push(cb)
    })
    mockClientOnParameterReading.mockImplementation((cb: (p: ReadingPayload) => void) => {
      capturedParameterReadingCallbacks.push(cb)
    })
    mockClientOnParameterBatch.mockImplementation((cb: (p: BatchPayload) => void) => {
      capturedParameterBatchCallbacks.push(cb)
    })
    mockClientOnConnectionChange.mockImplementation((cb: (e: EstadoConexaoMock) => void) => {
      capturedConnectionChangeCallbacks.push(cb)
    })

    mockBuscarParametrosAtivos.mockReturnValue([makeParametro()])
    mockBuscarSessaoAtiva.mockReturnValue(null)
    mockBuscarUltimaLeituraEm.mockReturnValue(null)
    mockEncerrarSessao.mockImplementation((id: string, encerradaEm: string) =>
      makeSessao({ id, status: 'encerrada', encerradaEm })
    )
    mockCriarSessao.mockImplementation((dados: Omit<Sessao, 'id'>) =>
      makeSessao({ ...dados, id: 'nova-sessao-1' })
    )
  })

  // --- CA-001-1: engine started triggers session creation ---

  it('deve chamar criarSessao ao receber evento onEngineStarted', () => {
    const service = new CollectionService()
    service.inicializar()

    ligarMotor()

    expect(mockCriarSessao).toHaveBeenCalledOnce()
    const args = mockCriarSessao.mock.calls[0][0] as Omit<Sessao, 'id'>
    expect(args.status).toBe('ativa')
    expect(args.encerradaEm).toBeNull()
  })

  it('deve iniciar polling de leituras após criar sessão (inserirLeitura é chamado com sessaoId correto)', () => {
    const service = new CollectionService()
    service.inicializar()

    ligarMotor()

    capturedParameterReadingCallbacks.forEach((cb) =>
      cb({ parametroId: 'altitude_msl', valor: 2000, timestamp: '2024-01-01T00:00:01.000Z' })
    )

    expect(mockInserirLeitura).toHaveBeenCalledOnce()
    const leitura = mockInserirLeitura.mock.calls[0][0] as Record<string, unknown>
    expect(leitura.sessaoId).toBe('nova-sessao-1')
    expect(leitura.parametroId).toBe('altitude_msl')
    expect(leitura.valor).toBe(2000)
  })

  it('deve registrar apenas parâmetros com ativo = true (connect recebe lista de ativos)', () => {
    const ativos = [makeParametro({ id: 'altitude_msl', ativo: true })]
    mockBuscarParametrosAtivos.mockReturnValue(ativos)

    const service = new CollectionService()
    service.inicializar()

    expect(mockClientConnect).toHaveBeenCalledWith(ativos)
  })

  it('não deve registrar leitura antes de uma sessão ser criada', () => {
    const service = new CollectionService()
    service.inicializar()

    capturedParameterReadingCallbacks.forEach((cb) =>
      cb({ parametroId: 'altitude_msl', valor: 999, timestamp: '2024-01-01T00:00:00.000Z' })
    )

    expect(mockInserirLeitura).not.toHaveBeenCalled()
  })

  // --- CA-001-2: motor already on at startup ---

  it('deve usar sessão ativa existente se motor já estava ligado (CA-001-2)', () => {
    const sessaoExistente = makeSessao({ id: 'sessao-existente' })
    mockBuscarSessaoAtiva.mockReturnValue(sessaoExistente)

    const service = new CollectionService()
    service.inicializar()
    // A sessão restaurada só é retomada com a primeira amostra do motor ligado (UC-003).
    ligarMotor()

    capturedParameterReadingCallbacks.forEach((cb) =>
      cb({ parametroId: 'altitude_msl', valor: 1000, timestamp: '2024-01-01T00:00:00.000Z' })
    )

    expect(mockInserirLeitura).toHaveBeenCalledOnce()
    const leitura = mockInserirLeitura.mock.calls[0][0] as Record<string, unknown>
    expect(leitura.sessaoId).toBe('sessao-existente')
    expect(mockCriarSessao).not.toHaveBeenCalled()
  })

  it('não deve criar sessão duplicada se motor já estava ligado e evento disparar novamente', () => {
    const sessaoExistente = makeSessao({ id: 'sessao-existente' })
    mockBuscarSessaoAtiva.mockReturnValue(sessaoExistente)

    const service = new CollectionService()
    service.inicializar()

    ligarMotor()
    ligarMotor()

    expect(mockCriarSessao).not.toHaveBeenCalled()
    expect(service.getSessaoAtual()?.id).toBe('sessao-existente')
  })

  // --- onSessaoCriada callback ---

  it('deve notificar callbacks de onSessaoCriada quando sessão é criada', () => {
    const service = new CollectionService()
    const spy = vi.fn()
    service.onSessaoCriada(spy)
    service.inicializar()

    ligarMotor()

    expect(spy).toHaveBeenCalledOnce()
    expect(spy.mock.calls[0][0].status).toBe('ativa')
  })

  // --- fecharConexao ---

  it('deve chamar client.close() ao fechar a conexão', () => {
    const service = new CollectionService()
    service.inicializar()
    service.fecharConexao()
    expect(mockClientClose).toHaveBeenCalledOnce()
  })

  it('não deve encerrar a sessão ativa ao fechar a conexão (fechar o app)', () => {
    const service = new CollectionService()
    service.inicializar()
    ligarMotor()

    service.fecharConexao()

    expect(mockEncerrarSessao).not.toHaveBeenCalled()
  })

  // --- UC-002: leituras em tempo real (CA-002-2) ---

  describe('onLeituras', () => {
    const lote: BatchPayload = {
      timestamp: '2024-01-01T00:00:01.000Z',
      leituras: [
        { parametroId: 'altitude_msl', valor: 4500 },
        { parametroId: 'airspeed_ias', valor: 112 },
      ],
    }

    it('deve emitir pacote com sessaoId no mesmo ciclo do lote quando há sessão ativa', () => {
      const service = new CollectionService()
      const spy = vi.fn()
      service.onLeituras(spy)
      service.inicializar()
      ligarMotor()

      capturedParameterBatchCallbacks.forEach((cb) => cb(lote))

      // Síncrono: o pacote sai na mesma chamada do lote, sem timer.
      expect(spy).toHaveBeenCalledOnce()
      expect(spy.mock.calls[0][0]).toEqual({
        sessaoId: 'nova-sessao-1',
        timestamp: lote.timestamp,
        leituras: lote.leituras,
      })
    })

    it('não deve emitir pacote quando não há sessão ativa', () => {
      const service = new CollectionService()
      const spy = vi.fn()
      service.onLeituras(spy)
      service.inicializar()

      capturedParameterBatchCallbacks.forEach((cb) => cb(lote))

      expect(spy).not.toHaveBeenCalled()
    })

    it('deve emitir pacote com o id da sessão existente ao reiniciar com sessão ativa', () => {
      mockBuscarSessaoAtiva.mockReturnValue(makeSessao({ id: 'sessao-existente' }))
      const service = new CollectionService()
      const spy = vi.fn()
      service.onLeituras(spy)
      service.inicializar()
      ligarMotor()

      capturedParameterBatchCallbacks.forEach((cb) => cb(lote))

      expect(spy).toHaveBeenCalledOnce()
      expect(spy.mock.calls[0][0].sessaoId).toBe('sessao-existente')
    })

    it('deve emitir um pacote por lote recebido', () => {
      const service = new CollectionService()
      const spy = vi.fn()
      service.onLeituras(spy)
      service.inicializar()
      ligarMotor()

      capturedParameterBatchCallbacks.forEach((cb) => cb(lote))
      capturedParameterBatchCallbacks.forEach((cb) => cb(lote))

      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  describe('conexão', () => {
    it('deve repassar mudança de conexão do client para onConexaoAlterada', () => {
      const service = new CollectionService()
      const spy = vi.fn()
      service.onConexaoAlterada(spy)
      service.inicializar()

      capturedConnectionChangeCallbacks.forEach((cb) => cb('conectado'))
      capturedConnectionChangeCallbacks.forEach((cb) => cb('desconectado'))

      expect(spy.mock.calls.map((c) => c[0])).toEqual(['conectado', 'desconectado'])
    })

    it('deve devolver o estado de conexão do client em getEstadoConexao', () => {
      mockClientGetEstadoConexao.mockReturnValue('conectado')
      const service = new CollectionService()
      expect(service.getEstadoConexao()).toBe('conectado')
    })
  })

  // --- UC-006 / RN-007: parâmetros não aplicáveis (N/A) ---

  describe('parâmetros não aplicáveis (RN-007)', () => {
    const TS = '2024-01-01T00:00:01.000Z'

    /** Lote com os 12 parâmetros do conjunto, como o client entrega após o UC-006. */
    const LOTE_DOZE: BatchPayload = {
      timestamp: TS,
      leituras: [
        { parametroId: 'altitude_msl', valor: 4500 },
        { parametroId: 'airspeed_ias', valor: 112 },
        { parametroId: 'vertical_speed', valor: 650 },
        { parametroId: 'heading_magnetic', valor: 5 },
        { parametroId: 'pitch', valor: -2 },
        { parametroId: 'bank', valor: 3 },
        { parametroId: 'latitude', valor: -23.5505199 },
        { parametroId: 'longitude', valor: -46.6333094 },
        { parametroId: 'throttle_1', valor: 85 },
        { parametroId: 'mixture_1', valor: 100 },
        { parametroId: 'rpm_1', valor: 2450 },
        { parametroId: 'flaps', valor: 30 },
      ],
    }

    function enviarLeiturasIndividuais(lote: BatchPayload): void {
      for (const leitura of lote.leituras) {
        capturedParameterReadingCallbacks.forEach((cb) =>
          cb({ parametroId: leitura.parametroId, valor: leitura.valor, timestamp: lote.timestamp })
        )
      }
    }

    function idsGravados(): string[] {
      return mockInserirLeitura.mock.calls.map(
        (c) => (c[0] as { parametroId: string }).parametroId
      )
    }

    it('deve gravar a lista vazia na sessão quando a aeronave é a pistão e tem flapes', () => {
      const service = new CollectionService()
      service.inicializar()

      ligarMotor({ motorAPistao: true, temFlapes: true })

      const args = mockCriarSessao.mock.calls[0][0] as Omit<Sessao, 'id'>
      expect(args.parametrosNaoAplicaveis).toEqual([])
    })

    it('deve gravar mixture_1 e flaps na sessão quando o motor não é a pistão e não há flapes', () => {
      const service = new CollectionService()
      service.inicializar()

      ligarMotor({ motorAPistao: false, temFlapes: false })

      const args = mockCriarSessao.mock.calls[0][0] as Omit<Sessao, 'id'>
      expect([...args.parametrosNaoAplicaveis].sort()).toEqual(['flaps', 'mixture_1'])
    })

    it('deve entregar a sessão criada com a lista de N/A a onSessaoCriada', () => {
      const service = new CollectionService()
      const spy = vi.fn()
      service.onSessaoCriada(spy)
      service.inicializar()

      ligarMotor({ motorAPistao: false, temFlapes: true })

      expect((spy.mock.calls[0][0] as Sessao).parametrosNaoAplicaveis).toEqual(['mixture_1'])
    })

    it('deve gravar a cada ciclo as leituras dos 12 parâmetros quando nada é N/A (CA-006-1)', () => {
      const service = new CollectionService()
      service.inicializar()
      ligarMotor()

      enviarLeiturasIndividuais(LOTE_DOZE)

      expect(mockInserirLeitura).toHaveBeenCalledTimes(12)
      expect(idsGravados()).toEqual(LOTE_DOZE.leituras.map((l) => l.parametroId))
      mockInserirLeitura.mock.calls.forEach((c) => {
        const leitura = c[0] as { sessaoId: string; timestamp: string }
        expect(leitura.sessaoId).toBe('nova-sessao-1')
        expect(leitura.timestamp).toBe(TS)
      })
    })

    it('deve gravar latitude e longitude com precisão total, sem arredondar', () => {
      const service = new CollectionService()
      service.inicializar()
      ligarMotor()

      enviarLeiturasIndividuais(LOTE_DOZE)

      const lat = mockInserirLeitura.mock.calls.find(
        (c) => (c[0] as { parametroId: string }).parametroId === 'latitude'
      )
      expect((lat![0] as { valor: number }).valor).toBe(-23.5505199)
    })

    it('não deve chamar inserirLeitura para parâmetros N/A da sessão (CA-006-4)', () => {
      const service = new CollectionService()
      service.inicializar()
      ligarMotor({ motorAPistao: false, temFlapes: false })

      enviarLeiturasIndividuais(LOTE_DOZE)

      expect(mockInserirLeitura).toHaveBeenCalledTimes(10)
      expect(idsGravados()).not.toContain('mixture_1')
      expect(idsGravados()).not.toContain('flaps')
      // Manete, RPM, latitude e longitude nunca são N/A.
      expect(idsGravados()).toEqual(
        expect.arrayContaining(['throttle_1', 'rpm_1', 'latitude', 'longitude'])
      )
    })

    it('não deve enviar no pacote os parâmetros N/A da sessão (CA-006-4)', () => {
      const service = new CollectionService()
      const spy = vi.fn()
      service.onLeituras(spy)
      service.inicializar()
      ligarMotor({ motorAPistao: false, temFlapes: false })

      capturedParameterBatchCallbacks.forEach((cb) => cb(LOTE_DOZE))

      const pacote = spy.mock.calls[0][0] as { leituras: { parametroId: string }[] }
      const ids = pacote.leituras.map((l) => l.parametroId)
      expect(ids).toHaveLength(10)
      expect(ids).not.toContain('mixture_1')
      expect(ids).not.toContain('flaps')
    })

    it('deve gravar 0 válido de flapes e RPM quando eles não são N/A', () => {
      const service = new CollectionService()
      const spy = vi.fn()
      service.onLeituras(spy)
      service.inicializar()
      ligarMotor({ motorAPistao: true, temFlapes: true })

      const loteZero: BatchPayload = {
        timestamp: TS,
        leituras: [
          { parametroId: 'flaps', valor: 0 },
          { parametroId: 'rpm_1', valor: 0 },
        ],
      }
      enviarLeiturasIndividuais(loteZero)
      capturedParameterBatchCallbacks.forEach((cb) => cb(loteZero))

      expect(mockInserirLeitura).toHaveBeenCalledTimes(2)
      mockInserirLeitura.mock.calls.forEach((c) => expect((c[0] as { valor: number }).valor).toBe(0))
      expect((spy.mock.calls[0][0] as { leituras: unknown[] }).leituras).toEqual(loteZero.leituras)
    })

    it('deve usar a lista persistida da sessão restaurada ao reiniciar com sessão ativa', () => {
      mockBuscarSessaoAtiva.mockReturnValue(
        makeSessao({ id: 'sessao-existente', parametrosNaoAplicaveis: ['flaps'] })
      )
      const service = new CollectionService()
      const spy = vi.fn()
      service.onLeituras(spy)
      service.inicializar()
      // Perfil de jato sem flapes: a confirmação ignora o perfil e usa a lista gravada.
      ligarMotor({ motorAPistao: false, temFlapes: false })

      enviarLeiturasIndividuais(LOTE_DOZE)
      capturedParameterBatchCallbacks.forEach((cb) => cb(LOTE_DOZE))

      expect(idsGravados()).not.toContain('flaps')
      expect(idsGravados()).toContain('mixture_1')
      const ids = (spy.mock.calls[0][0] as { leituras: { parametroId: string }[] }).leituras.map(
        (l) => l.parametroId
      )
      expect(ids).not.toContain('flaps')
      expect(ids).toContain('mixture_1')
    })

    it('não deve mudar a lista quando chega outro perfil no meio da sessão (troca de aeronave)', () => {
      const service = new CollectionService()
      const spyLeituras = vi.fn()
      service.onLeituras(spyLeituras)
      service.inicializar()
      ligarMotor({ motorAPistao: true, temFlapes: true })

      // Novo aviso de motor ligado com perfil de jato, sem a sessão ter encerrado.
      ligarMotor({ motorAPistao: false, temFlapes: false })
      enviarLeiturasIndividuais(LOTE_DOZE)
      capturedParameterBatchCallbacks.forEach((cb) => cb(LOTE_DOZE))

      expect(mockCriarSessao).toHaveBeenCalledOnce()
      expect(mockInserirLeitura).toHaveBeenCalledTimes(12)
      expect(idsGravados()).toEqual(expect.arrayContaining(['mixture_1', 'flaps']))
      expect((spyLeituras.mock.calls[0][0] as { leituras: unknown[] }).leituras).toHaveLength(12)
    })
  })

  // --- UC-003: encerramento da sessão ---

  describe('UC-003: encerramento', () => {
    const T0 = Date.parse('2024-01-01T00:00:00.000Z')

    /** Instante ISO a `s` segundos de T0. */
    function em(s: number): string {
      return new Date(T0 + s * 1000).toISOString()
    }

    /** Uma amostra de motor e uma de solo por segundo, de `de` até `ate` inclusive. */
    function amostras(de: number, ate: number, combustao: boolean, noSolo: boolean): void {
      for (let s = de; s <= ate; s++) {
        amostraMotor(combustao, em(s))
        amostraSolo(noSolo, em(s))
      }
    }

    function enviarLeitura(valor: number, timestamp: string): void {
      capturedParameterReadingCallbacks.forEach((cb) =>
        cb({ parametroId: 'altitude_msl', valor, timestamp })
      )
    }

    function enviarLote(timestamp: string): void {
      capturedParameterBatchCallbacks.forEach((cb) =>
        cb({ timestamp, leituras: [{ parametroId: 'altitude_msl', valor: 100 }] })
      )
    }

    let consoleError: MockInstance<Parameters<typeof console.error>, void>

    beforeEach(() => {
      consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      let n = 0
      mockCriarSessao.mockImplementation((dados: Omit<Sessao, 'id'>) =>
        makeSessao({ ...dados, id: `sessao-${++n}` })
      )
    })

    afterEach(() => {
      consoleError.mockRestore()
    })

    /** Serviço com sessão iniciada pelo motor em T0, aeronave no solo. */
    function servicoComSessao(): {
      service: CollectionService
      encerrada: ReturnType<typeof vi.fn>
      falha: ReturnType<typeof vi.fn>
      criada: ReturnType<typeof vi.fn>
      leituras: ReturnType<typeof vi.fn>
    } {
      const service = new CollectionService()
      const encerrada = vi.fn()
      const falha = vi.fn()
      const criada = vi.fn()
      const leituras = vi.fn()
      service.onSessaoEncerrada(encerrada)
      service.onFalhaAoEncerrar(falha)
      service.onSessaoCriada(criada)
      service.onLeituras(leituras)
      service.inicializar()
      amostraSolo(true, em(0))
      ligarMotor(PERFIL_PISTAO_COM_FLAPES, em(0))
      return { service, encerrada, falha, criada, leituras }
    }

    it('deve encerrar a sessão com motor parado e no solo por 15 s, com a hora de fim no corte', () => {
      const { encerrada } = servicoComSessao()
      amostras(1, 9, true, true) // táxi
      amostras(10, 25, false, true) // corte aos 10 s

      expect(mockEncerrarSessao).toHaveBeenCalledOnce()
      expect(mockEncerrarSessao).toHaveBeenCalledWith('sessao-1', em(10))
      expect(encerrada).toHaveBeenCalledOnce()
    })

    it('não deve encerrar com 14 s de motor parado no solo', () => {
      const { encerrada, service } = servicoComSessao()
      amostras(10, 24, false, true)

      expect(mockEncerrarSessao).not.toHaveBeenCalled()
      expect(encerrada).not.toHaveBeenCalled()
      expect(service.getSessaoAtual()?.id).toBe('sessao-1')
    })

    it('deve emitir onSessaoEncerrada só depois de gravar, com a sessão gravada', () => {
      const { encerrada } = servicoComSessao()
      amostras(10, 25, false, true)

      expect(mockEncerrarSessao.mock.invocationCallOrder[0]).toBeLessThan(
        encerrada.mock.invocationCallOrder[0]
      )
      const emitida = encerrada.mock.calls[0][0] as Sessao
      expect(emitida.status).toBe('encerrada')
      expect(emitida.encerradaEm).toBe(em(10))
      expect(emitida).toBe(mockEncerrarSessao.mock.results[0].value)
    })

    it('deve tirar a sessão da memória depois do encerramento', () => {
      const { service } = servicoComSessao()
      amostras(10, 25, false, true)

      expect(service.getSessaoAtual()).toBeNull()
    })

    it('não deve gravar leitura nem enviar pacote depois do encerramento', () => {
      const { leituras } = servicoComSessao()
      amostras(10, 25, false, true)
      mockInserirLeitura.mockClear()
      leituras.mockClear()

      enviarLeitura(100, em(26))
      enviarLote(em(26))

      expect(mockInserirLeitura).not.toHaveBeenCalled()
      expect(leituras).not.toHaveBeenCalled()
    })

    it('deve continuar gravando as leituras da espera de 15 s, até o encerramento', () => {
      servicoComSessao()
      amostras(10, 20, false, true)
      enviarLeitura(100, em(20))

      expect(mockInserirLeitura).toHaveBeenCalledOnce()
      expect((mockInserirLeitura.mock.calls[0][0] as { sessaoId: string }).sessaoId).toBe(
        'sessao-1'
      )
    })

    it('deve gravar o encerramento uma única vez, mesmo com mais amostras paradas depois', () => {
      const { encerrada } = servicoComSessao()
      amostras(10, 60, false, true)

      expect(mockEncerrarSessao).toHaveBeenCalledOnce()
      expect(encerrada).toHaveBeenCalledOnce()
    })

    it('não deve encerrar com pane em voo (motor parado fora do solo)', () => {
      const { service, encerrada } = servicoComSessao()
      amostras(1, 30, true, false) // decolagem e voo
      amostras(31, 200, false, false) // pane e planeio

      expect(mockEncerrarSessao).not.toHaveBeenCalled()
      expect(encerrada).not.toHaveBeenCalled()
      expect(service.getSessaoAtual()?.id).toBe('sessao-1')
    })

    it('deve encerrar 15 s após o pouso de uma pane em voo, com a hora de fim no toque', () => {
      servicoComSessao()
      amostras(1, 30, true, false)
      amostras(31, 99, false, false)
      amostras(100, 115, false, true) // toque aos 100 s

      expect(mockEncerrarSessao).toHaveBeenCalledWith('sessao-1', em(100))
    })

    it('não deve encerrar sem nenhuma amostra de solo (solo desconhecido)', () => {
      const service = new CollectionService()
      service.inicializar()
      ligarMotor(PERFIL_PISTAO_COM_FLAPES, em(0))
      for (let s = 1; s <= 60; s++) amostraMotor(false, em(s))

      expect(mockEncerrarSessao).not.toHaveBeenCalled()
    })

    it('deve manter a mesma sessão quando o motor tosse e volta antes de 15 s', () => {
      const { service, criada, encerrada } = servicoComSessao()
      amostras(10, 15, false, true) // tosse: 6 s parado
      ligarMotor(PERFIL_PISTAO_COM_FLAPES, em(16)) // volta (nova partida no client)
      amostras(17, 30, true, true)
      amostras(31, 44, false, true) // novo corte, 14 s

      expect(mockCriarSessao).toHaveBeenCalledOnce()
      expect(criada).toHaveBeenCalledOnce()
      expect(mockEncerrarSessao).not.toHaveBeenCalled()
      expect(encerrada).not.toHaveBeenCalled()
      expect(service.getSessaoAtual()?.id).toBe('sessao-1')

      amostras(45, 46, false, true)
      expect(mockEncerrarSessao).toHaveBeenCalledWith('sessao-1', em(31))
    })

    it('deve abrir uma sessão nova, com id e lista de N/A novos, quando o motor é religado após o encerramento', () => {
      const { service, criada } = servicoComSessao()
      amostras(10, 25, false, true)

      ligarMotor({ motorAPistao: false, temFlapes: false }, em(30))

      expect(mockCriarSessao).toHaveBeenCalledTimes(2)
      expect(criada).toHaveBeenCalledTimes(2)
      const nova = criada.mock.calls[1][0] as Sessao
      expect(nova.id).toBe('sessao-2')
      expect(nova.id).not.toBe('sessao-1')
      expect(nova.status).toBe('ativa')
      expect([...nova.parametrosNaoAplicaveis].sort()).toEqual(['flaps', 'mixture_1'])
      expect(service.getSessaoAtual()?.id).toBe('sessao-2')

      enviarLeitura(100, em(31))
      expect((mockInserirLeitura.mock.calls[mockInserirLeitura.mock.calls.length - 1][0] as { sessaoId: string }).sessaoId).toBe(
        'sessao-2'
      )
    })

    it('deve contar de novo do zero na sessão nova, sem herdar a contagem da anterior', () => {
      servicoComSessao()
      amostras(10, 25, false, true)
      ligarMotor(PERFIL_PISTAO_COM_FLAPES, em(30))
      amostras(31, 45, false, true) // 14 s depois do corte aos 31 s

      expect(mockEncerrarSessao).toHaveBeenCalledOnce()
      amostras(46, 46, false, true)
      expect(mockEncerrarSessao).toHaveBeenLastCalledWith('sessao-2', em(31))
    })

    describe('falha ao gravar o encerramento', () => {
      beforeEach(() => {
        mockEncerrarSessao.mockImplementation(() => {
          throw new Error('disco cheio')
        })
      })

      it('deve logar e emitir onFalhaAoEncerrar com a sessão como estava na memória', () => {
        const { falha, encerrada } = servicoComSessao()
        amostras(10, 25, false, true)

        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining('sessao-1'),
          expect.any(Error)
        )
        expect(falha).toHaveBeenCalledOnce()
        const sessao = falha.mock.calls[0][0] as Sessao
        expect(sessao.id).toBe('sessao-1')
        expect(sessao.status).toBe('ativa')
        expect(encerrada).not.toHaveBeenCalled()
      })

      it('deve tirar a sessão da memória e não gravar nem enviar mais nada dela', () => {
        const { service, leituras } = servicoComSessao()
        amostras(10, 25, false, true)
        mockInserirLeitura.mockClear()
        leituras.mockClear()

        enviarLeitura(100, em(26))
        enviarLote(em(26))

        expect(service.getSessaoAtual()).toBeNull()
        expect(mockInserirLeitura).not.toHaveBeenCalled()
        expect(leituras).not.toHaveBeenCalled()
      })

      it('não deve tentar gravar de novo nas amostras seguintes', () => {
        const { falha } = servicoComSessao()
        amostras(10, 60, false, true)

        expect(mockEncerrarSessao).toHaveBeenCalledOnce()
        expect(falha).toHaveBeenCalledOnce()
      })

      it('deve abrir uma sessão nova quando o motor é religado depois da falha', () => {
        const { service, criada } = servicoComSessao()
        amostras(10, 25, false, true)

        ligarMotor(PERFIL_PISTAO_COM_FLAPES, em(30))

        expect(criada).toHaveBeenCalledTimes(2)
        expect(service.getSessaoAtual()?.id).toBe('sessao-2')
      })
    })

    describe('queda de conexão durante a espera', () => {
      function cairConexao(): void {
        capturedConnectionChangeCallbacks.forEach((cb) => cb('desconectado'))
      }

      function voltarConexao(): void {
        capturedConnectionChangeCallbacks.forEach((cb) => cb('conectado'))
      }

      it('não deve encerrar a sessão com a queda e deve repassar o estado da conexão', () => {
        const { service, encerrada } = servicoComSessao()
        const conexao = vi.fn()
        service.onConexaoAlterada(conexao)
        amostras(10, 15, false, true)

        cairConexao()

        expect(mockEncerrarSessao).not.toHaveBeenCalled()
        expect(encerrada).not.toHaveBeenCalled()
        expect(service.getSessaoAtual()?.id).toBe('sessao-1')
        expect(conexao).toHaveBeenCalledWith('desconectado')
      })

      it('não deve encerrar com a queda em voo', () => {
        const { service } = servicoComSessao()
        amostras(1, 30, true, false)

        cairConexao()

        expect(mockEncerrarSessao).not.toHaveBeenCalled()
        expect(service.getSessaoAtual()?.id).toBe('sessao-1')
      })

      it('deve continuar do instante original quando, ao reconectar, o motor segue parado e no solo', () => {
        servicoComSessao()
        amostras(10, 15, false, true) // contagem desde 10 s
        cairConexao()
        voltarConexao()
        amostras(60, 60, false, true) // volta 45 s depois com as duas condições

        expect(mockEncerrarSessao).toHaveBeenCalledWith('sessao-1', em(10))
      })

      it('deve zerar a contagem quando, ao reconectar, o motor voltou', () => {
        const { service } = servicoComSessao()
        amostras(10, 15, false, true)
        cairConexao()
        voltarConexao()
        amostras(60, 60, true, true)
        amostras(61, 74, false, true) // novo corte aos 61 s, 14 s

        expect(mockEncerrarSessao).not.toHaveBeenCalled()
        expect(service.getSessaoAtual()?.id).toBe('sessao-1')
      })

      it('deve zerar a contagem quando, ao reconectar, a aeronave saiu do solo', () => {
        servicoComSessao()
        amostras(10, 15, false, true)
        cairConexao()
        voltarConexao()
        amostras(60, 60, false, false)

        expect(mockEncerrarSessao).not.toHaveBeenCalled()
      })
    })

    describe('verificação da sessão restaurada na abertura', () => {
      const RESTAURADA = makeSessao({
        id: 'restaurada',
        iniciadaEm: '2023-12-31T23:00:00.000Z',
        parametrosNaoAplicaveis: ['flaps'],
      })

      let consoleWarn: MockInstance<Parameters<typeof console.warn>, void>

      beforeEach(() => {
        vi.useFakeTimers()
        consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        mockBuscarSessaoAtiva.mockReturnValue(RESTAURADA)
        mockBuscarUltimaLeituraEm.mockReturnValue('2023-12-31T23:40:00.000Z')
      })

      afterEach(() => {
        consoleWarn.mockRestore()
        vi.useRealTimers()
      })

      function abrir(): {
        service: CollectionService
        criada: ReturnType<typeof vi.fn>
        encerrada: ReturnType<typeof vi.fn>
        falha: ReturnType<typeof vi.fn>
        leituras: ReturnType<typeof vi.fn>
      } {
        const service = new CollectionService()
        const criada = vi.fn()
        const encerrada = vi.fn()
        const falha = vi.fn()
        const leituras = vi.fn()
        service.onSessaoCriada(criada)
        service.onSessaoEncerrada(encerrada)
        service.onFalhaAoEncerrar(falha)
        service.onLeituras(leituras)
        service.inicializar()
        return { service, criada, encerrada, falha, leituras }
      }

      it('deve usar o prazo de 15 s', () => {
        expect(VERIFICACAO_ABERTURA_MS).toBe(15_000)
      })

      it('deve deixar a sessão gravada em verificação: sem leituras, sem pacote, fora da memória', () => {
        const { service, criada, leituras } = abrir()

        enviarLeitura(100, em(1))
        enviarLote(em(1))

        expect(service.getSessaoAtual()).toBeNull()
        expect(mockInserirLeitura).not.toHaveBeenCalled()
        expect(leituras).not.toHaveBeenCalled()
        expect(criada).not.toHaveBeenCalled()
        expect(mockEncerrarSessao).not.toHaveBeenCalled()
      })

      it('não deve decidir com amostras de solo antes da primeira amostra do motor', () => {
        const { service } = abrir()

        amostraSolo(true, em(1))
        amostraSolo(true, em(2))

        expect(service.getSessaoAtual()).toBeNull()
        expect(mockEncerrarSessao).not.toHaveBeenCalled()
      })

      it('deve confirmar a sessão com o motor ligado e emitir onSessaoCriada ("Coleta iniciada")', () => {
        const { service, criada, leituras } = abrir()

        ligarMotor({ motorAPistao: false, temFlapes: false }, em(1))

        expect(criada).toHaveBeenCalledOnce()
        expect(criada).toHaveBeenCalledWith(RESTAURADA)
        expect(service.getSessaoAtual()).toEqual(RESTAURADA)
        expect(mockCriarSessao).not.toHaveBeenCalled()
        expect(mockEncerrarSessao).not.toHaveBeenCalled()

        enviarLeitura(100, em(2))
        enviarLote(em(2))
        expect((mockInserirLeitura.mock.calls[0][0] as { sessaoId: string }).sessaoId).toBe(
          'restaurada'
        )
        expect((leituras.mock.calls[0][0] as { sessaoId: string }).sessaoId).toBe('restaurada')
      })

      it('deve confirmar também com uma amostra do motor ligado sem aviso de partida', () => {
        const { service, criada } = abrir()

        amostraMotor(true, em(1))

        expect(criada).toHaveBeenCalledOnce()
        expect(service.getSessaoAtual()?.id).toBe('restaurada')
      })

      it('não deve encerrar no prazo depois de confirmar a sessão', () => {
        const { service } = abrir()
        ligarMotor(PERFIL_PISTAO_COM_FLAPES, em(1))

        vi.advanceTimersByTime(VERIFICACAO_ABERTURA_MS * 2)

        expect(mockEncerrarSessao).not.toHaveBeenCalled()
        expect(service.getSessaoAtual()?.id).toBe('restaurada')
      })

      it('deve encerrar a sessão confirmada pelo detector, como qualquer sessão ativa', () => {
        const { encerrada } = abrir()
        amostraSolo(true, em(0))
        ligarMotor(PERFIL_PISTAO_COM_FLAPES, em(0))
        amostras(5, 20, false, true)

        expect(mockEncerrarSessao).toHaveBeenCalledWith('restaurada', em(5))
        expect(encerrada).toHaveBeenCalledOnce()
      })

      it('deve encerrar silenciosamente com a hora da última leitura quando o motor está parado', () => {
        const { service, criada, encerrada, falha } = abrir()

        amostraMotor(false, em(1))

        expect(mockBuscarUltimaLeituraEm).toHaveBeenCalledWith('restaurada')
        expect(mockEncerrarSessao).toHaveBeenCalledOnce()
        expect(mockEncerrarSessao).toHaveBeenCalledWith('restaurada', '2023-12-31T23:40:00.000Z')
        expect(criada).not.toHaveBeenCalled()
        expect(encerrada).not.toHaveBeenCalled()
        expect(falha).not.toHaveBeenCalled()
        expect(service.getSessaoAtual()).toBeNull()
      })

      it('deve encerrar com a hora de início quando a sessão restaurada não tem leitura', () => {
        mockBuscarUltimaLeituraEm.mockReturnValue(null)
        abrir()

        amostraMotor(false, em(1))

        expect(mockEncerrarSessao).toHaveBeenCalledWith('restaurada', RESTAURADA.iniciadaEm)
      })

      it('deve encerrar a sessão restaurada só uma vez, e não pelo prazo depois', () => {
        abrir()
        amostraMotor(false, em(1))
        amostraMotor(false, em(2))

        vi.advanceTimersByTime(VERIFICACAO_ABERTURA_MS * 2)

        expect(mockEncerrarSessao).toHaveBeenCalledOnce()
      })

      it('deve encerrar silenciosamente aos 15 s sem amostra do motor, com a última leitura', () => {
        const { service, criada, encerrada, falha } = abrir()

        vi.advanceTimersByTime(VERIFICACAO_ABERTURA_MS - 1)
        expect(mockEncerrarSessao).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1)
        expect(mockEncerrarSessao).toHaveBeenCalledOnce()
        expect(mockEncerrarSessao).toHaveBeenCalledWith('restaurada', '2023-12-31T23:40:00.000Z')
        expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('restaurada'))
        expect(criada).not.toHaveBeenCalled()
        expect(encerrada).not.toHaveBeenCalled()
        expect(falha).not.toHaveBeenCalled()
        expect(service.getSessaoAtual()).toBeNull()
      })

      it('deve abrir uma sessão nova quando o motor é ligado depois de encerrar a restaurada', () => {
        const { service, criada } = abrir()
        vi.advanceTimersByTime(VERIFICACAO_ABERTURA_MS)

        ligarMotor(PERFIL_PISTAO_COM_FLAPES, em(30))

        expect(mockCriarSessao).toHaveBeenCalledOnce()
        expect(criada).toHaveBeenCalledOnce()
        expect((criada.mock.calls[0][0] as Sessao).id).not.toBe('restaurada')
        expect(service.getSessaoAtual()?.id).not.toBe('restaurada')
      })

      it('deve só logar quando a gravação do encerramento na abertura falha', () => {
        mockEncerrarSessao.mockImplementation(() => {
          throw new Error('banco bloqueado')
        })
        const { service, encerrada, falha } = abrir()

        expect(() => amostraMotor(false, em(1))).not.toThrow()

        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining('restaurada'),
          expect.any(Error)
        )
        expect(encerrada).not.toHaveBeenCalled()
        expect(falha).not.toHaveBeenCalled()
        expect(service.getSessaoAtual()).toBeNull()

        ligarMotor(PERFIL_PISTAO_COM_FLAPES, em(2))
        expect(mockCriarSessao).toHaveBeenCalledOnce()
      })

      it('deve cancelar o prazo ao fechar a conexão', () => {
        const { service } = abrir()

        service.fecharConexao()
        vi.advanceTimersByTime(VERIFICACAO_ABERTURA_MS * 2)

        expect(mockEncerrarSessao).not.toHaveBeenCalled()
        expect(mockClientClose).toHaveBeenCalledOnce()
      })

      it('não deve agendar prazo nem encerrar nada sem sessão gravada', () => {
        mockBuscarSessaoAtiva.mockReturnValue(null)
        abrir()

        vi.advanceTimersByTime(VERIFICACAO_ABERTURA_MS * 2)

        expect(mockEncerrarSessao).not.toHaveBeenCalled()
        expect(mockBuscarUltimaLeituraEm).not.toHaveBeenCalled()
      })
    })
  })
})
