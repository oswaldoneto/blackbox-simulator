import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import path from 'path'
import { getDatabase } from './database'

export function runMigrations(): void {
  const db: Database.Database = getDatabase()
  const migrationSql = readFileSync(
    path.join(__dirname, 'migrations', '001-initial.sql'),
    'utf-8'
  )
  db.exec(migrationSql)
}
