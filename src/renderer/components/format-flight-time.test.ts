import { describe, it, expect } from 'vitest'
import {
  formatarDataDoVoo,
  formatarHoraDoVoo,
  formatarDuracaoDoVoo,
  formatarDuracaoPorExtenso,
  formatarSegundosHms,
  formatarSegundosPorExtenso,
  formatarHoraComSegundos,
  textoDoInstante,
} from './format-flight-time'

const SAO_PAULO = 'America/Sao_Paulo' // UTC−3, sem horário de verão
const TOQUIO = 'Asia/Tokyo' // UTC+9
const NOVA_YORK = 'America/New_York' // horário de verão começa em 08/03/2026, 02:00 local

function dois(n: number): string {
  return String(n).padStart(2, '0')
}

describe('formatarDataDoVoo', () => {
  it('deve formatar a data em dd/mm/aaaa no fuso informado', () => {
    expect(formatarDataDoVoo('2026-11-17T15:00:00.000Z', SAO_PAULO)).toBe('17/11/2026')
  })

  it('deve completar dia e mês com zero à esquerda', () => {
    expect(formatarDataDoVoo('2026-01-05T15:00:00.000Z', SAO_PAULO)).toBe('05/01/2026')
  })

  it('deve virar o dia conforme o fuso (mesmo instante, datas diferentes)', () => {
    const iso = '2026-11-17T02:30:00.000Z'
    expect(formatarDataDoVoo(iso, SAO_PAULO)).toBe('16/11/2026')
    expect(formatarDataDoVoo(iso, TOQUIO)).toBe('17/11/2026')
    expect(formatarDataDoVoo(iso, 'UTC')).toBe('17/11/2026')
  })

  it('deve virar o ano conforme o fuso', () => {
    expect(formatarDataDoVoo('2026-01-01T01:00:00.000Z', SAO_PAULO)).toBe('31/12/2025')
  })

  it('deve usar o fuso local da máquina quando o fuso não é informado', () => {
    const iso = '2026-11-17T02:30:00.000Z'
    const d = new Date(iso)
    expect(formatarDataDoVoo(iso)).toBe(
      `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`
    )
  })

  it('deve devolver "—" para data inválida', () => {
    expect(formatarDataDoVoo('nao-e-data', SAO_PAULO)).toBe('—')
    expect(formatarDataDoVoo('', SAO_PAULO)).toBe('—')
  })
})

describe('formatarHoraDoVoo', () => {
  it('deve formatar a hora em HH:mm, 24 h, sem segundos, no fuso informado', () => {
    expect(formatarHoraDoVoo('2026-11-17T17:45:59.000Z', SAO_PAULO)).toBe('14:45')
  })

  it('deve usar 24 h à tarde e à noite', () => {
    expect(formatarHoraDoVoo('2026-11-17T23:05:00.000Z', 'UTC')).toBe('23:05')
  })

  it('deve completar hora e minuto com zero à esquerda', () => {
    expect(formatarHoraDoVoo('2026-11-17T10:07:00.000Z', SAO_PAULO)).toBe('07:07')
  })

  it('deve mostrar a meia-noite como "00:00", e não "24:00"', () => {
    expect(formatarHoraDoVoo('2026-11-17T03:00:00.000Z', SAO_PAULO)).toBe('00:00')
    expect(formatarHoraDoVoo('2026-01-05T00:00:00.000Z', 'UTC')).toBe('00:00')
  })

  it('deve mudar a hora conforme o fuso', () => {
    const iso = '2026-11-17T02:30:00.000Z'
    expect(formatarHoraDoVoo(iso, SAO_PAULO)).toBe('23:30')
    expect(formatarHoraDoVoo(iso, TOQUIO)).toBe('11:30')
  })

  it('deve seguir o relógio local na virada do horário de verão', () => {
    expect(formatarHoraDoVoo('2026-03-08T06:30:00.000Z', NOVA_YORK)).toBe('01:30')
    expect(formatarHoraDoVoo('2026-03-08T07:30:00.000Z', NOVA_YORK)).toBe('03:30')
  })

  it('deve usar o fuso local da máquina quando o fuso não é informado', () => {
    const iso = '2026-11-17T02:30:00.000Z'
    const d = new Date(iso)
    expect(formatarHoraDoVoo(iso)).toBe(`${dois(d.getHours())}:${dois(d.getMinutes())}`)
  })

  it('deve devolver "—" para hora inválida', () => {
    expect(formatarHoraDoVoo('nao-e-data', SAO_PAULO)).toBe('—')
  })
})

