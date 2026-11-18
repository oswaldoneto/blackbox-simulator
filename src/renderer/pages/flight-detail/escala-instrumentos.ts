import { arfagemNarizParaCima, rolagemParaDireita } from '../../components/sinal-de-exibicao'

/**
 * Escala linear de um mostrador: o valor `min` fica em `anguloMin` e o `max` em
 * `anguloMax` (graus, 0 no topo, sentido horário).
 */
export interface EscalaDoMostrador {
  min: number
  max: number
  anguloMin: number
  anguloMax: number
}

/** Velocímetro: 0 a 200 kt, sem faixas de cor (as faixas dependem da aeronave). */
export const ESCALA_IAS: EscalaDoMostrador = { min: 0, max: 200, anguloMin: -150, anguloMax: 150 }

/** Tacômetro: 0 a 3.500 rpm, sem faixas de cor. */
export const ESCALA_RPM: EscalaDoMostrador = { min: 0, max: 3500, anguloMin: -135, anguloMax: 135 }

/** Variômetro: −2.000 a +2.000 fpm, com o zero à esquerda (9 horas). */
export const ESCALA_VS: EscalaDoMostrador = { min: -2000, max: 2000, anguloMin: -260, anguloMax: 80 }

/** Manete, mistura e flapes: 0 a 100 %. */
export const ESCALA_PERCENTUAL = { min: 0, max: 100 } as const

/** Ângulo do flape no desenho esquemático com 100 % de extensão (ilustrativo, sem graus). */
export const FLAPE_ANGULO_MAXIMO = 40

/** Limite da arfagem no desenho do horizonte artificial; o número mostra o valor real. */
export const ARFAGEM_LIMITE_DESENHO = 25

/** Deslocamento do horizonte, em unidades do `viewBox` 200×200, por grau de arfagem. */
export const PIXELS_POR_GRAU_DE_ARFAGEM = 3

function limitar(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor))
}

/**
 * Ângulo do ponteiro para o valor, preso no limite da escala (CA-005-14): fora da escala
 * o ponteiro para no extremo, e o número continua mostrando o valor real.
 */
export function anguloNaEscala(valor: number, escala: EscalaDoMostrador): number {
  const fracao = (limitar(valor, escala.min, escala.max) - escala.min) / (escala.max - escala.min)
  return escala.anguloMin + (escala.anguloMax - escala.anguloMin) * fracao
}

/** Fração de 0 a 1 do valor na escala, presa nos limites (alavancas e flapes). */
export function fracaoNaEscala(valor: number, min: number, max: number): number {
  return (limitar(valor, min, max) - min) / (max - min)
}

function modulo(valor: number, base: number): number {
  return ((valor % base) + base) % base
}

/**
 * Ponteiros do altímetro (graus): o longo dá a volta a cada 1.000 ft (centenas) e o curto
 * a cada 10.000 ft (milhares). Altitude negativa gira para trás.
 */
export function angulosDoAltimetro(altitudeFt: number): { centenas: number; milhares: number } {
  return {
    centenas: (modulo(altitudeFt, 1000) / 1000) * 360,
    milhares: (modulo(altitudeFt, 10000) / 10000) * 360,
  }
}

/** Rotação da rosa da bússola (graus): a rosa gira ao contrário do rumo. */
export function rotacaoDaRosa(rumo: number): number {
  const r = modulo(rumo, 360)
  return r === 0 ? 0 : -r
}

/**
 * Movimento do horizonte artificial a partir dos valores brutos gravados: com rolagem para
 * a direita, o horizonte gira no sentido anti-horário; com o nariz para cima, desce. A
 * arfagem do desenho fica limitada a ±25°.
 */
export function movimentoDoHorizonte(
  arfagemBruta: number,
  rolagemBruta: number
): { rotacao: number; deslocamento: number } {
  const arfagem = limitar(
    arfagemNarizParaCima(arfagemBruta),
    -ARFAGEM_LIMITE_DESENHO,
    ARFAGEM_LIMITE_DESENHO
  )
  const rotacao = -rolagemParaDireita(rolagemBruta)
  return {
    rotacao: rotacao === 0 ? 0 : rotacao,
    deslocamento: arfagem * PIXELS_POR_GRAU_DE_ARFAGEM,
  }
}

/** Ângulo do flape no desenho esquemático, proporcional à extensão (0 a 100 %). */
export function anguloDoFlape(flapesPercentual: number): number {
  return fracaoNaEscala(flapesPercentual, ESCALA_PERCENTUAL.min, ESCALA_PERCENTUAL.max) * FLAPE_ANGULO_MAXIMO
}
