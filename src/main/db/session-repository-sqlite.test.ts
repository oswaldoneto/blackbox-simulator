/**
 * Teste real do SQL do repositório de sessões (UC-003) com o SQLite nativo do Node
 * (`node:sqlite`), como em `migrator-sqlite.test.ts`: o better-sqlite3 do projeto é
 * recompilado para o Node do Electron e não carrega no Vitest. O banco em memória é
 * embrulhado na parte da API do better-sqlite3 que o código usa (exec, prepare,
 * transaction) e montado pelas migrations reais.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DatabaseSync } from 'node:sqlite'

type NodeSqlite = typeof import('node:sqlite')
type Parametros = Record<string, string | number | null>

function carregarNodeSqlite(): NodeSqlite | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('node:sqlite') as NodeSqlite
  } catch {
    return null
  }
}

const nodeSqlite = carregarNodeSqlite()

const { banco } = vi.hoisted(() => ({
  banco: { atual: null as unknown },
}))

vi.mock('./database', () => ({
  getDatabase: () => banco.atual,
}))

import { runMigrations } from './migrator'
import {
  criarSessao,
  buscarSessaoAtiva,
  encerrarSessao,
  encerrarSessoesAtivasAnteriores,
  listarSessoesEncerradas,
  buscarSessaoPorId,
} from './session-repository'
import { inserirLeitura, buscarUltimaLeituraEm, listarLeiturasDoVoo } from './reading-repository'
import { PARAMETER_IDS } from '../../shared/parameter-ids'
import type { Sessao } from '../../shared/types'

/** Adaptador mínimo da API do better-sqlite3 sobre o `DatabaseSync` do Node. */
function adaptar(db: DatabaseSync): unknown {
  return {
    exec: (sql: string) => db.exec(sql),
    prepare: (sql: string) => {
      const stmt = db.prepare(sql)
      return {
        all: (params?: Parametros) => (params === undefined ? stmt.all() : stmt.all(params)),
        get: (params?: Parametros) => (params === undefined ? stmt.get() : stmt.get(params)),
        run: (params?: Parametros) => (params === undefined ? stmt.run() : stmt.run(params)),
      }
    },
    transaction:
      <T,>(fn: () => T) =>
      (): T => {
        db.exec('BEGIN')
        try {
          const resultado = fn()
          db.exec('COMMIT')
          return resultado
        } catch (err) {
          db.exec('ROLLBACK')
          throw err
        }
      },
  }
}

function dadosDeSessao(overrides: Partial<Omit<Sessao, 'id'>> = {}): Omit<Sessao, 'id'> {
  return {
    iniciadaEm: '2026-11-17T10:00:00.000Z',
    encerradaEm: null,
    aeronave: '',
    aerodromoOrigem: null,
    aerodromoDestino: null,
    status: 'ativa',
    parametrosNaoAplicaveis: [],
    ...overrides,
  }
}

