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

/** Duração em segundos inteiros; `null` se um instante é inválido ou o fim vem antes do início. */
function duracaoEmSegundos(inicioIso: string, fimIso: string | null): number | null {
  const inicio = lerInstante(inicioIso)
  const fim = lerInstante(fimIso)
  if (inicio === null || fim === null) {
    return null
  }
  const totalMs = fim.getTime() - inicio.getTime()
  return totalMs < 0 ? null : Math.floor(totalMs / 1000)
}

/** Separa segundos em horas (sem limite), minutos e segundos, descartando a fração. */
function decompor(totalSegundos: number): { horas: number; minutos: number; segundos: number } {
  const inteiro = Math.max(0, Math.floor(totalSegundos))
  return {
    horas: Math.floor(inteiro / 3600),
    minutos: Math.floor((inteiro % 3600) / 60),
    segundos: inteiro % 60,
  }
}

function unidade(valor: number, singular: string, plural: string): string {
  return `${valor} ${valor === 1 ? singular : plural}`
}

/**
 * Segundos em h:mm:ss, com horas sem limite e sem zero à esquerda (ex.: "0:00:00",
 * "26:03:09"). A fração de segundo é descartada; negativo vira "0:00:00".
 */
export function formatarSegundosHms(totalSegundos: number): string {
  const { horas, minutos, segundos } = decompor(totalSegundos)
  return `${horas}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
}

/**
 * Segundos por extenso para o leitor de tela, ex.: "1 hora, 12 minutos e 5 segundos",
 * "12 minutos e 5 segundos", "0 segundos". Omite as partes zero, exceto quando tudo é
 * zero. A fração de segundo é descartada.
 */
export function formatarSegundosPorExtenso(totalSegundos: number): string {
  const { horas, minutos, segundos } = decompor(totalSegundos)
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
  const totalSegundos = duracaoEmSegundos(inicioIso, fimIso)
  return totalSegundos === null ? VALOR_AUSENTE : formatarSegundosHms(totalSegundos)
}

/** Usado no rótulo acessível quando a duração não pode ser calculada. */
export const DURACAO_INDISPONIVEL = 'duração indisponível'

/**
 * Duração por extenso para o leitor de tela (UC-004), ex.: "1 hora, 12 minutos e 5
 * segundos", "12 minutos e 5 segundos", "0 segundos". Omite as partes zero, exceto quando
 * tudo é zero. Fim ausente, valor inválido ou fim antes do início viram
 * "duração indisponível".
 */
export function formatarDuracaoPorExtenso(inicioIso: string, fimIso: string | null): string {
  const totalSegundos = duracaoEmSegundos(inicioIso, fimIso)
  return totalSegundos === null ? DURACAO_INDISPONIVEL : formatarSegundosPorExtenso(totalSegundos)
}

/**
 * Hora no fuso local da máquina, em 24 h com segundos (HH:mm:ss), a partir de um instante
 * em ms UTC (UC-005, hora local do instante selecionado). `timeZone` fixa o fuso (usado
 * nos testes). Valor inválido vira "—".
 */
export function formatarHoraComSegundos(instanteMs: number, timeZone?: string): string {
  if (!Number.isFinite(instanteMs)) {
    return VALOR_AUSENTE
  }
  const p = partes(
    new Date(instanteMs),
    { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' },
    timeZone
  )
  return `${p.hour ?? ''}:${p.minute ?? ''}:${p.second ?? ''}`
}

/**
 * Texto do instante para o leitor de tela (`aria-valuetext` da linha do tempo, UC-005):
 * tempo decorrido e duração por extenso, mais a hora local, ex.: "12 minutos e 5 segundos
 * de 1 hora, 2 minutos e 3 segundos, 14:17:05".
 */
export function textoDoInstante(
  decorridoSegundos: number,
  duracaoSegundos: number,
  horaLocal: string
): string {
  return `${formatarSegundosPorExtenso(decorridoSegundos)} de ${formatarSegundosPorExtenso(duracaoSegundos)}, ${horaLocal}`
}
