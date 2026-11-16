import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- mocks ---
const mockRun = vi.fn()
const mockPrepare = vi.fn().mockReturnValue({ run: mockRun })

vi.mock('better-sqlite3', () => ({
  default: vi.fn().mockImplementation(() => ({
    prepare: mockPrepare,
    pragma: vi.fn(),
  })),
}))

vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('/tmp/test-data') },
}))

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return { ...actual, mkdirSync: vi.fn() }
})

import { inserirLeitura } from './reading-repository'

describe('readingRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrepare.mockReturnValue({ run: mockRun })
  })

  describe('inserirLeitura', () => {
    it('deve inserir leitura associada ao sessaoId correto', () => {
      const leitura = {
        sessaoId: 'sessao-999',
        parametroId: 'altitude_msl',
        timestamp: '2024-01-01T00:00:01.000Z',
        valor: 1500,
      }

      inserirLeitura(leitura)

      expect(mockRun).toHaveBeenCalledOnce()
      const arg = mockRun.mock.calls[0][0] as Record<string, unknown>
      expect(arg.sessaoId).toBe('sessao-999')
      expect(arg.parametroId).toBe('altitude_msl')
      expect(arg.timestamp).toBe('2024-01-01T00:00:01.000Z')
      expect(arg.valor).toBe(1500)
    })

    it('deve chamar prepare com o SQL de INSERT correto', () => {
      inserirLeitura({
        sessaoId: 'sid',
        parametroId: 'pitch',
        timestamp: '2024-01-01T00:00:00.000Z',
        valor: 3.5,
      })

      const sql = mockPrepare.mock.calls[0][0] as string
      expect(sql).toContain('INSERT INTO leituras_de_parametro')
      expect(sql).toContain('sessao_id')
      expect(sql).toContain('parametro_id')
    })
  })
})