describe('formatarDuracaoDoVoo', () => {
  const INICIO = '2026-11-17T10:00:00.000Z'

  function depois(segundos: number, ms = 0): string {
    return new Date(Date.parse(INICIO) + segundos * 1000 + ms).toISOString()
  }

  it('deve mostrar duração 0 como "0:00:00"', () => {
    expect(formatarDuracaoDoVoo(INICIO, INICIO)).toBe('0:00:00')
  })

  it('deve formatar em h:mm:ss, com minutos e segundos de 2 dígitos', () => {
    expect(formatarDuracaoDoVoo(INICIO, depois(3))).toBe('0:00:03')
    expect(formatarDuracaoDoVoo(INICIO, depois(59))).toBe('0:00:59')
    expect(formatarDuracaoDoVoo(INICIO, depois(60))).toBe('0:01:00')
    expect(formatarDuracaoDoVoo(INICIO, depois(3661))).toBe('1:01:01')
    expect(formatarDuracaoDoVoo(INICIO, depois(75 * 60 + 30))).toBe('1:15:30')
  })

  it('deve mostrar as horas sem limite (24 h ou mais)', () => {
    expect(formatarDuracaoDoVoo(INICIO, depois(24 * 3600))).toBe('24:00:00')
    expect(formatarDuracaoDoVoo(INICIO, depois(26 * 3600 + 3 * 60 + 9))).toBe('26:03:09')
    expect(formatarDuracaoDoVoo(INICIO, depois(123 * 3600 + 45 * 60 + 6))).toBe('123:45:06')
  })

  it('deve descartar a fração de segundo', () => {
    expect(formatarDuracaoDoVoo(INICIO, depois(1, 999))).toBe('0:00:01')
    expect(formatarDuracaoDoVoo(INICIO, depois(0, 999))).toBe('0:00:00')
  })

  it('não deve mudar com o horário de verão (duração pelos instantes, não pelo relógio local)', () => {
    // 01:30 EST → 03:30 EDT em Nova York: o relógio anda 2 h, o voo durou 1 h.
    expect(formatarDuracaoDoVoo('2026-03-08T06:30:00.000Z', '2026-03-08T07:30:00.000Z')).toBe(
      '1:00:00'
    )
  })

  it('deve calcular a duração com instantes em fusos diferentes no texto ISO', () => {
    expect(formatarDuracaoDoVoo('2026-11-17T07:00:00-03:00', '2026-11-17T10:30:00Z')).toBe(
      '0:30:00'
    )
  })

  it('deve devolver "—" quando o fim é nulo', () => {
    expect(formatarDuracaoDoVoo(INICIO, null)).toBe('—')
  })

  it('deve devolver "—" quando o fim é antes do início (duração negativa)', () => {
    expect(formatarDuracaoDoVoo(INICIO, depois(-1))).toBe('—')
  })

  it('deve devolver "—" quando o início ou o fim são inválidos', () => {
    expect(formatarDuracaoDoVoo('nao-e-data', INICIO)).toBe('—')
    expect(formatarDuracaoDoVoo(INICIO, 'nao-e-data')).toBe('—')
  })
})

