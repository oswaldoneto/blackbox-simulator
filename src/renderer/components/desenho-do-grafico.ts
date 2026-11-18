import { PARAMETER_IDS } from '../../shared/parameter-ids'
import { caminhoDaLinha } from './caminho-svg'
import { configDoGrafico } from './config-grafico-painel'
import { escalaDoGrafico, valorBrutoDoGrafico, valorNoGrafico } from './escala-do-grafico'
import type { EscalaDoGrafico } from './escala-do-grafico'
import { formatParameterValue } from './format-parameter-value'
import { JANELA_GRAFICO_MS, SEM_DADOS_LIMITE_MS } from './limites-de-tempo'
import { segmentarPorFalhas } from './segmentar-serie'
import type { PontoNoTempo } from './segmentar-serie'

/** Largura do `viewBox` do gráfico do painel; a borda direita é o "agora". */
export const GRAFICO_LARGURA = 1000

/** Altura do `viewBox` do gráfico do painel. */
export const GRAFICO_ALTURA = 100

/** Margem, no `viewBox`, entre os limites da escala e as bordas de cima e de baixo. */
const MARGEM_VERTICAL = 5

/** Variação do rumo entre duas leituras acima da qual a linha é interrompida (CA-002-11). */
const SALTO_DO_RUMO = 180

/** Texto do limite superior do rumo, no lugar de "000" (decisão 7). */
const RUMO_LIMITE_SUPERIOR = '360'

/** Primeira e última ponta da faixa das leituras da janela, em valores brutos. */
export interface FaixaDaJanela {
  de: number
  ate: number
}

/** O que o gráfico de um card desenha, em coordenadas do `viewBox` 1000×100. */
export interface DesenhoDoGrafico {
  /** Caminho das linhas, um subcaminho por trecho contínuo de 2 pontos ou mais. */
  linha: string
  /** Caminho das áreas claras sob as linhas, fechadas na base do gráfico. */
  area: string
  /** Caminho dos pontos isolados (trecho de uma única leitura), cada um de comprimento zero. */
  pontosIsolados: string
  /** Limite inferior da escala, formatado; `null` quando a escala não existe ainda (T8). */
  limiteInferior: string | null
  /** Limite superior da escala, formatado; `null` quando a escala não existe ainda (T8). */
  limiteSuperior: string | null
  /** Menor e maior leitura da janela (no rumo, as pontas do menor arco); `null` sem leituras. */
  faixa: FaixaDaJanela | null
}

interface EntradaDoDesenho {
  parametroId: string
  /** Pontos da janela, com valores brutos, em ordem crescente de tempo. */
  pontos: readonly PontoNoTempo[]
  /** Instante da borda direita (ms UTC); `null` antes da primeira leitura. */
  agora: number | null
  janelaMs?: number
}

const DESENHO_VAZIO: DesenhoDoGrafico = {
  linha: '',
  area: '',
  pontosIsolados: '',
  limiteInferior: null,
  limiteSuperior: null,
  faixa: null,
}

function formatarLimite(parametroId: string, valor: number, superior: boolean): string {
  if (parametroId === PARAMETER_IDS.HEADING_MAGNETIC && superior) {
    return RUMO_LIMITE_SUPERIOR
  }
  return formatParameterValue(parametroId, valorBrutoDoGrafico(parametroId, valor))
}

/**
 * Pontas do menor arco que cobre os rumos dados (T6 do loop-007, opção b): o arco começa
 * depois da maior falha entre rumos vizinhos. Ex.: 350, 355, 5 e 10 dão de 350 a 10.
 */
export function menorArcoDoRumo(rumos: readonly number[]): FaixaDaJanela | null {
  if (rumos.length === 0) return null
  const ordenados = [...rumos].sort((a, b) => a - b)
  const n = ordenados.length
  let maiorFalha = ordenados[0] + 360 - ordenados[n - 1]
  let de = ordenados[0]
  let ate = ordenados[n - 1]
  for (let i = 0; i + 1 < n; i += 1) {
    const falha = ordenados[i + 1] - ordenados[i]
    if (falha > maiorFalha) {
      maiorFalha = falha
      de = ordenados[i + 1]
      ate = ordenados[i]
    }
  }
  return { de, ate }
}

