import { getDatabase } from './database'
import type { ParametroDeVoo } from '../../shared/types'

interface ParametroRow {
  id: string
  nome: string
  unidade: string
  ativo: number
}

export function buscarParametrosAtivos(): ParametroDeVoo[] {
  const db = getDatabase()
  const rows = db
    .prepare(`SELECT * FROM parametros_de_voo WHERE ativo = 1`)
    .all() as ParametroRow[]

  return rows.map((row) => ({
    id: row.id,
    nome: row.nome,
    unidade: row.unidade,
    ativo: row.ativo === 1,
  }))
}
