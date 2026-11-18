import type { PacoteDeLeituras } from '../../shared/types'
import { JANELA_GRAFICO_MS, MAX_PONTOS_JANELA } from './limites-de-tempo'
import type { PontoNoTempo } from './segmentar-serie'

/**
 * Leituras recentes da sessão, guardadas no renderer para desenhar os gráficos de linha do
 * painel de tempo real (UC-002). Estado de exibição: não é persistido nem enviado ao main.
 */
export interface JanelaDeLeituras {
  /** Pontos de cada parâmetro, por `parametroId`, em ordem crescente de tempo. */
  series: Readonly<Record<string, readonly PontoNoTempo[]>>
  /** Instante (ms UTC) do último pacote aceito; `null` antes do primeiro. */
  ultimoInstante: number | null
}

/** Janela sem leituras: início da sessão e reabertura do app. */
export const JANELA_VAZIA: JanelaDeLeituras = { series: {}, ultimoInstante: null }

interface OpcoesDaJanela {
  janelaMs?: number
  maxPontos?: number
}

/**
 * Corta os pontos mais antigos que `corte`, guardando um ponto anterior ao corte para a
 * linha entrar pela borda esquerda, e limita a quantidade. Devolve a mesma lista quando
 * nada sai.
 */
function cortar(
  pontos: readonly PontoNoTempo[],
  corte: number,
  maxPontos: number
): readonly PontoNoTempo[] {
  let primeiroDentro = 0
  while (primeiroDentro < pontos.length && pontos[primeiroDentro].t < corte) {
    primeiroDentro += 1
  }
  const inicio = Math.max(0, primeiroDentro - 1, pontos.length - maxPontos)
  return inicio === 0 ? pontos : pontos.slice(inicio)
}

/**
 * Acrescenta um pacote à janela (função pura).
 * - Descarta o pacote com `timestamp` inválido ou fora de ordem (igual ou anterior ao último
 *   aceito), devolvendo a mesma janela.
 * - Leituras com valor não finito não viram ponto (nenhum ponto é inventado).
 * - Corta pela janela de 2 minutos a partir do instante do pacote e limita a quantidade.
 * - Só cria listas novas nas séries que mudaram; as outras mantêm a mesma referência.
 */
export function acrescentarPacote(
  janela: JanelaDeLeituras,
  pacote: PacoteDeLeituras,
  { janelaMs = JANELA_GRAFICO_MS, maxPontos = MAX_PONTOS_JANELA }: OpcoesDaJanela = {}
): JanelaDeLeituras {
  const instante = Date.parse(pacote.timestamp)
  if (!Number.isFinite(instante)) return janela
  if (janela.ultimoInstante !== null && instante <= janela.ultimoInstante) return janela

  const corte = instante - janelaMs
  const novosValores = new Map<string, number>()
  for (const leitura of pacote.leituras) {
    if (Number.isFinite(leitura.valor)) {
      novosValores.set(leitura.parametroId, leitura.valor)
    }
  }

  const series: Record<string, readonly PontoNoTempo[]> = {}
  for (const [parametroId, pontos] of Object.entries(janela.series)) {
    const valor = novosValores.get(parametroId)
    const comNovo = valor === undefined ? pontos : [...pontos, { t: instante, v: valor }]
    const cortados = cortar(comNovo, corte, maxPontos)
    if (cortados.length > 0) {
      series[parametroId] = cortados
    }
  }
  for (const [parametroId, valor] of novosValores) {
    if (!Object.prototype.hasOwnProperty.call(janela.series, parametroId)) {
      series[parametroId] = [{ t: instante, v: valor }]
    }
  }

  return { series, ultimoInstante: instante }
}