describe('formatarDuracaoPorExtenso', () => {
  const INICIO = '2026-11-17T13:00:00.000Z'

  /** Fim a `segundos` do início. */
  function fim(segundos: number): string {
    return new Date(Date.parse(INICIO) + segundos * 1000).toISOString()
  }

  it('deve ler horas, minutos e segundos como "1 hora, 12 minutos e 5 segundos"', () => {
    expect(formatarDuracaoPorExtenso(INICIO, fim(3600 + 12 * 60 + 5))).toBe(
      '1 hora, 12 minutos e 5 segundos'
    )
  })

  it('deve omitir as horas zero: "12 minutos e 5 segundos"', () => {
    expect(formatarDuracaoPorExtenso(INICIO, fim(12 * 60 + 5))).toBe('12 minutos e 5 segundos')
  })

  it('deve usar o singular para 1 minuto e omitir os segundos zero: "1 minuto"', () => {
    expect(formatarDuracaoPorExtenso(INICIO, fim(60))).toBe('1 minuto')
  })

  it('deve ler só os segundos quando a duração é menor que 1 minuto: "5 segundos"', () => {
    expect(formatarDuracaoPorExtenso(INICIO, fim(5))).toBe('5 segundos')
  })

  it('deve usar o singular para 1 segundo', () => {
    expect(formatarDuracaoPorExtenso(INICIO, fim(1))).toBe('1 segundo')
  })

  it('deve ler a duração 0 como "0 segundos"', () => {
    expect(formatarDuracaoPorExtenso(INICIO, INICIO)).toBe('0 segundos')
  })

  it('deve descartar os milissegundos (menos de 1 s vira "0 segundos")', () => {
    expect(formatarDuracaoPorExtenso(INICIO, '2026-11-17T13:00:00.999Z')).toBe('0 segundos')
  })

  it('deve usar o plural em todas as partes maiores que 1', () => {
    expect(formatarDuracaoPorExtenso(INICIO, fim(2 * 3600 + 2 * 60 + 2))).toBe(
      '2 horas, 2 minutos e 2 segundos'
    )
  })

  it('deve usar o singular em todas as partes iguais a 1', () => {
    expect(formatarDuracaoPorExtenso(INICIO, fim(3600 + 60 + 1))).toBe(
      '1 hora, 1 minuto e 1 segundo'
    )
  })

  it('deve omitir os minutos zero: "1 hora e 5 segundos"', () => {
    expect(formatarDuracaoPorExtenso(INICIO, fim(3600 + 5))).toBe('1 hora e 5 segundos')
  })

  it('deve omitir os segundos zero: "1 hora e 12 minutos"', () => {
    expect(formatarDuracaoPorExtenso(INICIO, fim(3600 + 12 * 60))).toBe('1 hora e 12 minutos')
  })

  it('deve ler só as horas quando minutos e segundos são zero: "1 hora"', () => {
    expect(formatarDuracaoPorExtenso(INICIO, fim(3600))).toBe('1 hora')
  })

  it('deve ler horas sem limite, acima de 24', () => {
    expect(formatarDuracaoPorExtenso(INICIO, fim(26 * 3600 + 3 * 60 + 9))).toBe(
      '26 horas, 3 minutos e 9 segundos'
    )
  })

  it('deve calcular pelos instantes, sem mudar no horário de verão', () => {
    // 08/03/2026 em Nova York: 01:30 EST (06:30Z) a 03:30 EDT (07:30Z) é 1 hora real.
    expect(formatarDuracaoPorExtenso('2026-03-08T06:30:00.000Z', '2026-03-08T07:30:00.000Z')).toBe(
      '1 hora'
    )
  })

  it('deve devolver "duração indisponível" quando a hora de fim é nula', () => {
    expect(formatarDuracaoPorExtenso(INICIO, null)).toBe('duração indisponível')
  })

  it('deve devolver "duração indisponível" quando o início ou o fim são inválidos', () => {
    expect(formatarDuracaoPorExtenso('nao-e-data', fim(5))).toBe('duração indisponível')
    expect(formatarDuracaoPorExtenso(INICIO, 'nao-e-data')).toBe('duração indisponível')
    expect(formatarDuracaoPorExtenso('', '')).toBe('duração indisponível')
  })

  it('deve devolver "duração indisponível" quando o fim é anterior ao início', () => {
    expect(formatarDuracaoPorExtenso(INICIO, fim(-1))).toBe('duração indisponível')
  })
})

// --- UC-005 (CA-005-3, CA-005-12) ---

describe('formatarSegundosHms', () => {
  it('deve formatar em h:mm:ss com horas sem limite e sem zero à esquerda', () => {
    expect(formatarSegundosHms(0)).toBe('0:00:00')
    expect(formatarSegundosHms(725)).toBe('0:12:05')
    expect(formatarSegundosHms(3723)).toBe('1:02:03')
    expect(formatarSegundosHms(26 * 3600 + 3 * 60 + 9)).toBe('26:03:09')
  })

  it('deve descartar a fração e tratar negativo como zero', () => {
    expect(formatarSegundosHms(59.9)).toBe('0:00:59')
    expect(formatarSegundosHms(-3)).toBe('0:00:00')
  })
})

describe('formatarSegundosPorExtenso', () => {
  it('deve ler por extenso, omitindo as partes zero', () => {
    expect(formatarSegundosPorExtenso(0)).toBe('0 segundos')
    expect(formatarSegundosPorExtenso(1)).toBe('1 segundo')
    expect(formatarSegundosPorExtenso(725)).toBe('12 minutos e 5 segundos')
    expect(formatarSegundosPorExtenso(3600)).toBe('1 hora')
    expect(formatarSegundosPorExtenso(3723)).toBe('1 hora, 2 minutos e 3 segundos')
    expect(formatarSegundosPorExtenso(2 * 3600 + 60)).toBe('2 horas e 1 minuto')
  })

  it('deve descartar a fração de segundo', () => {
    expect(formatarSegundosPorExtenso(5.8)).toBe('5 segundos')
  })
})

describe('formatarHoraComSegundos', () => {
  it('deve formatar HH:mm:ss em 24 h no fuso informado', () => {
    expect(formatarHoraComSegundos(Date.parse('2026-11-17T17:17:05.000Z'), SAO_PAULO)).toBe(
      '14:17:05'
    )
    expect(formatarHoraComSegundos(Date.parse('2026-11-17T00:00:09.000Z'), 'UTC')).toBe('00:00:09')
  })

  it('deve devolver "—" para instante não finito', () => {
    expect(formatarHoraComSegundos(NaN, 'UTC')).toBe('—')
    expect(formatarHoraComSegundos(Infinity, 'UTC')).toBe('—')
  })
})

describe('textoDoInstante', () => {
  it('deve juntar decorrido e duração por extenso com a hora local', () => {
    expect(textoDoInstante(725, 3723, '14:17:05')).toBe(
      '12 minutos e 5 segundos de 1 hora, 2 minutos e 3 segundos, 14:17:05'
    )
  })
})
