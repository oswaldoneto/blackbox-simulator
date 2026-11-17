import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- mock better-sqlite3 before importing the module under test ---
const mockRun = vi.fn()
const mockGet = vi.fn()
const mockAll = vi.fn()
const mockPrepare = vi.fn()

const mockTransaction = vi.fn((fn: () => unknown) => () => fn())

vi.mock('better-sqlite3', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      prepare: mockPrepare,
      pragma: vi.fn(),
      transaction: mockTransaction,
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
  mockPrepare.mockReturnValue({ run: mockRun, get: mockGet, all: mockAll })
}

// import under test AFTER mocks are set up
import {
  criarSessao,
  buscarSessaoAtiva,
  encerrarSessao,
  encerrarSessoesAtivasAnteriores,
  listarSessoesEncerradas,
} from './session-repository'

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
        parametrosNaoAplicaveis: [],
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
        parametrosNaoAplicaveis: [],
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
        parametros_nao_aplicaveis: '[]',
      })

      const resultado = buscarSessaoAtiva()

      expect(resultado).not.toBeNull()
      expect(resultado!.id).toBe('abc-123')
      expect(resultado!.status).toBe('ativa')
      expect(resultado!.encerradaEm).toBeNull()
      expect(resultado!.parametrosNaoAplicaveis).toEqual([])
    })
  })

  // --- UC-006 / RN-007: lista de parâmetros N/A gravada na sessão ---

  describe('parametrosNaoAplicaveis', () => {
    const DADOS_BASE = {
      iniciadaEm: '2024-01-01T00:00:00.000Z',
      encerradaEm: null as null,
      aeronave: '',
      aerodromoOrigem: null as null,
      aerodromoDestino: null as null,
      status: 'ativa' as const,
    }

    const ROW_BASE = {
      id: 'abc-123',
      iniciada_em: '2024-01-01T00:00:00.000Z',
      encerrada_em: null,
      aeronave: '',
      aerodromo_origem: null,
      aerodromo_destino: null,
      status: 'ativa',
    }

    it('deve gravar a lista em JSON na coluna parametros_nao_aplicaveis', () => {
      const resultado = criarSessao({
        ...DADOS_BASE,
        parametrosNaoAplicaveis: ['mixture_1', 'flaps'],
      })

      const sql = mockPrepare.mock.calls[0][0] as string
      expect(sql).toContain('parametros_nao_aplicaveis')
      const runArg = mockRun.mock.calls[0][0] as Record<string, unknown>
      expect(runArg.parametrosNaoAplicaveis).toBe('["mixture_1","flaps"]')
      expect(resultado.parametrosNaoAplicaveis).toEqual(['mixture_1', 'flaps'])
    })

    it('deve gravar "[]" quando nenhum parâmetro é N/A', () => {
      criarSessao({ ...DADOS_BASE, parametrosNaoAplicaveis: [] })

      const runArg = mockRun.mock.calls[0][0] as Record<string, unknown>
      expect(runArg.parametrosNaoAplicaveis).toBe('[]')
    })

    it('deve ler a lista JSON da sessão ativa', () => {
      mockGet.mockReturnValueOnce({ ...ROW_BASE, parametros_nao_aplicaveis: '["flaps"]' })

      expect(buscarSessaoAtiva()!.parametrosNaoAplicaveis).toEqual(['flaps'])
    })

    it('deve devolver lista vazia e logar quando o JSON é inválido', () => {
      const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockGet.mockReturnValueOnce({ ...ROW_BASE, parametros_nao_aplicaveis: '{nao-e-json' })

      expect(buscarSessaoAtiva()!.parametrosNaoAplicaveis).toEqual([])
      expect(erro).toHaveBeenCalled()
      erro.mockRestore()
    })

    it('deve devolver lista vazia e logar quando o JSON não é uma lista', () => {
      const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockGet.mockReturnValueOnce({ ...ROW_BASE, parametros_nao_aplicaveis: '{"flaps":true}' })

      expect(buscarSessaoAtiva()!.parametrosNaoAplicaveis).toEqual([])
      expect(erro).toHaveBeenCalled()
      erro.mockRestore()
    })

    it('deve descartar com log os itens que não são parâmetros conhecidos', () => {
      const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockGet.mockReturnValueOnce({
        ...ROW_BASE,
        parametros_nao_aplicaveis: '["mixture_1","desconhecido",42]',
      })

      expect(buscarSessaoAtiva()!.parametrosNaoAplicaveis).toEqual(['mixture_1'])
      expect(erro).toHaveBeenCalledTimes(2)
      erro.mockRestore()
    })
  })

  // --- UC-003: encerramento (SQL real em session-repository-sqlite.test.ts) ---

  describe('encerrarSessao', () => {
    const ROW_ENCERRADA = {
      id: 'abc-123',
      iniciada_em: '2024-01-01T00:00:00.000Z',
      encerrada_em: '2024-01-01T01:00:00.000Z',
      aeronave: '',
      aerodromo_origem: null,
      aerodromo_destino: null,
      status: 'encerrada',
      parametros_nao_aplicaveis: '[]',
    }

    it('deve gravar status e encerradaEm só de sessão ativa e devolver a sessão gravada', () => {
      mockRun.mockReturnValueOnce({ changes: 1 })
      mockGet.mockReturnValueOnce(ROW_ENCERRADA)

      const sessao = encerrarSessao('abc-123', '2024-01-01T01:00:00.000Z')

      const sql = mockPrepare.mock.calls[0][0] as string
      expect(sql).toContain("status = 'encerrada'")
      expect(sql).toContain("status = 'ativa'")
      expect(mockRun).toHaveBeenCalledWith({ id: 'abc-123', encerradaEm: '2024-01-01T01:00:00.000Z' })
      expect(sessao.status).toBe('encerrada')
      expect(sessao.encerradaEm).toBe('2024-01-01T01:00:00.000Z')
    })

    it('deve lançar erro quando nenhuma linha muda', () => {
      mockRun.mockReturnValueOnce({ changes: 0 })
      expect(() => encerrarSessao('x', '2024-01-01T01:00:00.000Z')).toThrow()
    })

    it('deve lançar erro quando mais de uma linha muda', () => {
      mockRun.mockReturnValueOnce({ changes: 2 })
      expect(() => encerrarSessao('x', '2024-01-01T01:00:00.000Z')).toThrow()
    })

    it('deve lançar erro quando a sessão some depois do UPDATE', () => {
      mockRun.mockReturnValueOnce({ changes: 1 })
      mockGet.mockReturnValueOnce(undefined)
      expect(() => encerrarSessao('x', '2024-01-01T01:00:00.000Z')).toThrow()
    })
  })

  describe('encerrarSessoesAtivasAnteriores', () => {
    it('deve rodar numa transação e devolver quantas sessões encerrou', () => {
      mockRun.mockReturnValueOnce({ changes: 3 })

      expect(encerrarSessoesAtivasAnteriores()).toBe(3)
      expect(mockTransaction).toHaveBeenCalledOnce()
    })
  })

  // --- UC-004: lista de voos (SQL real em session-repository-sqlite.test.ts) ---

  describe('listarSessoesEncerradas', () => {
    const ROW = {
      id: 'v1',
      iniciada_em: '2024-01-02T10:00:00.000Z',
      encerrada_em: '2024-01-02T11:00:00.000Z',
      aeronave: '',
      aerodromo_origem: null,
      aerodromo_destino: null,
      status: 'encerrada',
      parametros_nao_aplicaveis: '["flaps"]',
    }

    it('deve filtrar por status encerrada e ordenar por iniciada_em DESC com desempate por rowid DESC', () => {
      mockAll.mockReturnValueOnce([])

      listarSessoesEncerradas()

      const sql = mockPrepare.mock.calls[0][0] as string
      expect(sql).toContain("status = 'encerrada'")
      expect(sql.replace(/\s+/g, ' ')).toContain('ORDER BY iniciada_em DESC, rowid DESC')
    })

    it('deve devolver lista vazia quando não há sessões encerradas', () => {
      mockAll.mockReturnValueOnce([])
      expect(listarSessoesEncerradas()).toEqual([])
    })

    it('deve mapear as linhas para Sessao na ordem devolvida pelo banco', () => {
      mockAll.mockReturnValueOnce([ROW, { ...ROW, id: 'v0', iniciada_em: '2024-01-01T10:00:00.000Z' }])

      const lista = listarSessoesEncerradas()

      expect(lista.map((s) => s.id)).toEqual(['v1', 'v0'])
      expect(lista[0]).toEqual({
        id: 'v1',
        iniciadaEm: '2024-01-02T10:00:00.000Z',
        encerradaEm: '2024-01-02T11:00:00.000Z',
        aeronave: '',
        aerodromoOrigem: null,
        aerodromoDestino: null,
        status: 'encerrada',
        parametrosNaoAplicaveis: ['flaps'],
      })
    })
  })
})
