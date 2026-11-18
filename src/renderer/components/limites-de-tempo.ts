/** Tempo sem leitura nova após o qual o valor vira "—" (painel de tempo real e debriefing). */
export const SEM_DADOS_LIMITE_MS = 2000

/** Tempo da primeira carga antes de mostrar o indicador de carregamento (usability.md). */
export const CARREGANDO_LIMITE_MS = 500

/** Janela dos gráficos de linha do painel de tempo real (UC-002): fixa em 2 minutos. */
export const JANELA_GRAFICO_MS = 120000

/** Passo do relógio que faz a linha andar no painel enquanto não chegam leituras (sem sinal). */
export const RELOGIO_SEM_SINAL_MS = 1000

/**
 * Quantidade máxima de pontos guardados por parâmetro na janela do painel. A 1 leitura por
 * segundo, 2 minutos dão 120 pontos; a folga cobre leituras um pouco mais rápidas.
 */
export const MAX_PONTOS_JANELA = 150
