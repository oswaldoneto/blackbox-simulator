import { describe, it, expect, vi, beforeEach } from 'vitest'

// ----- mocks (hoisted so vi.mock factories can reference them) -----
type ReadingPayload = { parametroId: string; valor: number; timestamp: string }
type BatchPayload = { timestamp: string; leituras: { parametroId: string; valor: number }[] }
type EstadoConexaoMock = 'conectado' | 'desconectado'

const {
  mockCriarSessao,
  mockBuscarSessaoAtiva,
  mockInserirLeitura,
  mockBuscarParametrosAtivos,
  mockClientConnect,
  mockClientClose,
  mockClientOnEngineStarted,
  mockClientOnParameterReading,
  mockClientOnParameterBatch,
  mockClientOnConnectionChange,
  mockClientGetEstadoConexao,
} = vi.hoisted(() => ({
  mockCriarSessao: vi.fn(),
  mockBuscarSessaoAtiva: vi.fn(),
  mockInserirLeitura: vi.fn(),
  mockBuscarParametrosAtivos: vi.fn(),
  mockClientConnect: vi.fn(),
  mockClientClose: vi.fn(),
  mockClientOnEngineStarted: vi.fn(),
  mockClientOnParameterReading: vi.fn(),
  mockClientOnParameterBatch: vi.fn(),
  mockClientOnConnectionChange: vi.fn(),
  mockClientGetEstadoConexao: vi.fn(),
}))

// Callbacks registrados pelo serviço no client, recapturados a cada teste em beforeEach.
let capturedEngineStartedCallbacks: ((perfil: PerfilDaAeronave) => void)[] = []
let capturedParameterReadingCallbacks: ((p: ReadingPayload) => void)[] = []
let capturedParameterBatchCallbacks: ((p: BatchPayload) => void)[] = []
let capturedConnectionChangeCallbacks: ((estado: EstadoConexaoMock) => void)[] = []

vi.mock('./simconnect-client', () => ({
  SimConnectClient: vi.fn().mockImplementation(() => ({
    onEngineStarted: mockClientOnEngineStarted,
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
}))

vi.mock('../db/reading-repository', () => ({
  inserirLeitura: mockInserirLeitura,
}))

vi.mock('../db/parameter-repository', () => ({
  buscarParametrosAtivos: mockBuscarParametrosAtivos,
}))

import { CollectionService } from './collection-service'
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

/** Dispara o aviso de motor ligado com o perfil da aeronave. */
function ligarMotor(perfil: PerfilDaAeronave = PERFIL_PISTAO_COM_FLAPES): void {
  capturedEngineStartedCallbacks.forEach((cb) => cb(perfil))
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
    capturedParameterReadingCallbacks = []
    capturedParameterBatchCallbacks = []
    capturedConnectionChangeCallbacks = []

    // Re-wire captured arrays after clearAllMocks resets the implementations
    mockClientOnEngineStarted.mockImplementation((cb: (perfil: PerfilDaAeronave) => void) => {
      capturedEngineStartedCallbacks.push(cb)
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

    expect(mockCriarSessao).not.toHaveBeenCalled()
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

  // --- encerrar ---

  it('deve chamar client.close() ao encerrar', () => {
    const service = new CollectionService()
    service.inicializar()
    service.encerrar()
    expect(mockClientClose).toHaveBeenCalledOnce()
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
})
