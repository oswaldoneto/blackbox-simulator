/**
 * Detector de encerramento de sessão (UC-003, RN-004).
 *
 * A sessão encerra quando o motor fica parado e a aeronave fica no solo por
 * `ENCERRAMENTO_LIMITE_MS` seguidos. O tempo é medido pelos instantes das próprias
 * amostras (sem timer): a contagem começa na primeira amostra em que as duas condições
 * valem, e esse instante é a hora de fim da sessão.
 *
 * Máquina de estados pura: `avancarDetector` recebe o estado e um evento e devolve o
 * estado novo e, se for o caso, a hora de fim. Quem guarda o estado é o chamador.
 *
 * Regras:
 * - Motor que volta ou aeronave que sai do solo zera a contagem (pane em voo não encerra).
 * - Solo ou motor desconhecido (sem amostra ainda) nunca encerra.
 * - Queda de conexão não zera nem encerra (decisão do HITL-1 do loop-004): o detector
 *   esquece os valores de motor e solo, mas mantém `inicioCondicao`. Enquanto faltar
 *   amostra nova de motor ou de solo, nada muda. Quando as duas voltam, se o motor
 *   continua parado e a aeronave no solo, a contagem segue do instante original; se
 *   qualquer condição deixou de valer, zera.
 */

/** Tempo seguido com motor parado e aeronave no solo para encerrar a sessão. */
export const ENCERRAMENTO_LIMITE_MS = 15_000

export interface EstadoDetector {
  /** Último valor de combustão lido; `null` se desconhecido. */
  motorLigado: boolean | null
  /** Último valor de `SIM ON GROUND` lido; `null` se desconhecido. */
  noSolo: boolean | null
  /** Instante (ISO 8601) da primeira amostra com motor parado e no solo; `null` sem contagem. */
  inicioCondicao: string | null
}

export type EventoDetector =
  | { tipo: 'motor'; combustao: boolean; timestamp: string }
  | { tipo: 'solo'; noSolo: boolean; timestamp: string }
  | { tipo: 'conexao-perdida' }

export interface ResultadoDetector {
  estado: EstadoDetector
  /** Hora de fim da sessão quando o limite foi atingido; `null` caso contrário. */
  encerradaEm: string | null
}

export const ESTADO_INICIAL_DETECTOR: EstadoDetector = {
  motorLigado: null,
  noSolo: null,
  inicioCondicao: null,
}

/** Zera a contagem e mantém os últimos valores lidos (usado ao iniciar ou encerrar sessão). */
export function zerarContagem(estado: EstadoDetector): EstadoDetector {
  return { ...estado, inicioCondicao: null }
}

export function avancarDetector(
  estado: EstadoDetector,
  evento: EventoDetector
): ResultadoDetector {
  if (evento.tipo === 'conexao-perdida') {
    return {
      estado: { motorLigado: null, noSolo: null, inicioCondicao: estado.inicioCondicao },
      encerradaEm: null,
    }
  }

  const novo: EstadoDetector =
    evento.tipo === 'motor'
      ? { ...estado, motorLigado: evento.combustao }
      : { ...estado, noSolo: evento.noSolo }

  // Algum valor desconhecido: não encerra e não mexe na contagem.
  if (novo.motorLigado === null || novo.noSolo === null) {
    return { estado: novo, encerradaEm: null }
  }

  const condicao = !novo.motorLigado && novo.noSolo
  if (!condicao) {
    return { estado: { ...novo, inicioCondicao: null }, encerradaEm: null }
  }

  const inicioCondicao = novo.inicioCondicao ?? evento.timestamp
  const decorrido = Date.parse(evento.timestamp) - Date.parse(inicioCondicao)
  if (decorrido >= ENCERRAMENTO_LIMITE_MS) {
    return { estado: { ...novo, inicioCondicao: null }, encerradaEm: inicioCondicao }
  }
  return { estado: { ...novo, inicioCondicao }, encerradaEm: null }
}
