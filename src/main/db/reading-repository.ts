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
