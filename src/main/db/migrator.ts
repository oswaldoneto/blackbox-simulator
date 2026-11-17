import Database from 'better-sqlite3'
import { readFileSync, readdirSync } from 'fs'
import path from 'path'
import { getDatabase } from './database'

const MIGRATIONS_DIR = path.join(__dirname, 'migrations')

interface SchemaMigrationRow {
  versao: string
}

/** Arquivos `.sql` da pasta de migrations, em ordem de nome (001, 002, ...). */
function listarMigrations(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((arquivo) => arquivo.endsWith('.sql'))
    .sort()
}

/**
 * Aplica, em ordem, as migrations ainda não registradas em `schema_migrations`.
 * Cada migration roda numa transação junto com o seu registro: se falhar, nada
 * dela fica gravado e ela volta a rodar na próxima inicialização.
 * Bancos anteriores ao controle de versão rodam a 001 de novo; ela é idempotente.
 */
export function runMigrations(): void {
  const db: Database.Database = getDatabase()

  db.exec(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       versao      TEXT PRIMARY KEY,
       aplicada_em TEXT NOT NULL
     )`
  )

  const aplicadas = new Set(
    (db.prepare(`SELECT versao FROM schema_migrations`).all() as SchemaMigrationRow[]).map(
      (row) => row.versao
    )
  )

  const registrar = db.prepare(
    `INSERT INTO schema_migrations (versao, aplicada_em) VALUES (@versao, @aplicadaEm)`
  )

  for (const arquivo of listarMigrations()) {
    if (aplicadas.has(arquivo)) continue

    const sql = readFileSync(path.join(MIGRATIONS_DIR, arquivo), 'utf-8')
    const aplicar = db.transaction(() => {
      db.exec(sql)
      registrar.run({ versao: arquivo, aplicadaEm: new Date().toISOString() })
    })

    try {
      aplicar()
    } catch (err) {
      console.error(`[Migrator] Falha ao aplicar a migration ${arquivo}:`, err)
      throw err
    }
  }
}
