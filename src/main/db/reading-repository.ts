import { getDatabase } from './database'
import { buscarSessaoPorId } from './session-repository'
import { TODOS_PARAMETER_IDS, isParametroId } from '../../shared/parameter-ids'
import type { ParametroId } from '../../shared/parameter-ids'
import type { LeituraDeParametro, LeiturasDoVoo, SerieDeLeituras } from '../../shared/types'

export function inserirLeitura(leitura: LeituraDeParametro): void {
  const db = getDatabase()
  db.prepare(
    `INSERT INTO leituras_de_parametro (sessao_id, parametro_id, timestamp, valor)
     VALUES (@sessaoId, @parametroId, @timestamp, @valor)`
  ).run({
    sessaoId: leitura.sessaoId,
    parametroId: leitura.parametroId,
    timestamp: leitura.timestamp,
    valor: leitura.valor,
  })
}

interface UltimaLeituraRow {
  ultima: string | null
}

/** Instante (ISO 8601) da última leitura gravada da sessão, ou `null` se não há leitura. */
export function buscarUltimaLeituraEm(sessaoId: string): string | null {
  const db = getDatabase()
  const row = db
    .prepare(
      `SELECT MAX(timestamp) AS ultima FROM leituras_de_parametro WHERE sessao_id = @sessaoId`
    )
    .get({ sessaoId }) as UltimaLeituraRow | undefined
  return row?.ultima ?? null
}

/** Linha das leituras de um voo, na ordem do `timestamp`. */
export interface LeituraDoVooRow {
  parametro_id: string
  timestamp: string
  valor: number
}

/**
 * Agrupa as leituras de um voo em séries por parâmetro, em colunas (UC-005). As linhas
 * chegam em ordem crescente de `timestamp`, e a ordem é mantida em cada série. Slug
 * desconhecido ou `timestamp` inválido são descartados, com log. As séries saem na ordem
 * de `TODOS_PARAMETER_IDS`; parâmetro sem leitura não gera série.
 */
export function agruparEmSeries(
  sessaoId: string,
  linhas: readonly LeituraDoVooRow[]
): SerieDeLeituras[] {
  const porParametro = new Map<ParametroId, SerieDeLeituras>()
  const descartados = new Set<string>()
  for (const linha of linhas) {
    if (!isParametroId(linha.parametro_id)) {
      if (!descartados.has(linha.parametro_id)) {
        descartados.add(linha.parametro_id)
        console.error(
          `[ReadingRepository] Parâmetro desconhecido ignorado nas leituras da sessão ${sessaoId}:`,
          linha.parametro_id
        )
      }
      continue
    }
    const instante = Date.parse(linha.timestamp)
    if (Number.isNaN(instante)) {
      console.error(
        `[ReadingRepository] Timestamp inválido ignorado nas leituras da sessão ${sessaoId}:`,
        linha.timestamp
      )
      continue
    }
    let serie = porParametro.get(linha.parametro_id)
    if (serie === undefined) {
      serie = { parametroId: linha.parametro_id, instantes: [], valores: [] }
      porParametro.set(linha.parametro_id, serie)
    }
    serie.instantes.push(instante)
    serie.valores.push(linha.valor)
  }
  const series: SerieDeLeituras[] = []
  for (const parametroId of TODOS_PARAMETER_IDS) {
    const serie = porParametro.get(parametroId)
    if (serie !== undefined) {
      series.push(serie)
    }
  }
  return series
}

/**
 * Leituras de um voo encerrado (UC-005), da hora de início à hora de fim, inclusive: as
 * leituras da espera de 15 s do encerramento (UC-003) ficam de fora. Usa o índice
 * `idx_leituras_sessao_timestamp`. Lança erro se a sessão não existe, está ativa ou não
 * tem hora de fim.
 */
export function listarLeiturasDoVoo(sessaoId: string): LeiturasDoVoo {
  const sessao = buscarSessaoPorId(sessaoId)
  if (sessao === null) {
    throw new Error(`Sessão ${sessaoId} não encontrada`)
  }
  if (sessao.status !== 'encerrada' || sessao.encerradaEm === null) {
    throw new Error(`Sessão ${sessaoId} não está encerrada`)
  }

  const db = getDatabase()
  const linhas = db
    .prepare(
      `SELECT parametro_id, timestamp, valor FROM leituras_de_parametro
       WHERE sessao_id = @sessaoId AND timestamp BETWEEN @inicio AND @fim
       ORDER BY timestamp`
    )
    .all({ sessaoId, inicio: sessao.iniciadaEm, fim: sessao.encerradaEm }) as LeituraDoVooRow[]

  return { sessaoId, series: agruparEmSeries(sessaoId, linhas) }
}
