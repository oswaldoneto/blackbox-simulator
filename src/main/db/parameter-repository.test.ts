import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAll, mockPrepare, mockExec, mockPragma } = vi.hoisted(() => ({
  mockAll: vi.fn(),
  mockPrepare: vi.fn(),
  mockExec: vi.fn(),
  mockPragma: vi.fn(),
}))

vi.mock('better-sqlite3', () => ({
  default: vi.fn().mockImplementation(() => ({
    prepare: mockPrepare,
    exec: mockExec,
    pragma: mockPragma,
  })),
}))

vi.mock('electron', () => ({
  app: { getPath: vi.fn().mockReturnValue('/tmp/test-data') },
}))

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return { ...actual, mkdirSync: vi.fn() }
})

import { buscarParametrosAtivos } from './parameter-repository'

describe('parameterRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrepare.mockReturnValue({ all: mockAll })
  })

  describe('buscarParametrosAtivos', () => {
    it('deve retornar lista vazia quando não há parâmetros ativos', () => {
      mockAll.mockReturnValueOnce([])
      const resultado = buscarParametrosAtivos()
      expect(resultado).toEqual([])
    })

    it('deve mapear rows para ParametroDeVoo com ativo = true', () => {
      mockAll.mockReturnValueOnce([
        { id: 'altitude_msl', nome: 'Altitude MSL', unidade: 'ft', ativo: 1 },
        { id: 'airspeed_ias', nome: 'Velocidade IAS', unidade: 'kt', ativo: 1 },
      ])

      const resultado = buscarParametrosAtivos()

      expect(resultado).toHaveLength(2)
      expect(resultado[0].ativo).toBe(true)
      expect(resultado[1].ativo).toBe(true)
      expect(resultado[0].id).toBe('altitude_msl')
    })

    it('deve filtrar apenas parâmetros com ativo = 1 via SQL (prepare usa WHERE ativo = 1)', () => {
      mockAll.mockReturnValueOnce([])
      buscarParametrosAtivos()
      const sql = mockPrepare.mock.calls[0][0] as string
      expect(sql).toContain('WHERE ativo = 1')
    })
  })
})
