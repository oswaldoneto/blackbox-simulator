import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockExec, mockPragma, mockPrepare } = vi.hoisted(() => ({
  mockExec: vi.fn(),
  mockPragma: vi.fn(),
  mockPrepare: vi.fn(),
}))

vi.mock('better-sqlite3', () => ({
  default: vi.fn().mockImplementation(() => ({
    exec: mockExec,
    pragma: mockPragma,
    prepare: mockPrepare,
  })),
}))

vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('/tmp/test-data') },
}))

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    mkdirSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue('CREATE TABLE IF NOT EXISTS sessoes (id TEXT);'),
  }
})

import { runMigrations } from './migrator'

describe('migrator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('runMigrations', () => {
    it('deve chamar db.exec com o conteúdo do arquivo SQL de migração', () => {
      runMigrations()
      expect(mockExec).toHaveBeenCalledOnce()
      const sql = mockExec.mock.calls[0][0] as string
      expect(typeof sql).toBe('string')
      expect(sql.length).toBeGreaterThan(0)
    })
  })
})
