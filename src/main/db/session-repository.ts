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

/** Sessão ativa mais recente (por `iniciada_em`, depois pela ordem de inserção). */
export function buscarSessaoAtiva(): Sessao | null {
  const db = getDatabase()
  const row = db
    .prepare(
      `SELECT * FROM sessoes
       WHERE status = 'ativa'
       ORDER BY iniciada_em DESC, rowid DESC
       LIMIT 1`
    )
    .get() as SessaoRow | undefined

  return row ? rowToSessao(row) : null
}

/**
 * Encerra uma sessão ativa: grava `encerrada_em` e o status `encerrada` (UC-003).
 * Só muda sessão ativa; lança erro se nenhuma linha mudar (sessão inexistente ou já
 * encerrada). Devolve a sessão como ficou gravada.
 */
export function encerrarSessao(id: string, encerradaEm: string): Sessao {
  const db = getDatabase()
  const resultado = db
    .prepare(
      `UPDATE sessoes
       SET status = 'encerrada', encerrada_em = @encerradaEm
       WHERE id = @id AND status = 'ativa'`
    )
    .run({ id, encerradaEm })

  if (resultado.changes !== 1) {
    throw new Error(`Sessão ${id} não encontrada ou já encerrada`)
  }

  const row = db.prepare(`SELECT * FROM sessoes WHERE id = @id`).get({ id }) as
    | SessaoRow
    | undefined
  if (row === undefined) {
    throw new Error(`Sessão ${id} não encontrada depois do encerramento`)
  }
  return rowToSessao(row)
}

/**
 * Encerra toda sessão ativa exceto a mais recente, que fica para a verificação na
 * abertura do app (UC-003). Repara as sessões sem encerramento das versões v0.1.0 a
 * v0.3.0 e as que ficaram ativas por falha ao gravar o encerramento. A hora de fim é a
 * última leitura da sessão ou, sem leitura, a hora de início (duração 0).
 * Roda a cada abertura, numa transação. Devolve quantas sessões foram encerradas.
 */
export function encerrarSessoesAtivasAnteriores(): number {
  const db = getDatabase()
  const encerrar = db.prepare(
    `UPDATE sessoes
     SET status = 'encerrada',
         encerrada_em = COALESCE(
           (SELECT MAX(l.timestamp) FROM leituras_de_parametro l WHERE l.sessao_id = sessoes.id),
           sessoes.iniciada_em
         )
     WHERE status = 'ativa'
       AND id <> (
         SELECT id FROM sessoes
         WHERE status = 'ativa'
         ORDER BY iniciada_em DESC, rowid DESC
         LIMIT 1
       )`
  )
  const executar = db.transaction((): number => encerrar.run().changes)
  return executar()
}
