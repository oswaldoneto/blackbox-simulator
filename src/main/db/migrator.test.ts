import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockExec, mockPrepare, mockTransaction, mockReaddirSync, mockReadFileSync, mockRegistrar } =
  vi.hoisted(() => ({
    mockExec: vi.fn(),
    mockPrepare: vi.fn(),
    mockTransaction: vi.fn(),
    mockReaddirSync: vi.fn(),
    mockReadFileSync: vi.fn(),
    mockRegistrar: vi.fn(),
  }))

vi.mock('./database', () => ({
  getDatabase: () => ({
    exec: mockExec,
    prepare: mockPrepare,
    transaction: mockTransaction,
  }),
}))

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    readdirSync: mockReaddirSync,
    readFileSync: mockReadFileSync,
  }
})

import { runMigrations } from './migrator'

const SQL_001 = '-- sql 001'
const SQL_002 = '-- sql 002'

/** Versões já registradas em schema_migrations no banco simulado. */
let registradas: string[] = []

function sqlsExecutados(): string[] {
  return mockExec.mock.calls.map((c) => c[0] as string).filter((sql) => sql.startsWith('-- sql'))
}

function versoesRegistradas(): string[] {
  return mockRegistrar.mock.calls.map((c) => (c[0] as { versao: string }).versao)
}

describe('migrator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registradas = []

    mockExec.mockReset()
    mockReaddirSync.mockReturnValue(['002-ampliar-parametros.sql', '001-initial.sql'])
    mockReadFileSync.mockImplementation((arquivo: string) =>
      String(arquivo).endsWith('001-initial.sql') ? SQL_001 : SQL_002
    )
    mockPrepare.mockImplementation((sql: string) => {
      if (sql.startsWith('SELECT')) {
        return { all: () => registradas.map((versao) => ({ versao })) }
      }
      return { run: mockRegistrar }
    })
    // Transação simulada: executa a função; se ela lançar, o erro sobe.
    mockTransaction.mockImplementation((fn: () => void) => () => fn())
  })

  describe('runMigrations', () => {
    it('deve criar a tabela schema_migrations se ela não existir', () => {
      runMigrations()

      const primeiro = mockExec.mock.calls[0][0] as string
      expect(primeiro).toContain('CREATE TABLE IF NOT EXISTS schema_migrations')
    })

    it('deve aplicar 001 e 002 em ordem de nome num banco novo e registrar as duas', () => {
      runMigrations()

      expect(sqlsExecutados()).toEqual([SQL_001, SQL_002])
      expect(versoesRegistradas()).toEqual(['001-initial.sql', '002-ampliar-parametros.sql'])
      mockRegistrar.mock.calls.forEach((c) => {
        const { aplicadaEm } = c[0] as { aplicadaEm: string }
        expect(Number.isNaN(Date.parse(aplicadaEm))).toBe(false)
      })
    })

    it('deve rodar cada migration numa transação própria', () => {
      runMigrations()

      expect(mockTransaction).toHaveBeenCalledTimes(2)
    })

    it('deve pular as versões já registradas', () => {
      registradas = ['001-initial.sql']

      runMigrations()

      expect(sqlsExecutados()).toEqual([SQL_002])
      expect(versoesRegistradas()).toEqual(['002-ampliar-parametros.sql'])
    })

    it('não deve aplicar nada quando todas as versões já estão registradas', () => {
      registradas = ['001-initial.sql', '002-ampliar-parametros.sql']

      runMigrations()

      expect(sqlsExecutados()).toEqual([])
      expect(mockRegistrar).not.toHaveBeenCalled()
    })

    it('deve rodar a 001 e depois a 002 num banco do loop-002, sem schema_migrations', () => {
      // Banco antigo: a tabela de controle acabou de ser criada e está vazia.
      registradas = []

      runMigrations()

      expect(sqlsExecutados()).toEqual([SQL_001, SQL_002])
      expect(versoesRegistradas()).toEqual(['001-initial.sql', '002-ampliar-parametros.sql'])
    })

    it('não deve registrar a versão que falhou, deve propagar o erro e parar nas seguintes', () => {
      const erroLog = vi.spyOn(console, 'error').mockImplementation(() => {})
      const falha = new Error('SQL inválido')
      mockExec.mockImplementation((sql: string) => {
        if (sql === SQL_001) throw falha
      })

      expect(() => runMigrations()).toThrow(falha)

      expect(mockRegistrar).not.toHaveBeenCalled()
      expect(sqlsExecutados()).toEqual([SQL_001])
      expect(erroLog).toHaveBeenCalled()
      erroLog.mockRestore()
    })

    it('deve ignorar arquivos que não terminam em .sql', () => {
      mockReaddirSync.mockReturnValue(['001-initial.sql', 'LEIAME.md', '.DS_Store'])

      runMigrations()

      expect(versoesRegistradas()).toEqual(['001-initial.sql'])
      expect(mockReadFileSync).toHaveBeenCalledOnce()
    })
  })
})
