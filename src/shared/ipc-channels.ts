/** Emitido do main → renderer quando uma nova sessão é iniciada. */
export const SESSION_STARTED = 'session:started' as const

/** Emitido do main → renderer quando uma sessão é encerrada, depois de gravado o encerramento. */
export const SESSION_ENDED = 'session:ended' as const

/**
 * Emitido do main → renderer quando a gravação do encerramento falha. Leva a sessão como
 * estava na memória do main; no banco ela continua ativa até a próxima abertura.
 */
export const SESSION_END_FAILED = 'session:end-failed' as const

/** Invocado pelo renderer para buscar a sessão ativa na memória do main. */
export const SESSION_GET_ACTIVE = 'session:get-active' as const

/**
 * Invocado pelo renderer para listar as sessões encerradas gravadas no banco (UC-004),
 * da mais recente para a mais antiga.
 */
export const SESSION_LIST_ENDED = 'session:list-ended' as const

/**
 * Invocado pelo renderer para buscar as leituras de um voo encerrado (UC-005), cortadas
 * entre a hora de início e a hora de fim, inclusive. Recebe o `sessaoId`.
 */
export const SESSION_GET_READINGS = 'session:get-readings' as const

/** Invocado pelo renderer para buscar os parâmetros de voo ativos (RN-002). */
export const PARAMETER_LIST_ACTIVE = 'parameter:list-active' as const

/** Emitido do main → renderer a cada ciclo de coleta (1 s) com sessão ativa. */
export const PARAMETER_READINGS = 'parameter:readings' as const

/** Emitido do main → renderer quando a conexão com o SimConnect muda de estado. */
export const CONNECTION_STATE_CHANGED = 'connection:state-changed' as const

/** Invocado pelo renderer para buscar o estado atual da conexão com o SimConnect. */
export const CONNECTION_GET_STATE = 'connection:get-state' as const
