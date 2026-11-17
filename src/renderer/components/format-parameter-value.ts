import { PARAMETER_IDS } from '../../shared/parameter-ids'

/** Texto exibido no lugar do valor quando não há leitura válida (sem sinal). */
export const SEM_VALOR = '—'

/** Texto exibido no lugar do valor quando a aeronave não possui o item (RN-007). */
export const NAO_APLICAVEL = 'N/A'

/** Sinal de menos tipográfico (U+2212), usado em todos os valores negativos. */
const SINAL_MENOS = '−'

/**
 * Convenção de sinal da arfagem entregue pelo SimConnect (PLANE PITCH DEGREES).
 * Assumida como positiva com o nariz para BAIXO; por isso o valor é invertido na
 * exibição, para mostrar "+" com o nariz para cima. A correção é só de exibição:
 * a coleta e o banco guardam o valor bruto.
 * Confirmado no teste manual no Windows com o MSFS 2024 (loop-002).
 */
export const PITCH_POSITIVO_NARIZ_PARA_BAIXO = true

/**
 * Convenção de sinal da rolagem entregue pelo SimConnect (PLANE BANK DEGREES).
 * Assumida como positiva para a ESQUERDA; a exibição mostra o valor absoluto
 * com "E" (esquerda) para positivo e "D" (direita) para negativo. A correção é
 * só de exibição: a coleta e o banco guardam o valor bruto.
 * Confirmado no teste manual no Windows com o MSFS 2024 (loop-002).
 */
export const BANK_POSITIVO_PARA_ESQUERDA = true

const formatadorInteiro = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const formatadorUmaCasa = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const formatadorCoordenada = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 5,
  maximumFractionDigits: 5,
})

/** Arredonda para `casas` decimais e devolve 0 (nunca −0) quando o resultado é zero. */
function arredondar(valor: number, casas: number): number {
  const fator = 10 ** casas
  const arredondado = Math.round(valor * fator) / fator
  return arredondado === 0 ? 0 : arredondado
}

function prefixoSinal(valor: number, mostrarMais: boolean): string {
  if (valor < 0) return SINAL_MENOS
  if (valor > 0 && mostrarMais) return '+'
  return ''
}

function formatarAltitude(valor: number): string {
  const v = arredondar(valor, 0)
  return prefixoSinal(v, false) + formatadorInteiro.format(Math.abs(v))
}

function formatarVelocidadeIndicada(valor: number): string {
  const v = Math.max(0, arredondar(valor, 0))
  return formatadorInteiro.format(v)
}

function formatarVelocidadeVertical(valor: number): string {
  const v = arredondar(Math.round(valor / 10) * 10, 0)
  return prefixoSinal(v, true) + formatadorInteiro.format(Math.abs(v))
}

function formatarRumo(valor: number): string {
  const v = ((arredondar(valor, 0) % 360) + 360) % 360
  return String(v).padStart(3, '0')
}

function formatarArfagem(valor: number): string {
  const exibido = PITCH_POSITIVO_NARIZ_PARA_BAIXO ? -valor : valor
  const v = arredondar(exibido, 1)
  return prefixoSinal(v, true) + formatadorUmaCasa.format(Math.abs(v))
}

function formatarRolagem(valor: number): string {
  const v = arredondar(valor, 1)
  const absoluto = formatadorUmaCasa.format(Math.abs(v))
  if (v === 0) return absoluto
  const paraEsquerda = BANK_POSITIVO_PARA_ESQUERDA ? v > 0 : v < 0
  return `${absoluto} ${paraEsquerda ? 'E' : 'D'}`
}

/** Graus decimais com 5 casas, em valor absoluto, mais o hemisfério; zero sem letra. */
function formatarCoordenada(valor: number, positivo: string, negativo: string): string {
  const v = arredondar(valor, 5)
  const absoluto = formatadorCoordenada.format(Math.abs(v))
  if (v === 0) return absoluto
  return `${absoluto} ${v > 0 ? positivo : negativo}`
}

function formatarLatitude(valor: number): string {
  return formatarCoordenada(valor, 'N', 'S')
}

function formatarLongitude(valor: number): string {
  return formatarCoordenada(valor, 'L', 'O')
}

/** Inteiro com ponto de milhar; só o sinal de menos aparece (ex.: manete em reverso). */
function formatarInteiroComSinal(valor: number): string {
  const v = arredondar(valor, 0)
  return prefixoSinal(v, false) + formatadorInteiro.format(Math.abs(v))
}

function formatarFlapes(valor: number): string {
  const v = Math.min(100, Math.max(0, arredondar(valor, 0)))
  return formatadorInteiro.format(v)
}

function formatarGenerico(valor: number): string {
  const v = arredondar(valor, 1)
  return prefixoSinal(v, false) + formatadorUmaCasa.format(Math.abs(v))
}

/**
 * Formata o valor de um parâmetro para exibição no painel de tempo real (pt-BR).
 * A unidade não entra no texto: é exibida como rótulo à parte.
 * `null`, `NaN` e `Infinity` viram "—".
 */
export function formatParameterValue(parametroId: string, valor: number | null): string {
  if (valor === null || !Number.isFinite(valor)) return SEM_VALOR

  switch (parametroId) {
    case PARAMETER_IDS.ALTITUDE_MSL:
      return formatarAltitude(valor)
    case PARAMETER_IDS.AIRSPEED_IAS:
      return formatarVelocidadeIndicada(valor)
    case PARAMETER_IDS.VERTICAL_SPEED:
      return formatarVelocidadeVertical(valor)
    case PARAMETER_IDS.HEADING_MAGNETIC:
      return formatarRumo(valor)
    case PARAMETER_IDS.PITCH:
      return formatarArfagem(valor)
    case PARAMETER_IDS.BANK:
      return formatarRolagem(valor)
    case PARAMETER_IDS.LATITUDE:
      return formatarLatitude(valor)
    case PARAMETER_IDS.LONGITUDE:
      return formatarLongitude(valor)
    case PARAMETER_IDS.THROTTLE_1:
    case PARAMETER_IDS.MIXTURE_1:
    case PARAMETER_IDS.RPM_1:
      return formatarInteiroComSinal(valor)
    case PARAMETER_IDS.FLAPS:
      return formatarFlapes(valor)
    default:
      return formatarGenerico(valor)
  }
}
