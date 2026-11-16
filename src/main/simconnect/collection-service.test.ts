import { describe, it, expect, vi, beforeEach } from 'vitest'

// ----- mocks (hoisted so vi.mock factories can reference them) -----
const {
  mockCriarSessao,
  mockBuscarSessaoAtiva,
  mockInserirLeitura,
  mockBuscarParametrosAtivos,
  mockClientConnect,
  mockClientClose,
  mockClientOnEngineStarted,
  mockClientOnParameterReading,
} = vi.hoisted(() => {
  let capturedEngineCallbacks: (() => void)[] = []
  let capturedReadingCallbacks: ((p: {
    parametroId: string
    valor: number
    timestamp: string
  }) => void)[] = []

  const mockClientOnEngineStarted = vi.fn().mockImplementation((cb: () => void) => {
    capturedEngineCallbacks.push(cb)
  })
  const mockClientOnParameterReading = vi.fn().mockImplementation(
    (cb: (p: { parametroId: string; valor: number; timestamp: string }) => void) => {
      capturedReadingCallbacks.push(cb)
    }
  )

  return {
    mockCriarSessao: vi.fn(),
    mockBuscarSessaoAtiva: vi.fn(),
    mockInserirLeitura: vi.fn(),
    mockBuscarParametrosAtivos: vi.fn(),
    mockClientConnect: vi.fn(),
    mockClientClose: vi.fn(),
    mockClientOnEngineStarted,
    mockClientOnParameterReading,
    // expose captured arrays via getters on the returned fns themselves
  }
})

// We need the callback arrays accessible in tests.
// Store them separately via hoisted arrays captured per-test in beforeEach.
let capturedEngineStartedCallbacks: (() => void)[] = []
let capturedParameterReadingCallbacks: ((p: {
  parametroId: string
  valor: number
  timestamp: string
}) => void)[] = []

vi.mock('./simconnect-client', () => ({
  SimConnectClient: vi.fn().mockImplementation(() => ({
    onEngineStarted: mockClientOnEngineStarted,
    onParameterReading: mockClientOnParameterReading,
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
    ...overrides,
  }
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

    // Re-wire captured arrays after clearAllMocks resets the implementations
    mockClientOnEngineStarted.mockImplementation((cb: () => void) => {
      capturedEngineStartedCallbacks.push(cb)
    })
    mockClientOnParameterReading.mockImplementation(
      (cb: (p: { parametroId: string; valor: number; timestamp: string }) => void) => {
        capturedParameterReadingCallbacks.push(cb)
      }
    )

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

    capturedEngineStartedCallbacks.forEach((cb) => cb())

    expect(mockCriarSessao).toHaveBeenCalledOnce()
    const args = mockCriarSessao.mock.calls[0][0] as Omit<Sessao, 'id'>
    expect(args.status).toBe('ativa')
    expect(args.encerradaEm).toBeNull()
  })

  it('deve iniciar polling de leituras após criar sessão (inserirLeitura é chamado com sessaoId correto)', () => {
    const service = new CollectionService()
    service.inicializar()

    capturedEngineStartedCallbacks.forEach((cb) => cb())

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

    capturedEngineStartedCallbacks.forEach((cb) => cb())

    expect(mockCriarSessao).not.toHaveBeenCalled()
  })

  // --- onSessaoCriada callback ---

  it('deve notificar callbacks de onSessaoCriada quando sessão é criada', () => {
    const service = new CollectionService()
    const spy = vi.fn()
    service.onSessaoCriada(spy)
    service.inicializar()

    capturedEngineStartedCallbacks.forEach((cb) => cb())

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
})
