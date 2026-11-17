import { getDatabase } from './database'
import type { LeituraDeParametro } from '../../shared/types'

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
