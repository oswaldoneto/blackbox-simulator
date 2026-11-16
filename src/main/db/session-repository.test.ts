import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- mock better-sqlite3 before importing the module under test ---
const mockRun = vi.fn()
const mockGet = vi.fn()
const mockPrepare = vi.fn()

vi.mock('better-sqlite3', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      prepare: mockPrepare,
      pragma: vi.fn(),
    })),
  }
})

// mock electron so getDatabase() can import without crashing
vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('/tmp/test-data') },
}))

// mock fs.mkdirSync so we don't touch the filesystem
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return { ...actual, mkdirSync: vi.fn() }
})

// --- helpers ---

function makeMockDb() {
  mockPrepare.mockReturnValue({ run: mockRun, get: mockGet })
}

// import under test AFTER mocks are set up
import { criarSessao, buscarSessaoAtiva } from './session-repository'

describe('sessionRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    makeMockDb()
  })

  describe('criarSessao', () => {
    it('deve inserir sessão com status ativa e encerradaEm null', () => {
      const dados = {
        iniciadaEm: '2024-01-01T00:00:00.000Z',
        encerradaEm: null as null,
        aeronave: '',
        aerodromoOrigem: null as null,
        aerodromoDestino: null as null,
        status: 'ativa' as const,
      }

      const resultado = criarSessao(dados)

      expect(mockRun).toHaveBeenCalledOnce()
      const runArg = mockRun.mock.calls[0][0] as Record<string, unknown>
      expect(runArg.status).toBe('ativa')
      expect(runArg.encerradaEm).toBeNull()
      expect(resultado.status).toBe('ativa')
      expect(resultado.encerradaEm).toBeNull()
      expect(resultado.id).toBeTruthy()
    })

    it('deve retornar o objeto completo com o id gerado', () => {
      const dados = {
        iniciadaEm: '2024-06-01T10:00:00.000Z',
        encerradaEm: null as null,
        aeronave: 'Cessna 172',
        aerodromoOrigem: 'SBSP',
        aerodromoDestino: null as null,
        status: 'ativa' as const,
      }

      const resultado = criarSessao(dados)

      expect(typeof resultado.id).toBe('string')
      expect(resultado.id.length).toBeGreaterThan(0)
      expect(resultado.iniciadaEm).toBe(dados.iniciadaEm)
    })
  })

  describe('buscarSessaoAtiva', () => {
    it('deve retornar null quando não há sessão ativa', () => {
      mockGet.mockReturnValueOnce(undefined)
      const resultado = buscarSessaoAtiva()
      expect(resultado).toBeNull()
    })

    it('deve retornar a sessão ativa mapeada quando encontrada', () => {
      mockGet.mockReturnValueOnce({
        id: 'abc-123',
        iniciada_em: '2024-01-01T00:00:00.000Z',
        encerrada_em: null,
        aeronave: '',
        aerodromo_origem: null,
        aerodromo_destino: null,
        status: 'ativa',
      })

      const resultado = buscarSessaoAtiva()

      expect(resultado).not.toBeNull()
      expect(resultado!.id).toBe('abc-123')
      expect(resultado!.status).toBe('ativa')
      expect(resultado!.encerradaEm).toBeNull()
    })
  })
})
