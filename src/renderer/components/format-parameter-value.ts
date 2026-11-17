/** Texto exibido no lugar do valor quando não há leitura válida (sem sinal). */
export const SEM_VALOR = '—'

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
    case 'altitude_msl':
      return formatarAltitude(valor)
    case 'airspeed_ias':
      return formatarVelocidadeIndicada(valor)
    case 'vertical_speed':
      return formatarVelocidadeVertical(valor)
    case 'heading_magnetic':
      return formatarRumo(valor)
    case 'pitch':
      return formatarArfagem(valor)
    case 'bank':
      return formatarRolagem(valor)
    default:
      return formatarGenerico(valor)
  }
}
