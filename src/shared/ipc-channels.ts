/** Emitido do main → renderer quando uma nova sessão é iniciada. */
export const SESSION_STARTED = 'session:started' as const

/** Emitido do main → renderer quando uma sessão é encerrada. */
export const SESSION_ENDED = 'session:ended' as const

/** Invocado pelo renderer para buscar a sessão ativa no main. */
export const SESSION_GET_ACTIVE = 'session:get-active' as const
