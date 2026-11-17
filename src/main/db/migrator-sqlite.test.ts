/**
 * Teste real das migrations SQL com o SQLite nativo do Node (`node:sqlite`, aprovado no
 * HITL-1 do loop-003). O better-sqlite3 do projeto é recompilado para o Node do Electron
 * no postinstall e não carrega no Node do Vitest; por isso o banco em memória vem do
 * `node:sqlite`, embrulhado na parte da API do better-sqlite3 que o migrator e o
 * repositório de sessões usam (exec, prepare, transaction).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DatabaseSync } from 'node:sqlite'
import { TODOS_PARAMETER_IDS } from '../../shared/parameter-ids'

type NodeSqlite = typeof import('node:sqlite')

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
import { criarSessao, buscarSessaoAtiva } from './session-repository'

/** Adaptador mínimo da API do better-sqlite3 sobre o `DatabaseSync` do Node. */
function adaptar(db: DatabaseSync): unknown {
  return {
    exec: (sql: string) => db.exec(sql),
    prepare: (sql: string) => {
      const stmt = db.prepare(sql)
      return {
        all: (...params: []) => stmt.all(...params),
        get: (...params: []) => stmt.get(...params),
        run: (params: Record<string, string | number | null>) => stmt.run(params),
      }
    },
    transaction: (fn: () => void) => () => {
      db.exec('BEGIN')
      try {
        fn()
        db.exec('COMMIT')
      } catch (err) {
        db.exec('ROLLBACK')
        throw err
      }
    },
  }
}

const SQL_001 = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs') as typeof import('fs')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('path') as typeof import('path')
  return fs.readFileSync(path.join(__dirname, 'migrations', '001-initial.sql'), 'utf-8')
}

describe.skipIf(nodeSqlite === null)('migrator com SQLite real (node:sqlite)', () => {
  let db: DatabaseSync

  function contar(sql: string): number {
    return (db.prepare(sql).get() as { n: number }).n
  }

  beforeEach(() => {
    db = new nodeSqlite!.DatabaseSync(':memory:')
    banco.atual = adaptar(db)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    db.close()
  })

  it('deve aplicar 001 e 002 num banco novo e deixar os 12 parâmetros ativos', () => {
    runMigrations()

    const ids = (
      db.prepare(`SELECT id FROM parametros_de_voo WHERE ativo = 1 ORDER BY id`).all() as {
        id: string
      }[]
    ).map((r) => r.id)
    expect(ids).toHaveLength(12)
    expect(ids).toEqual([...TODOS_PARAMETER_IDS].sort())

    const versoes = (
      db.prepare(`SELECT versao FROM schema_migrations ORDER BY versao`).all() as {
        versao: string
      }[]
    ).map((r) => r.versao)
    expect(versoes).toEqual(['001-initial.sql', '002-ampliar-parametros.sql'])
  })

  it('deve semear os 6 parâmetros novos com nome e unidade', () => {
    runMigrations()

    const novos = db
      .prepare(
        `SELECT id, nome, unidade FROM parametros_de_voo
         WHERE id IN ('latitude','longitude','throttle_1','mixture_1','rpm_1','flaps')
         ORDER BY id`
      )
      .all()
    expect(novos.map((r) => ({ ...r }))).toEqual([
      { id: 'flaps', nome: 'Flapes', unidade: '%' },
      { id: 'latitude', nome: 'Latitude', unidade: '°' },
      { id: 'longitude', nome: 'Longitude', unidade: '°' },
      { id: 'mixture_1', nome: 'Mistura', unidade: '%' },
      { id: 'rpm_1', nome: 'RPM', unidade: 'rpm' },
      { id: 'throttle_1', nome: 'Manete', unidade: '%' },
    ])
  })

  it('deve migrar um banco do loop-002: coluna nova com "[]" nas sessões antigas e 001 sem efeito', () => {
    // Banco da v0.2.0: só a 001 aplicada, sem schema_migrations, com dados.
    db.exec(SQL_001())
    db.exec(
      `INSERT INTO sessoes (id, iniciada_em, status) VALUES ('antiga', '2026-11-01T10:00:00.000Z', 'encerrada');
       INSERT INTO leituras_de_parametro (sessao_id, parametro_id, timestamp, valor)
         VALUES ('antiga', 'altitude_msl', '2026-11-01T10:00:01.000Z', 4500);`
    )

    runMigrations()

    const sessao = db
      .prepare(`SELECT parametros_nao_aplicaveis AS na FROM sessoes WHERE id = 'antiga'`)
      .get() as { na: string }
    expect(sessao.na).toBe('[]')
    expect(contar(`SELECT COUNT(*) AS n FROM parametros_de_voo`)).toBe(12)
    expect(contar(`SELECT COUNT(*) AS n FROM sessoes`)).toBe(1)
    expect(contar(`SELECT COUNT(*) AS n FROM leituras_de_parametro`)).toBe(1)
    expect(contar(`SELECT COUNT(*) AS n FROM schema_migrations`)).toBe(2)
  })

  it('deve ser idempotente: rodar de novo não reaplica nem duplica nada', () => {
    runMigrations()
    expect(() => runMigrations()).not.toThrow()

    expect(contar(`SELECT COUNT(*) AS n FROM parametros_de_voo`)).toBe(12)
    expect(contar(`SELECT COUNT(*) AS n FROM schema_migrations`)).toBe(2)
  })

  it('deve permitir reexecutar a 001 sobre o banco já migrado sem efeito', () => {
    runMigrations()

    expect(() => db.exec(SQL_001())).not.toThrow()
    expect(contar(`SELECT COUNT(*) AS n FROM parametros_de_voo`)).toBe(12)
  })

  it('não deve registrar a 002 nem deixar parte dela gravada quando ela falha', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    // A coluna já existe: o ALTER TABLE da 002 falha.
    db.exec(SQL_001())
    db.exec(`ALTER TABLE sessoes ADD COLUMN parametros_nao_aplicaveis TEXT NOT NULL DEFAULT '[]'`)

    expect(() => runMigrations()).toThrow()

    const versoes = (db.prepare(`SELECT versao FROM schema_migrations`).all() as {
      versao: string
    }[]).map((r) => r.versao)
    expect(versoes).toEqual(['001-initial.sql'])
    expect(contar(`SELECT COUNT(*) AS n FROM parametros_de_voo`)).toBe(6)
  })

  it('deve gravar e ler a lista de N/A da sessão no esquema real (sessionRepository)', () => {
    runMigrations()

    const criada = criarSessao({
      iniciadaEm: '2026-11-17T10:00:00.000Z',
      encerradaEm: null,
      aeronave: '',
      aerodromoOrigem: null,
      aerodromoDestino: null,
      status: 'ativa',
      parametrosNaoAplicaveis: ['mixture_1', 'flaps'],
    })

    const lida = buscarSessaoAtiva()
    expect(lida).toEqual(criada)
    expect(lida!.parametrosNaoAplicaveis).toEqual(['mixture_1', 'flaps'])
  })
})
