/** Emitido do main → renderer quando uma nova sessão é iniciada. */
export const SESSION_STARTED = 'session:started' as const

/** Emitido do main → renderer quando uma sessão é encerrada. */
export const SESSION_ENDED = 'session:ended' as const

/** Invocado pelo renderer para buscar a sessão ativa no main. */
export const SESSION_GET_ACTIVE = 'session:get-active' as const

/** Invocado pelo renderer para buscar os parâmetros de voo ativos (RN-002). */
export const PARAMETER_LIST_ACTIVE = 'parameter:list-active' as const

/** Emitido do main → renderer a cada ciclo de coleta (1 s) com sessão ativa. */
export const PARAMETER_READINGS = 'parameter:readings' as const

/** Emitido do main → renderer quando a conexão com o SimConnect muda de estado. */
export const CONNECTION_STATE_CHANGED = 'connection:state-changed' as const

/** Invocado pelo renderer para buscar o estado atual da conexão com o SimConnect. */
export const CONNECTION_GET_STATE = 'connection:get-state' as const