describe.skipIf(nodeSqlite === null)('sessionRepository com SQLite real (node:sqlite)', () => {
  let db: DatabaseSync

  interface LinhaSessao {
    id: string
    status: string
    encerrada_em: string | null
  }

  function linha(id: string): LinhaSessao {
    return {
      ...(db.prepare(`SELECT id, status, encerrada_em FROM sessoes WHERE id = ?`).get(id) as
        | LinhaSessao
        | undefined),
    } as LinhaSessao
  }

  function contarLeituras(sessaoId: string): number {
    return (
      db
        .prepare(`SELECT COUNT(*) AS n FROM leituras_de_parametro WHERE sessao_id = ?`)
        .get(sessaoId) as { n: number }
    ).n
  }

  function inserirSessaoBruta(id: string, iniciadaEm: string, status: string): void {
    db.prepare(`INSERT INTO sessoes (id, iniciada_em, status) VALUES (?, ?, ?)`).run(
      id,
      iniciadaEm,
      status
    )
  }

  function gravarLeituras(sessaoId: string, timestamps: string[]): void {
    for (const timestamp of timestamps) {
      inserirLeitura({ sessaoId, parametroId: 'altitude_msl', timestamp, valor: 1000 })
    }
  }

  beforeEach(() => {
    db = new nodeSqlite!.DatabaseSync(':memory:')
    db.exec('PRAGMA foreign_keys = ON')
    banco.atual = adaptar(db)
    runMigrations()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    db.close()
  })

  describe('encerrarSessao', () => {
    it('deve gravar status encerrada e a hora de fim e devolver a sessão gravada', () => {
      const criada = criarSessao(dadosDeSessao({ parametrosNaoAplicaveis: ['flaps'] }))

      const encerrada = encerrarSessao(criada.id, '2026-11-17T11:30:00.000Z')

      expect(encerrada).toEqual({
        ...criada,
        status: 'encerrada',
        encerradaEm: '2026-11-17T11:30:00.000Z',
      })
      expect(linha(criada.id)).toEqual({
        id: criada.id,
        status: 'encerrada',
        encerrada_em: '2026-11-17T11:30:00.000Z',
      })
    })

    it('deve preservar as leituras da sessão, inclusive as gravadas depois da hora de fim', () => {
      const criada = criarSessao(dadosDeSessao())
      gravarLeituras(criada.id, [
        '2026-11-17T10:00:01.000Z',
        '2026-11-17T10:00:02.000Z',
        '2026-11-17T10:00:20.000Z', // espera de 15 s, depois do fim
      ])

      encerrarSessao(criada.id, '2026-11-17T10:00:05.000Z')

      expect(contarLeituras(criada.id)).toBe(3)
    })

    it('deve permitir calcular a duração (encerradaEm − iniciadaEm) com o que foi gravado', () => {
      const criada = criarSessao(dadosDeSessao({ iniciadaEm: '2026-11-17T10:00:00.000Z' }))

      const encerrada = encerrarSessao(criada.id, '2026-11-17T11:15:30.000Z')

      expect(Date.parse(encerrada.encerradaEm!) - Date.parse(encerrada.iniciadaEm)).toBe(
        (75 * 60 + 30) * 1000
      )
    })

    it('deve lançar erro e não mudar nada quando a sessão já está encerrada', () => {
      const criada = criarSessao(dadosDeSessao())
      encerrarSessao(criada.id, '2026-11-17T11:00:00.000Z')

      expect(() => encerrarSessao(criada.id, '2026-11-17T12:00:00.000Z')).toThrow()
      expect(linha(criada.id).encerrada_em).toBe('2026-11-17T11:00:00.000Z')
    })

    it('deve lançar erro quando a sessão não existe', () => {
      expect(() => encerrarSessao('inexistente', '2026-11-17T11:00:00.000Z')).toThrow()
    })

    it('deve mudar só a sessão pedida', () => {
      const a = criarSessao(dadosDeSessao())
      const b = criarSessao(dadosDeSessao({ iniciadaEm: '2026-11-17T09:00:00.000Z' }))

      encerrarSessao(a.id, '2026-11-17T11:00:00.000Z')

      expect(linha(b.id)).toEqual({ id: b.id, status: 'ativa', encerrada_em: null })
    })

    it('deve tirar a sessão de buscarSessaoAtiva', () => {
      const criada = criarSessao(dadosDeSessao())

      encerrarSessao(criada.id, '2026-11-17T11:00:00.000Z')

      expect(buscarSessaoAtiva()).toBeNull()
    })
  })

  describe('buscarSessaoAtiva', () => {
    it('deve devolver null sem sessão ativa', () => {
      inserirSessaoBruta('enc', '2026-11-17T10:00:00.000Z', 'encerrada')
      expect(buscarSessaoAtiva()).toBeNull()
    })

    it('deve devolver a ativa mais recente por iniciada_em, independente da ordem de inserção', () => {
      inserirSessaoBruta('meio', '2026-11-12T10:00:00.000Z', 'ativa')
      inserirSessaoBruta('recente', '2026-11-15T10:00:00.000Z', 'ativa')
      inserirSessaoBruta('antiga', '2026-11-01T10:00:00.000Z', 'ativa')
      inserirSessaoBruta('encerrada-mais-nova', '2026-11-16T10:00:00.000Z', 'encerrada')

      expect(buscarSessaoAtiva()!.id).toBe('recente')
    })

    it('deve desempatar pela ordem de inserção quando iniciada_em é igual', () => {
      inserirSessaoBruta('primeira', '2026-11-15T10:00:00.000Z', 'ativa')
      inserirSessaoBruta('segunda', '2026-11-15T10:00:00.000Z', 'ativa')

      expect(buscarSessaoAtiva()!.id).toBe('segunda')
    })
  })

  describe('buscarUltimaLeituraEm', () => {
    it('deve devolver o maior timestamp das leituras da sessão', () => {
      const a = criarSessao(dadosDeSessao())
      const b = criarSessao(dadosDeSessao())
      gravarLeituras(a.id, [
        '2026-11-17T10:00:03.000Z',
        '2026-11-17T10:00:09.000Z',
        '2026-11-17T10:00:05.000Z',
      ])
      gravarLeituras(b.id, ['2026-11-17T12:00:00.000Z'])

      expect(buscarUltimaLeituraEm(a.id)).toBe('2026-11-17T10:00:09.000Z')
    })

    it('deve devolver null quando a sessão não tem leitura', () => {
      const a = criarSessao(dadosDeSessao())
      expect(buscarUltimaLeituraEm(a.id)).toBeNull()
    })

    it('deve devolver null para sessão inexistente', () => {
      expect(buscarUltimaLeituraEm('inexistente')).toBeNull()
    })
  })

  describe('encerrarSessoesAtivasAnteriores', () => {
    /**
     * Banco com várias ativas das versões v0.1.0 a v0.3.0:
     * - 'antiga-com-leituras' (ativa, com leituras)
     * - 'antiga-sem-leituras' (ativa, sem leitura)
     * - 'encerrada' (já encerrada, com hora de fim própria)
     * - 'recente' (ativa mais recente, com leituras)
     */
    function montarBancoComOrfas(): void {
      inserirSessaoBruta('antiga-com-leituras', '2026-11-01T10:00:00.000Z', 'ativa')
      inserirSessaoBruta('antiga-sem-leituras', '2026-11-05T10:00:00.000Z', 'ativa')
      inserirSessaoBruta('encerrada', '2026-11-06T10:00:00.000Z', 'encerrada')
      db.prepare(`UPDATE sessoes SET encerrada_em = ? WHERE id = 'encerrada'`).run(
        '2026-11-06T11:00:00.000Z'
      )
      inserirSessaoBruta('recente', '2026-11-10T10:00:00.000Z', 'ativa')

      gravarLeituras('antiga-com-leituras', [
        '2026-11-01T10:00:01.000Z',
        '2026-11-01T10:42:17.000Z',
        '2026-11-01T10:20:00.000Z',
      ])
      gravarLeituras('encerrada', ['2026-11-06T10:59:59.000Z'])
      gravarLeituras('recente', ['2026-11-10T10:30:00.000Z'])
    }

    it('deve encerrar todas as ativas menos a mais recente e devolver quantas encerrou', () => {
      montarBancoComOrfas()

      expect(encerrarSessoesAtivasAnteriores()).toBe(2)

      expect(linha('antiga-com-leituras').status).toBe('encerrada')
      expect(linha('antiga-sem-leituras').status).toBe('encerrada')
      expect(linha('recente')).toEqual({ id: 'recente', status: 'ativa', encerrada_em: null })
    })

    it('deve usar a última leitura como hora de fim', () => {
      montarBancoComOrfas()
      encerrarSessoesAtivasAnteriores()

      expect(linha('antiga-com-leituras').encerrada_em).toBe('2026-11-01T10:42:17.000Z')
    })

    it('deve usar a hora de início como hora de fim na sessão sem leitura (duração 0)', () => {
      montarBancoComOrfas()
      encerrarSessoesAtivasAnteriores()

      expect(linha('antiga-sem-leituras').encerrada_em).toBe('2026-11-05T10:00:00.000Z')
    })

    it('não deve mudar a sessão já encerrada', () => {
      montarBancoComOrfas()
      encerrarSessoesAtivasAnteriores()

      expect(linha('encerrada')).toEqual({
        id: 'encerrada',
        status: 'encerrada',
        encerrada_em: '2026-11-06T11:00:00.000Z',
      })
    })

    it('deve preservar todas as leituras', () => {
      montarBancoComOrfas()
      encerrarSessoesAtivasAnteriores()

      expect(contarLeituras('antiga-com-leituras')).toBe(3)
      expect(contarLeituras('encerrada')).toBe(1)
      expect(contarLeituras('recente')).toBe(1)
    })

    it('deve deixar a mais recente para buscarSessaoAtiva (verificação na abertura)', () => {
      montarBancoComOrfas()
      encerrarSessoesAtivasAnteriores()

      expect(buscarSessaoAtiva()!.id).toBe('recente')
      expect(
        (db.prepare(`SELECT COUNT(*) AS n FROM sessoes WHERE status = 'ativa'`).get() as {
          n: number
        }).n
      ).toBe(1)
    })

    it('deve ser idempotente: a segunda execução não encerra nada nem muda horas de fim', () => {
      montarBancoComOrfas()
      encerrarSessoesAtivasAnteriores()
      const antes = db.prepare(`SELECT * FROM sessoes ORDER BY id`).all().map((r) => ({ ...r }))

      expect(encerrarSessoesAtivasAnteriores()).toBe(0)

      expect(db.prepare(`SELECT * FROM sessoes ORDER BY id`).all().map((r) => ({ ...r }))).toEqual(
        antes
      )
    })

    it('deve devolver 0 com uma única sessão ativa', () => {
      criarSessao(dadosDeSessao())
      expect(encerrarSessoesAtivasAnteriores()).toBe(0)
      expect(buscarSessaoAtiva()).not.toBeNull()
    })

    it('deve devolver 0 num banco sem sessões', () => {
      expect(encerrarSessoesAtivasAnteriores()).toBe(0)
    })

    it('deve encerrar a mais antiga de duas ativas com o mesmo início, deixando a última inserida', () => {
      inserirSessaoBruta('primeira', '2026-11-15T10:00:00.000Z', 'ativa')
      inserirSessaoBruta('segunda', '2026-11-15T10:00:00.000Z', 'ativa')

      expect(encerrarSessoesAtivasAnteriores()).toBe(1)
      expect(linha('primeira').status).toBe('encerrada')
      expect(linha('segunda').status).toBe('ativa')
    })

    it('deve funcionar sobre um banco do loop-003 migrado para a 003', () => {
      // Banco novo para simular a v0.3.0: 001 e 002 aplicadas, órfãs gravadas, depois a 003.
      db.close()
      db = new nodeSqlite!.DatabaseSync(':memory:')
      banco.atual = adaptar(db)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs') as typeof import('fs')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const path = require('path') as typeof import('path')
      const ler = (arquivo: string): string =>
        fs.readFileSync(path.join(__dirname, 'migrations', arquivo), 'utf-8')
      db.exec(ler('001-initial.sql'))
      db.exec(ler('002-ampliar-parametros.sql'))
      db.exec(
        `CREATE TABLE schema_migrations (versao TEXT PRIMARY KEY, aplicada_em TEXT NOT NULL);
         INSERT INTO schema_migrations VALUES
           ('001-initial.sql', '2026-11-10T10:00:00.000Z'),
           ('002-ampliar-parametros.sql', '2026-11-10T10:00:00.000Z');`
      )
      montarBancoComOrfas()

      runMigrations()
      expect(encerrarSessoesAtivasAnteriores()).toBe(2)

      expect(linha('antiga-com-leituras').encerrada_em).toBe('2026-11-01T10:42:17.000Z')
      expect(linha('antiga-sem-leituras').encerrada_em).toBe('2026-11-05T10:00:00.000Z')
      expect(buscarSessaoAtiva()!.id).toBe('recente')
    })
  })

  describe('listarSessoesEncerradas', () => {
    function encerrarBruta(id: string, encerradaEm: string): void {
      db.prepare(`UPDATE sessoes SET status = 'encerrada', encerrada_em = ? WHERE id = ?`).run(
        encerradaEm,
        id
      )
    }

    it('deve devolver lista vazia num banco sem sessões', () => {
      expect(listarSessoesEncerradas()).toEqual([])
    })

    it('deve devolver lista vazia quando só existe a sessão ativa', () => {
      criarSessao(dadosDeSessao())
      expect(listarSessoesEncerradas()).toEqual([])
    })

    it('deve trazer só as encerradas, nunca a ativa (nem a de falha de gravação ainda ativa)', () => {
      const enc = criarSessao(dadosDeSessao({ iniciadaEm: '2026-11-16T10:00:00.000Z' }))
      encerrarSessao(enc.id, '2026-11-16T11:00:00.000Z')
      // Falha ao gravar o encerramento: a sessão continua ativa no banco.
      inserirSessaoBruta('falha-gravacao', '2026-11-17T08:00:00.000Z', 'ativa')
      criarSessao(dadosDeSessao({ iniciadaEm: '2026-11-17T10:00:00.000Z' }))

      const lista = listarSessoesEncerradas()

      expect(lista.map((s) => s.id)).toEqual([enc.id])
      expect(lista[0]).toEqual({
        ...enc,
        status: 'encerrada',
        encerradaEm: '2026-11-16T11:00:00.000Z',
      })
    })

    it('deve ordenar por hora de início, da mais recente para a mais antiga, independente da inserção e do fim', () => {
      inserirSessaoBruta('meio', '2026-11-12T10:00:00.000Z', 'ativa')
      inserirSessaoBruta('recente', '2026-11-15T10:00:00.000Z', 'ativa')
      inserirSessaoBruta('antiga', '2026-11-01T10:00:00.000Z', 'ativa')
      encerrarBruta('meio', '2026-11-20T10:00:00.000Z') // fim mais tarde não muda a ordem
      encerrarBruta('recente', '2026-11-15T10:30:00.000Z')
      encerrarBruta('antiga', '2026-11-01T11:00:00.000Z')

      expect(listarSessoesEncerradas().map((s) => s.id)).toEqual(['recente', 'meio', 'antiga'])
    })

    it('deve desempatar pela ordem de gravação (a gravada por último antes) quando o início é igual', () => {
      inserirSessaoBruta('primeira', '2026-11-15T10:00:00.000Z', 'ativa')
      inserirSessaoBruta('segunda', '2026-11-15T10:00:00.000Z', 'ativa')
      inserirSessaoBruta('terceira', '2026-11-15T10:00:00.000Z', 'ativa')
      encerrarBruta('terceira', '2026-11-15T10:10:00.000Z')
      encerrarBruta('primeira', '2026-11-15T10:20:00.000Z')
      encerrarBruta('segunda', '2026-11-15T10:30:00.000Z')

      expect(listarSessoesEncerradas().map((s) => s.id)).toEqual(['terceira', 'segunda', 'primeira'])
    })

    it('deve incluir sessão curta e de duração 0', () => {
      const curta = criarSessao(dadosDeSessao({ iniciadaEm: '2026-11-17T10:00:00.000Z' }))
      encerrarSessao(curta.id, '2026-11-17T10:00:03.000Z')
      const zero = criarSessao(dadosDeSessao({ iniciadaEm: '2026-11-17T09:00:00.000Z' }))
      encerrarSessao(zero.id, '2026-11-17T09:00:00.000Z')

      const lista = listarSessoesEncerradas()

      expect(lista.map((s) => s.id)).toEqual([curta.id, zero.id])
      expect(lista[1].encerradaEm).toBe(lista[1].iniciadaEm)
    })

    it('deve incluir as sessões antigas encerradas na abertura (com e sem leituras)', () => {
      inserirSessaoBruta('antiga-com-leituras', '2026-11-01T10:00:00.000Z', 'ativa')
      inserirSessaoBruta('antiga-sem-leituras', '2026-11-05T10:00:00.000Z', 'ativa')
      inserirSessaoBruta('recente', '2026-11-10T10:00:00.000Z', 'ativa')
      gravarLeituras('antiga-com-leituras', ['2026-11-01T10:42:17.000Z'])

      encerrarSessoesAtivasAnteriores()
      const lista = listarSessoesEncerradas()

      expect(lista.map((s) => s.id)).toEqual(['antiga-sem-leituras', 'antiga-com-leituras'])
      expect(lista[0].encerradaEm).toBe('2026-11-05T10:00:00.000Z')
      expect(lista[1].encerradaEm).toBe('2026-11-01T10:42:17.000Z')
    })

    it('deve trazer sessões antigas gravadas antes da coluna de parâmetros N/A com lista vazia', () => {
      inserirSessaoBruta('v010', '2026-11-01T10:00:00.000Z', 'ativa')
      encerrarBruta('v010', '2026-11-01T10:30:00.000Z')

      expect(listarSessoesEncerradas()[0].parametrosNaoAplicaveis).toEqual([])
    })
  })

  // --- UC-005 (CA-005-1): sessão pelo id e leituras do voo ---

  describe('buscarSessaoPorId', () => {
    it('deve devolver a sessão encerrada com todos os campos', () => {
      const criada = criarSessao(dadosDeSessao({ parametrosNaoAplicaveis: ['mixture_1'] }))
      encerrarSessao(criada.id, '2026-11-17T11:00:00.000Z')

      expect(buscarSessaoPorId(criada.id)).toEqual({
        ...criada,
        status: 'encerrada',
        encerradaEm: '2026-11-17T11:00:00.000Z',
      })
    })

    it('deve devolver também a sessão ativa', () => {
      const criada = criarSessao(dadosDeSessao())
      expect(buscarSessaoPorId(criada.id)).toEqual(criada)
    })

    it('deve devolver null quando a sessão não existe', () => {
      criarSessao(dadosDeSessao())
      expect(buscarSessaoPorId('inexistente')).toBeNull()
    })

    it('deve devolver lista N/A vazia para sessão antiga sem a coluna preenchida', () => {
      inserirSessaoBruta('v010', '2026-11-01T10:00:00.000Z', 'encerrada')
      expect(buscarSessaoPorId('v010')!.parametrosNaoAplicaveis).toEqual([])
    })
  })

  describe('listarLeiturasDoVoo', () => {
    const INICIO = '2026-11-17T10:00:00.000Z'
    const FIM = '2026-11-17T10:00:10.000Z'

    function gravar(sessaoId: string, parametroId: string, timestamp: string, valor: number): void {
      inserirLeitura({ sessaoId, parametroId, timestamp, valor })
    }

    function vooEncerrado(): Sessao {
      const criada = criarSessao(dadosDeSessao({ iniciadaEm: INICIO }))
      return encerrarSessao(criada.id, FIM)
    }

    it('deve incluir as leituras exatamente na hora de início e na hora de fim', () => {
      const voo = vooEncerrado()
      gravar(voo.id, PARAMETER_IDS.ALTITUDE_MSL, INICIO, 1000)
      gravar(voo.id, PARAMETER_IDS.ALTITUDE_MSL, '2026-11-17T10:00:05.000Z', 1050)
      gravar(voo.id, PARAMETER_IDS.ALTITUDE_MSL, FIM, 1100)

      const resultado = listarLeiturasDoVoo(voo.id)

      expect(resultado).toEqual({
        sessaoId: voo.id,
        series: [
          {
            parametroId: PARAMETER_IDS.ALTITUDE_MSL,
            instantes: [Date.parse(INICIO), Date.parse('2026-11-17T10:00:05.000Z'), Date.parse(FIM)],
            valores: [1000, 1050, 1100],
          },
        ],
      })
    })

    it('deve deixar de fora as leituras antes do início e as da espera de 15 s depois do fim', () => {
      const voo = vooEncerrado()
      gravar(voo.id, PARAMETER_IDS.ALTITUDE_MSL, '2026-11-17T09:59:59.999Z', 1)
      gravar(voo.id, PARAMETER_IDS.ALTITUDE_MSL, '2026-11-17T10:00:03.000Z', 2)
      gravar(voo.id, PARAMETER_IDS.ALTITUDE_MSL, '2026-11-17T10:00:10.001Z', 3)
      for (let s = 11; s <= 25; s++) {
        gravar(voo.id, PARAMETER_IDS.ALTITUDE_MSL, `2026-11-17T10:00:${s}.000Z`, 99)
      }

      const [serie] = listarLeiturasDoVoo(voo.id).series

      expect(serie.valores).toEqual([2])
      expect(serie.instantes).toEqual([Date.parse('2026-11-17T10:00:03.000Z')])
    })

    it('deve trazer só as leituras do voo pedido, sem as de outra sessão no mesmo intervalo', () => {
      const voo = vooEncerrado()
      const outra = criarSessao(dadosDeSessao({ iniciadaEm: INICIO }))
      gravar(voo.id, PARAMETER_IDS.ALTITUDE_MSL, '2026-11-17T10:00:01.000Z', 10)
      gravar(outra.id, PARAMETER_IDS.ALTITUDE_MSL, '2026-11-17T10:00:02.000Z', 20)
      gravar(outra.id, PARAMETER_IDS.AIRSPEED_IAS, '2026-11-17T10:00:02.000Z', 90)

      const resultado = listarLeiturasDoVoo(voo.id)

      expect(resultado.series).toHaveLength(1)
      expect(resultado.series[0].valores).toEqual([10])
    })

    it('deve agrupar por parâmetro, em ordem crescente de instante, mesmo gravadas fora de ordem', () => {
      const voo = vooEncerrado()
      gravar(voo.id, PARAMETER_IDS.AIRSPEED_IAS, '2026-11-17T10:00:02.000Z', 82)
      gravar(voo.id, PARAMETER_IDS.ALTITUDE_MSL, '2026-11-17T10:00:02.000Z', 1020)
      gravar(voo.id, PARAMETER_IDS.AIRSPEED_IAS, '2026-11-17T10:00:01.000Z', 81)
      gravar(voo.id, PARAMETER_IDS.ALTITUDE_MSL, '2026-11-17T10:00:01.000Z', 1010)

      const { series } = listarLeiturasDoVoo(voo.id)

      expect(series.map((s) => s.parametroId)).toEqual([
        PARAMETER_IDS.ALTITUDE_MSL,
        PARAMETER_IDS.AIRSPEED_IAS,
      ])
      expect(series[0].valores).toEqual([1010, 1020])
      expect(series[1].valores).toEqual([81, 82])
      expect(series[1].instantes).toEqual([
        Date.parse('2026-11-17T10:00:01.000Z'),
        Date.parse('2026-11-17T10:00:02.000Z'),
      ])
    })

    it('deve devolver series vazia para voo encerrado sem leituras no intervalo', () => {
      const voo = vooEncerrado()
      gravar(voo.id, PARAMETER_IDS.ALTITUDE_MSL, '2026-11-17T10:00:20.000Z', 1)

      expect(listarLeiturasDoVoo(voo.id)).toEqual({ sessaoId: voo.id, series: [] })
    })

    it('deve trazer a leitura de um voo de duração 0 gravada no instante de início', () => {
      const criada = criarSessao(dadosDeSessao({ iniciadaEm: INICIO }))
      encerrarSessao(criada.id, INICIO)
      gravar(criada.id, PARAMETER_IDS.ALTITUDE_MSL, INICIO, 7)

      expect(listarLeiturasDoVoo(criada.id).series[0].valores).toEqual([7])
    })

    it('deve lançar erro quando a sessão não existe', () => {
      expect(() => listarLeiturasDoVoo('inexistente')).toThrow(/não encontrada/)
    })

    it('deve lançar erro quando a sessão está ativa', () => {
      const ativa = criarSessao(dadosDeSessao({ iniciadaEm: INICIO }))
      gravar(ativa.id, PARAMETER_IDS.ALTITUDE_MSL, '2026-11-17T10:00:01.000Z', 1)

      expect(() => listarLeiturasDoVoo(ativa.id)).toThrow(/não está encerrada/)
    })

    it('deve lançar erro quando a sessão encerrada não tem hora de fim', () => {
      inserirSessaoBruta('sem-fim', INICIO, 'encerrada')

      expect(() => listarLeiturasDoVoo('sem-fim')).toThrow(/não está encerrada/)
    })

    it('deve usar o índice idx_leituras_sessao_timestamp, sem B-tree temporária para o ORDER BY', () => {
      const plano = (
        db
          .prepare(
            `EXPLAIN QUERY PLAN
             SELECT parametro_id, timestamp, valor FROM leituras_de_parametro
             WHERE sessao_id = @sessaoId AND timestamp BETWEEN @inicio AND @fim
             ORDER BY timestamp`
          )
          .all({ sessaoId: 'x', inicio: INICIO, fim: FIM }) as { detail: string }[]
      )
        .map((r) => r.detail)
        .join(' | ')

      expect(plano).toContain('idx_leituras_sessao_timestamp')
      expect(plano).not.toContain('TEMP B-TREE')
    })

    it('deve usar, no plano, a mesma consulta que listarLeiturasDoVoo executa', () => {
      // Garante que o EXPLAIN acima confere o SQL real: captura o SQL preparado pela função.
      const preparados: string[] = []
      const original = banco.atual as { prepare: (sql: string) => unknown }
      banco.atual = {
        ...original,
        prepare: (sql: string) => {
          preparados.push(sql)
          return original.prepare(sql)
        },
      }
      const voo = vooEncerrado()
      listarLeiturasDoVoo(voo.id)
      banco.atual = original

      const consulta = preparados.find((sql) => sql.includes('leituras_de_parametro'))!
      const normalizar = (sql: string): string => sql.replace(/\s+/g, ' ').trim()
      expect(normalizar(consulta)).toBe(
        normalizar(
          `SELECT parametro_id, timestamp, valor FROM leituras_de_parametro
           WHERE sessao_id = @sessaoId AND timestamp BETWEEN @inicio AND @fim
           ORDER BY timestamp`
        )
      )
    })
  })
})
