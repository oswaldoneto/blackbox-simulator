/** Exibido quando a data ou a duração não podem ser calculadas. */
const VALOR_AUSENTE = '—'

function lerInstante(iso: string | null): Date | null {
  if (iso === null) {
    return null
  }
  const data = new Date(iso)
  return Number.isNaN(data.getTime()) ? null : data
}

function partes(
  data: Date,
  opcoes: Intl.DateTimeFormatOptions,
  timeZone: string | undefined
): Partial<Record<Intl.DateTimeFormatPartTypes, string>> {
  const formato = new Intl.DateTimeFormat('pt-BR', { ...opcoes, timeZone })
  const resultado: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {}
  for (const parte of formato.formatToParts(data)) {
    resultado[parte.type] = parte.value
  }
  return resultado
}

/**
 * Data no fuso local da máquina, no formato dd/mm/aaaa (UC-004).
 * `timeZone` fixa o fuso (usado nos testes). Valor inválido vira "—".
 */
export function formatarDataDoVoo(iso: string, timeZone?: string): string {
  const data = lerInstante(iso)
  if (data === null) {
    return VALOR_AUSENTE
  }
  const p = partes(data, { day: '2-digit', month: '2-digit', year: 'numeric' }, timeZone)
  return `${p.day ?? ''}/${p.month ?? ''}/${p.year ?? ''}`
}

/**
 * Hora no fuso local da máquina, em 24 h sem segundos (HH:mm), com meia-noite "00:00".
 * `timeZone` fixa o fuso (usado nos testes). Valor inválido vira "—".
 */
export function formatarHoraDoVoo(iso: string, timeZone?: string): string {
  const data = lerInstante(iso)
  if (data === null) {
    return VALOR_AUSENTE
  }
  const p = partes(data, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }, timeZone)
  return `${p.hour ?? ''}:${p.minute ?? ''}`
}

/**
 * Duração entre o início e o fim, em h:mm:ss, com horas sem limite (ex.: "0:00:00",
 * "26:03:09"). Calculada pelos instantes, não pelo relógio local, então não muda com o
 * horário de verão. Fim ausente, valor inválido ou fim antes do início viram "—".
 */
export function formatarDuracaoDoVoo(inicioIso: string, fimIso: string | null): string {
  const inicio = lerInstante(inicioIso)
  const fim = lerInstante(fimIso)
  if (inicio === null || fim === null) {
    return VALOR_AUSENTE
  }
  const totalMs = fim.getTime() - inicio.getTime()
  if (totalMs < 0) {
    return VALOR_AUSENTE
  }
  const totalSegundos = Math.floor(totalMs / 1000)
  const horas = Math.floor(totalSegundos / 3600)
  const minutos = Math.floor((totalSegundos % 3600) / 60)
  const segundos = totalSegundos % 60
  return `${horas}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
}

/** Usado no rótulo acessível quando a duração não pode ser calculada. */
export const DURACAO_INDISPONIVEL = 'duração indisponível'

function unidade(valor: number, singular: string, plural: string): string {
  return `${valor} ${valor === 1 ? singular : plural}`
}

/**
 * Duração por extenso para o leitor de tela (UC-004), ex.: "1 hora, 12 minutos e 5
 * segundos", "12 minutos e 5 segundos", "0 segundos". Omite as partes zero, exceto quando
 * tudo é zero. Fim ausente, valor inválido ou fim antes do início viram
 * "duração indisponível".
 */
export function formatarDuracaoPorExtenso(inicioIso: string, fimIso: string | null): string {
  const inicio = lerInstante(inicioIso)
  const fim = lerInstante(fimIso)
  if (inicio === null || fim === null) {
    return DURACAO_INDISPONIVEL
  }
  const totalMs = fim.getTime() - inicio.getTime()
  if (totalMs < 0) {
    return DURACAO_INDISPONIVEL
  }
  const totalSegundos = Math.floor(totalMs / 1000)
  const horas = Math.floor(totalSegundos / 3600)
  const minutos = Math.floor((totalSegundos % 3600) / 60)
  const segundos = totalSegundos % 60

  const itens: string[] = []
  if (horas > 0) {
    itens.push(unidade(horas, 'hora', 'horas'))
  }
  if (minutos > 0) {
    itens.push(unidade(minutos, 'minuto', 'minutos'))
  }
  if (segundos > 0 || itens.length === 0) {
    itens.push(unidade(segundos, 'segundo', 'segundos'))
  }
  if (itens.length === 1) {
    return itens[0]
  }
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`
}