function faixaDaJanela(parametroId: string, valores: readonly number[]): FaixaDaJanela | null {
  if (valores.length === 0) return null
  if (parametroId === PARAMETER_IDS.HEADING_MAGNETIC) {
    return menorArcoDoRumo(valores)
  }
  let menor = valores[0]
  let maior = valores[0]
  for (const valor of valores) {
    if (valor < menor) menor = valor
    if (valor > maior) maior = valor
  }
  return {
    de: valorBrutoDoGrafico(parametroId, menor),
    ate: valorBrutoDoGrafico(parametroId, maior),
  }
}

function yNaEscala(valor: number, escala: EscalaDoGrafico): number {
  const fracao = (valor - escala.min) / (escala.max - escala.min)
  // Fora da escala, a linha para no limite (CA-002-10).
  const presa = Math.min(1, Math.max(0, fracao))
  return GRAFICO_ALTURA - MARGEM_VERTICAL - presa * (GRAFICO_ALTURA - 2 * MARGEM_VERTICAL)
}

/**
 * Desenho do gráfico de linha de um card do painel (CA-002-7 a CA-002-14), função pura.
 * - Eixo fixo de 2 minutos terminando no "agora", na borda direita; com menos de 2 minutos
 *   de leituras, a linha fica à direita.
 * - A escala usa só as leituras dentro da janela; o ponto anterior à janela entra no
 *   desenho para a linha começar pela borda esquerda.
 * - A linha é interrompida com 2 s ou mais entre duas leituras e, no rumo, numa variação
 *   acima de 180° (passagem pelo norte). Uma leitura sozinha vira ponto isolado.
 */
export function desenharGrafico({
  parametroId,
  pontos,
  agora,
  janelaMs = JANELA_GRAFICO_MS,
}: EntradaDoDesenho): DesenhoDoGrafico {
  const config = configDoGrafico(parametroId)
  if (config === null) return DESENHO_VAZIO

  const inicio = agora === null ? Infinity : agora - janelaMs
  const visiveis: PontoNoTempo[] = []
  let anterior: PontoNoTempo | null = null
  if (agora !== null) {
    for (const ponto of pontos) {
      if (!Number.isFinite(ponto.t) || !Number.isFinite(ponto.v) || ponto.t > agora) continue
      const exibido = { t: ponto.t, v: valorNoGrafico(parametroId, ponto.v) }
      if (ponto.t < inicio) anterior = exibido
      else visiveis.push(exibido)
    }
  }

  const valoresVisiveis = visiveis.map((p) => p.v)
  const escala = escalaDoGrafico(config.escala, valoresVisiveis)
  const limites = {
    limiteInferior: escala === null ? null : formatarLimite(parametroId, escala.min, false),
    limiteSuperior: escala === null ? null : formatarLimite(parametroId, escala.max, true),
  }
  const faixa = faixaDaJanela(parametroId, valoresVisiveis)

  if (escala === null || agora === null || visiveis.length === 0) {
    return { ...DESENHO_VAZIO, ...limites, faixa }
  }

  const circular = config.escala.tipo === 'fixa' && config.escala.circular
  const quebra = (a: PontoNoTempo, b: PontoNoTempo): boolean =>
    b.t - a.t >= SEM_DADOS_LIMITE_MS || (circular && Math.abs(b.v - a.v) > SALTO_DO_RUMO)
  const desenhaveis = anterior === null ? visiveis : [anterior, ...visiveis]
  const trechos = segmentarPorFalhas(desenhaveis, SEM_DADOS_LIMITE_MS, quebra)

  const linhas: string[] = []
  const areas: string[] = []
  const isolados: string[] = []
  for (const trecho of trechos) {
    const coordenadas = trecho.map((p) => ({
      x: GRAFICO_LARGURA - ((agora - p.t) / janelaMs) * GRAFICO_LARGURA,
      y: yNaEscala(p.v, escala),
    }))
    if (coordenadas.length === 1) {
      // O ponto anterior à janela, sozinho, fica fora do eixo e não é desenhado.
      if (coordenadas[0].x >= 0) isolados.push(caminhoDaLinha(coordenadas))
      continue
    }
    const linha = caminhoDaLinha(coordenadas)
    const primeiro = coordenadas[0]
    const ultimo = coordenadas[coordenadas.length - 1]
    linhas.push(linha)
    areas.push(
      `${linha} L${ultimo.x.toFixed(1)} ${GRAFICO_ALTURA} L${primeiro.x.toFixed(1)} ${GRAFICO_ALTURA} Z`
    )
  }

  return {
    linha: linhas.join(' '),
    area: areas.join(' '),
    pontosIsolados: isolados.join(' '),
    ...limites,
    faixa,
  }
}
