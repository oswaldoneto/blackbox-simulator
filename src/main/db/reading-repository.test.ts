import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- mocks ---
const mockRun = vi.fn()
const mockGet = vi.fn()
const mockPrepare = vi.fn().mockReturnValue({ run: mockRun, get: mockGet })

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

import { inserirLeitura, buscarUltimaLeituraEm, agruparEmSeries } from './reading-repository'
import { PARAMETER_IDS } from '../../shared/parameter-ids'

describe('readingRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrepare.mockReturnValue({ run: mockRun, get: mockGet })
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

  // --- UC-003: hora da última leitura (SQL real em session-repository-sqlite.test.ts) ---

  describe('buscarUltimaLeituraEm', () => {
    it('deve buscar MAX(timestamp) das leituras da sessão pedida', () => {
      mockGet.mockReturnValueOnce({ ultima: '2024-01-01T00:10:00.000Z' })

      expect(buscarUltimaLeituraEm('sessao-1')).toBe('2024-01-01T00:10:00.000Z')
      const sql = mockPrepare.mock.calls[0][0] as string
      expect(sql).toContain('MAX(timestamp)')
      expect(sql).toContain('leituras_de_parametro')
      expect(mockGet).toHaveBeenCalledWith({ sessaoId: 'sessao-1' })
    })

    it('deve devolver null quando a sessão não tem leitura', () => {
      mockGet.mockReturnValueOnce({ ultima: null })
      expect(buscarUltimaLeituraEm('sem-leituras')).toBeNull()
    })

    it('deve devolver null quando a consulta não devolve linha', () => {
      mockGet.mockReturnValueOnce(undefined)
      expect(buscarUltimaLeituraEm('x')).toBeNull()
    })
  })

  // --- UC-005 (CA-005-1): agrupamento das leituras do voo (SQL real em session-repository-sqlite.test.ts) ---

  describe('agruparEmSeries', () => {
    const T1 = '2026-11-17T10:00:01.000Z'
    const T2 = '2026-11-17T10:00:02.000Z'

    it('deve devolver lista vazia sem linhas', () => {
      expect(agruparEmSeries('s', [])).toEqual([])
    })

    it('deve agrupar em colunas por parâmetro, com instantes em ms UTC e a ordem das linhas', () => {
      const series = agruparEmSeries('s', [
        { parametro_id: PARAMETER_IDS.PITCH, timestamp: T1, valor: -2 },
        { parametro_id: PARAMETER_IDS.ALTITUDE_MSL, timestamp: T1, valor: 1000 },
        { parametro_id: PARAMETER_IDS.PITCH, timestamp: T2, valor: -3 },
        { parametro_id: PARAMETER_IDS.ALTITUDE_MSL, timestamp: T2, valor: 1010 },
      ])

      expect(series).toEqual([
        {
          parametroId: PARAMETER_IDS.ALTITUDE_MSL,
          instantes: [Date.parse(T1), Date.parse(T2)],
          valores: [1000, 1010],
        },
        {
          parametroId: PARAMETER_IDS.PITCH,
          instantes: [Date.parse(T1), Date.parse(T2)],
          valores: [-2, -3],
        },
      ])
    })

    it('deve ordenar as séries pela ordem de TODOS_PARAMETER_IDS e não gerar série sem leitura', () => {
      const series = agruparEmSeries('s', [
        { parametro_id: PARAMETER_IDS.FLAPS, timestamp: T1, valor: 10 },
        { parametro_id: PARAMETER_IDS.LATITUDE, timestamp: T1, valor: -23.5 },
        { parametro_id: PARAMETER_IDS.AIRSPEED_IAS, timestamp: T1, valor: 90 },
      ])

      expect(series.map((x) => x.parametroId)).toEqual([
        PARAMETER_IDS.AIRSPEED_IAS,
        PARAMETER_IDS.LATITUDE,
        PARAMETER_IDS.FLAPS,
      ])
    })

    it('deve descartar slug desconhecido com um único log por slug', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

      const series = agruparEmSeries('s-1', [
        { parametro_id: 'fuel_qty', timestamp: T1, valor: 1 },
        { parametro_id: 'fuel_qty', timestamp: T2, valor: 2 },
        { parametro_id: PARAMETER_IDS.BANK, timestamp: T1, valor: 5 },
      ])

      expect(series).toEqual([
        { parametroId: PARAMETER_IDS.BANK, instantes: [Date.parse(T1)], valores: [5] },
      ])
      expect(consoleError).toHaveBeenCalledTimes(1)
      expect(consoleError.mock.calls[0][0]).toContain('s-1')
      expect(consoleError.mock.calls[0][1]).toBe('fuel_qty')
      consoleError.mockRestore()
    })

    it('deve descartar timestamp inválido com log', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

      const series = agruparEmSeries('s', [
        { parametro_id: PARAMETER_IDS.RPM_1, timestamp: 'não é data', valor: 1 },
        { parametro_id: PARAMETER_IDS.RPM_1, timestamp: T2, valor: 2300 },
      ])

      expect(series).toEqual([
        { parametroId: PARAMETER_IDS.RPM_1, instantes: [Date.parse(T2)], valores: [2300] },
      ])
      expect(consoleError).toHaveBeenCalledOnce()
      consoleError.mockRestore()
    })
  })
})
