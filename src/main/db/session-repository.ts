import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from './database'
import type { Sessao } from '../../shared/types'
import { isParametroId } from '../../shared/parameter-ids'
import type { ParametroId } from '../../shared/parameter-ids'

interface SessaoRow {
  id: string
  iniciada_em: string
  encerrada_em: string | null
  aeronave: string
  aerodromo_origem: string | null
  aerodromo_destino: string | null
  status: string
  parametros_nao_aplicaveis: string
}

/** Lê a lista JSON de parâmetros N/A; conteúdo inválido vira lista vazia, com log. */
function lerParametrosNaoAplicaveis(sessaoId: string, json: string): ParametroId[] {
  let lista: unknown
  try {
    lista = JSON.parse(json)
  } catch (err) {
    console.error(
      `[SessionRepository] parametros_nao_aplicaveis inválido na sessão ${sessaoId}:`,
      err
    )
    return []
  }
  if (!Array.isArray(lista)) {
    console.error(
      `[SessionRepository] parametros_nao_aplicaveis não é uma lista na sessão ${sessaoId}:`,
      json
    )
    return []
  }
  const validos: ParametroId[] = []
  for (const item of lista) {
    if (typeof item === 'string' && isParametroId(item)) {
      validos.push(item)
    } else {
      console.error(
        `[SessionRepository] Parâmetro N/A desconhecido ignorado na sessão ${sessaoId}:`,
        item
      )
    }
  }
  return validos
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
    parametrosNaoAplicaveis: lerParametrosNaoAplicaveis(row.id, row.parametros_nao_aplicaveis),
  }
}

export function criarSessao(dados: Omit<Sessao, 'id'>): Sessao {
  const db = getDatabase()
  const id = uuidv4()

  db.prepare(
    `INSERT INTO sessoes
       (id, iniciada_em, encerrada_em, aeronave, aerodromo_origem, aerodromo_destino, status,
        parametros_nao_aplicaveis)
     VALUES
       (@id, @iniciadaEm, @encerradaEm, @aeronave, @aerodromoOrigem, @aerodromoDestino, @status,
        @parametrosNaoAplicaveis)`
  ).run({
    id,
    iniciadaEm: dados.iniciadaEm,
    encerradaEm: dados.encerradaEm,
    aeronave: dados.aeronave,
    aerodromoOrigem: dados.aerodromoOrigem,
    aerodromoDestino: dados.aerodromoDestino,
    status: dados.status,
    parametrosNaoAplicaveis: JSON.stringify(dados.parametrosNaoAplicaveis),
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
