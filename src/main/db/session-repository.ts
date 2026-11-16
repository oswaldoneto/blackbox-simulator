import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from './database'
import type { Sessao } from '../../shared/types'

interface SessaoRow {
  id: string
  iniciada_em: string
  encerrada_em: string | null
  aeronave: string
  aerodromo_origem: string | null
  aerodromo_destino: string | null
  status: string
}

function rowToSessao(row: SessaoRow): Sessao {
  return {
    id: row.id,
    iniciadaEm: row.iniciada_em,
    encerradaEm: row.encerrada_em,
    aeronave: row.aeronave,
    aerodromoOrigem: row.aerodromo_origem,
    aerodromoDestino: row.aerodromo_destino,
    status: row.status as Sessao['status'],
  }
}

export function criarSessao(dados: Omit<Sessao, 'id'>): Sessao {
  const db = getDatabase()
  const id = uuidv4()

  db.prepare(
    `INSERT INTO sessoes
       (id, iniciada_em, encerrada_em, aeronave, aerodromo_origem, aerodromo_destino, status)
     VALUES
       (@id, @iniciadaEm, @encerradaEm, @aeronave, @aerodromoOrigem, @aerodromoDestino, @status)`
  ).run({
    id,
    iniciadaEm: dados.iniciadaEm,
    encerradaEm: dados.encerradaEm,
    aeronave: dados.aeronave,
    aerodromoOrigem: dados.aerodromoOrigem,
    aerodromoDestino: dados.aerodromoDestino,
    status: dados.status,
  })

  return { id, ...dados }
}

export function buscarSessaoAtiva(): Sessao | null {
  const db = getDatabase()
  const row = db
    .prepare(`SELECT * FROM sessoes WHERE status = 'ativa' LIMIT 1`)
    .get() as SessaoRow | undefined

  return row ? rowToSessao(row) : null
}
