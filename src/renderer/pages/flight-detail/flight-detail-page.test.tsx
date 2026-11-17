import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest'
import { render, screen, cleanup, act, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PARAMETER_IDS } from '../../../shared/parameter-ids'
import type { ParametroId } from '../../../shared/parameter-ids'
import type { LeiturasDoVoo, ParametroDeVoo, SerieDeLeituras, Sessao } from '../../../shared/types'

const { mockGetLeiturasDoVoo, mockListActiveParametros } = vi.hoisted(() => ({
  mockGetLeiturasDoVoo: vi.fn(),
  mockListActiveParametros: vi.fn(),
}))

vi.mock('../../ipc/session-ipc', () => ({
  getLeiturasDoVoo: (sessaoId: string) => mockGetLeiturasDoVoo(sessaoId),
}))

vi.mock('../../ipc/parameter-ipc', () => ({
  listActiveParametros: () => mockListActiveParametros(),
}))

import {
  FlightDetailPage,
  CARREGANDO_DADOS_DO_VOO,
  ERRO_DADOS_DO_VOO,
  VOO_SEM_LEITURAS,
} from './flight-detail-page'
import { TRAJETORIA_INDISPONIVEL } from './trajectory-map'
import { INTERVALO_DA_REPRODUCAO_MS } from './use-reproducao'

const FUSO = 'America/Sao_Paulo' // UTC−3, sem horário de verão

/** Voo de 60 s, iniciado às 14:00:00 em São Paulo. */
const SESSAO: Sessao = {
  id: 'voo-1',
  iniciadaEm: '2026-11-17T17:00:00.000Z',
  encerradaEm: '2026-11-17T17:01:00.000Z',
  aeronave: 'Cessna 172',
  aerodromoOrigem: null,
  aerodromoDestino: null,
  status: 'encerrada',
  parametrosNaoAplicaveis: [],
}

const INICIO_MS = Date.parse(SESSAO.iniciadaEm)
const DURACAO_S = 60

/** Catálogo como no seed das migrations 001 e 002. */
const CATALOGO: ParametroDeVoo[] = [
  {
    id: PARAMETER_IDS.ALTITUDE_MSL,
    nome: 'Altitude MSL',
    unidade: 'ft',
    ativo: true,
  },
  {
    id: PARAMETER_IDS.AIRSPEED_IAS,
    nome: 'Velocidade IAS',
    unidade: 'kt',
    ativo: true,
  },
  {
    id: PARAMETER_IDS.VERTICAL_SPEED,
    nome: 'Velocidade vertical',
    unidade: 'fpm',
    ativo: true,
  },
  {
    id: PARAMETER_IDS.HEADING_MAGNETIC,
    nome: 'Rumo magnético',
    unidade: '°',
    ativo: true,
  },
  { id: PARAMETER_IDS.PITCH, nome: 'Arfagem', unidade: '°', ativo: true },
  { id: PARAMETER_IDS.BANK, nome: 'Rolagem', unidade: '°', ativo: true },
  { id: PARAMETER_IDS.LATITUDE, nome: 'Latitude', unidade: '°', ativo: true },
  { id: PARAMETER_IDS.LONGITUDE, nome: 'Longitude', unidade: '°', ativo: true },
  { id: PARAMETER_IDS.THROTTLE_1, nome: 'Manete', unidade: '%', ativo: true },
  { id: PARAMETER_IDS.MIXTURE_1, nome: 'Mistura', unidade: '%', ativo: true },
  { id: PARAMETER_IDS.RPM_1, nome: 'RPM', unidade: 'rpm', ativo: true },
  { id: PARAMETER_IDS.FLAPS, nome: 'Flapes', unidade: '%', ativo: true },
]

/** Valor bruto gravado de cada parâmetro no segundo `s` do voo. */
const VALOR_NO_SEGUNDO: Record<ParametroId, (s: number) => number> = {
  altitude_msl: (s) => 1000 + 10 * s,
  airspeed_ias: (s) => 90 + s,
  vertical_speed: () => 500,
  heading_magnetic: (s) => 90 + s,
  pitch: () => -5, // bruto: nariz 5° para cima
  bank: () => -10, // bruto: 10° para a direita
  latitude: (s) => -23.5 + s * 0.001,
  longitude: (s) => -46.6 + s * 0.001,
  throttle_1: () => 75,
  mixture_1: () => 80,
  rpm_1: () => 2300,
  flaps: () => 10,
}

const PARAMETROS_ANTIGOS: ParametroId[] = [
  PARAMETER_IDS.ALTITUDE_MSL,
  PARAMETER_IDS.AIRSPEED_IAS,
  PARAMETER_IDS.VERTICAL_SPEED,
  PARAMETER_IDS.HEADING_MAGNETIC,
  PARAMETER_IDS.PITCH,
  PARAMETER_IDS.BANK,
]

interface OpcoesDoVoo {
  parametros?: readonly ParametroId[]
  /** Segundos sem leitura (perda de dados). */
  falhas?: (s: number) => boolean
  valores?: Partial<Record<ParametroId, (s: number) => number>>
}

/** Leituras de 1 Hz do segundo 0 ao 60, inclusive. */
function leiturasDoVoo(opcoes: OpcoesDoVoo = {}): LeiturasDoVoo {
  const parametros = opcoes.parametros ?? (Object.values(PARAMETER_IDS) as ParametroId[])
  const segundos = Array.from({ length: DURACAO_S + 1 }, (_, s) => s).filter(
    (s) => !(opcoes.falhas?.(s) ?? false)
  )
  const series: SerieDeLeituras[] = parametros.map((parametroId) => {
    const valor = opcoes.valores?.[parametroId] ?? VALOR_NO_SEGUNDO[parametroId]
    return {
      parametroId,
      instantes: segundos.map((s) => INICIO_MS + s * 1000),
      valores: segundos.map(valor),
    }
  })
  return { sessaoId: SESSAO.id, series }
}

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

async function renderPagina(
  opcoes: {
    sessao?: Sessao
    leituras?: LeiturasDoVoo
    onVoltar?: () => void
  } = {}
): Promise<ReturnType<typeof render>> {
  mockGetLeiturasDoVoo.mockResolvedValue(opcoes.leituras ?? leiturasDoVoo())
  const r = render(
    <FlightDetailPage
      sessao={opcoes.sessao ?? SESSAO}
      onVoltar={opcoes.onVoltar ?? vi.fn()}
      timeZone={FUSO}
    />
  )
  await flush()
  return r
}

function linhaDoTempo(): HTMLInputElement {
  return screen.getByRole('slider', {
    name: 'Instante do voo',
  }) as HTMLInputElement
}

function irPara(segundo: number): void {
  fireEvent.change(linhaDoTempo(), { target: { value: String(segundo) } })
}

function textoDoTempo(container: HTMLElement): string {
  return (container.querySelector('.flight-player__time')?.textContent ?? '').replace(/\s+/g, ' ')
}

function instrumento(nome: string | RegExp): HTMLElement {
  return screen.getByRole('group', { name: nome })
}

function ponteirosDe(grupo: HTMLElement): string[] {
  return Array.from(grupo.querySelectorAll('g[transform^="rotate("]')).map(
    (g) => g.getAttribute('transform') ?? ''
  )
}

function aeronave(container: HTMLElement): Element | null {
  return container.querySelector('.trajectory__aircraft')
}

function cursorDoPerfil(container: HTMLElement): Element {
  return container.querySelector('.vertical-profile__cursor') as Element
}

function subcaminhos(d: string | null | undefined): number {
  return (d ?? '').split('M').length - 1
}

describe('FlightDetailPage', () => {
  let consoleError: MockInstance<Parameters<typeof console.error>, void>

  beforeEach(() => {
    vi.clearAllMocks()
    mockListActiveParametros.mockResolvedValue(CATALOGO)
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    consoleError.mockRestore()
  })

  // ---------- CA-005-1: abertura ----------

  describe('CA-005-1: abertura', () => {
    it('deve exibir o título "Voo de dd/mm/aaaa", o início HH:mm e a duração h:mm:ss', async () => {
      const { container } = await renderPagina()

      expect(
        screen.getByRole('heading', { level: 1, name: 'Voo de 17/11/2026' })
      ).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Voo de 17/11/2026' })).toBeInTheDocument()
      const meta = container.querySelector('#flight-detail-meta') as HTMLElement
      expect(meta).toHaveTextContent('Início 14:00')
      expect(within(meta).getByText('0:01:00')).toBeInTheDocument()
    })

    it('deve pedir as leituras do voo pelo id da sessão', async () => {
      await renderPagina()
      expect(mockGetLeiturasDoVoo).toHaveBeenCalledWith('voo-1')
    })

    it('deve abrir pausada em 0:00:00, a 1×', async () => {
      const { container } = await renderPagina()

      expect(screen.getByRole('button', { name: 'Reproduzir o voo' })).toBeInTheDocument()
      expect(linhaDoTempo().value).toBe('0')
      expect(textoDoTempo(container)).toBe('0:00:00 de 0:01:00 · 14:00:00')
      expect(screen.getByRole('button', { name: '1×' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: '4×' })).toHaveAttribute('aria-pressed', 'false')
      expect(screen.getByRole('button', { name: '16×' })).toHaveAttribute('aria-pressed', 'false')
    })

    it('deve limitar a linha do tempo à hora de fim', async () => {
      await renderPagina()

      expect(linhaDoTempo()).toHaveAttribute('min', '0')
      expect(linhaDoTempo()).toHaveAttribute('max', String(DURACAO_S))
      expect(linhaDoTempo()).toHaveAttribute('step', '1')
    })

    it('não deve exibir a aeronave nem o aviso provisório', async () => {
      const { container } = await renderPagina()
      expect(container.textContent).not.toContain('Cessna')
      expect(container.textContent).not.toContain('Debriefing disponível em breve')
    })

    it('deve exibir "—" na duração quando a hora de fim é nula', async () => {
      const { container } = await renderPagina({
        sessao: { ...SESSAO, encerradaEm: null },
      })
      const meta = container.querySelector('#flight-detail-meta') as HTMLElement
      expect(within(meta).getByText('—')).toBeInTheDocument()
      expect(within(meta).getByText('indisponível')).toBeInTheDocument()
    })
  })

  // ---------- CA-005-2: os 12 parâmetros ----------

  describe('CA-005-2: os 12 parâmetros', () => {
    it('deve mostrar os 12 valores formatados no instante, com arfagem e rolagem no sinal de exibição', async () => {
      const { container } = await renderPagina()
      irPara(10)

      expect(instrumento('Velocidade IAS: 100 kt')).toBeInTheDocument()
      expect(instrumento('Arfagem: +5,0 °, Rolagem: 10,0 D °')).toBeInTheDocument()
      expect(instrumento('Altitude MSL: 1.100 ft')).toBeInTheDocument()
      expect(instrumento('RPM: 2.300 rpm')).toBeInTheDocument()
      expect(instrumento('Rumo magnético: 100 °')).toBeInTheDocument()
      expect(instrumento('Velocidade vertical: +500 fpm')).toBeInTheDocument()
      expect(instrumento('Manete: 75 %, Mistura: 80 %')).toBeInTheDocument()
      expect(instrumento('Flapes: 10 %')).toBeInTheDocument()

      const posicao = container.querySelector('.trajectory__position') as HTMLElement
      expect(posicao).toHaveTextContent('Latitude 23,49000 S')
      expect(posicao).toHaveTextContent('Longitude 46,59000 O')
      expect(
        screen.getByRole('img', {
          name: /Latitude 23,49000 S, Longitude 46,59000 O/,
        })
      ).toBeInTheDocument()
    })

    it('deve mostrar o valor numérico visível em cada instrumento', async () => {
      await renderPagina()
      irPara(10)

      expect(within(instrumento(/^Velocidade IAS:/)).getByText('100')).toBeInTheDocument()
      expect(within(instrumento(/^Arfagem:/)).getByText('+5,0')).toBeInTheDocument()
      expect(within(instrumento(/^Arfagem:/)).getByText('10,0 D')).toBeInTheDocument()
      expect(within(instrumento(/^Flapes:/)).getByText('10')).toBeInTheDocument()
    })

    it('deve esconder o desenho dos instrumentos do leitor de tela', async () => {
      await renderPagina()
      const desenho = instrumento(/^Velocidade IAS:/).querySelector('.instrument__drawing')
      expect(desenho).toHaveAttribute('aria-hidden', 'true')
    })
  })

  // ---------- CA-005-3: linha do tempo ----------

  describe('CA-005-3: linha do tempo', () => {
    it('deve atualizar instrumentos, aeronave e cursor do perfil ao mover o controle', async () => {
      const { container } = await renderPagina()
      const cursorAntes = cursorDoPerfil(container).getAttribute('x1')

      irPara(30)

      expect(instrumento('Altitude MSL: 1.300 ft')).toBeInTheDocument()
      expect(instrumento('Velocidade IAS: 120 kt')).toBeInTheDocument()
      expect(aeronave(container)?.getAttribute('transform')).toContain('rotate(120.0)')
      expect(cursorDoPerfil(container).getAttribute('x1')).toBe('500.0')
      expect(cursorAntes).toBe('0.0')
    })

    it('deve mostrar "h:mm:ss de h:mm:ss" e a hora local HH:mm:ss do instante', async () => {
      const { container } = await renderPagina()

      irPara(45)

      expect(textoDoTempo(container)).toBe('0:00:45 de 0:01:00 · 14:00:45')
      expect(linhaDoTempo().value).toBe('45')
    })

    it('deve mostrar a hora local no fuso informado', async () => {
      mockGetLeiturasDoVoo.mockResolvedValue(leiturasDoVoo())
      const { container } = render(
        <FlightDetailPage sessao={SESSAO} onVoltar={vi.fn()} timeZone="UTC" />
      )
      await flush()

      expect(textoDoTempo(container)).toBe('0:00:00 de 0:01:00 · 17:00:00')
    })

    it('deve ser focável pelo teclado entre os controles', async () => {
      await renderPagina()

      await userEvent.tab()
      expect(screen.getByRole('button', { name: 'Reproduzir o voo' })).toHaveFocus()
      await userEvent.tab()
      expect(screen.getByRole('button', { name: '1×' })).toHaveFocus()
      await userEvent.tab()
      await userEvent.tab()
      await userEvent.tab()
      expect(linhaDoTempo()).toHaveFocus()
    })
  })

  // ---------- CA-005-4: reprodução ----------

  describe('CA-005-4: reprodução', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    function avancar(ms: number): void {
      act(() => {
        vi.advanceTimersByTime(ms)
      })
    }

    it('deve reproduzir a 1× e pausar', async () => {
      const { container } = await renderPagina()

      fireEvent.click(screen.getByRole('button', { name: 'Reproduzir o voo' }))
      avancar(3000)

      expect(linhaDoTempo().value).toBe('3')
      expect(textoDoTempo(container)).toBe('0:00:03 de 0:01:00 · 14:00:03')
      fireEvent.click(screen.getByRole('button', { name: 'Pausar' }))
      avancar(5000)
      expect(linhaDoTempo().value).toBe('3')
      expect(screen.getByRole('button', { name: 'Reproduzir o voo' })).toBeInTheDocument()
    })

    it.each([
      ['4×', '8'],
      ['16×', '32'],
    ])('deve reproduzir a %s', async (velocidade, esperado) => {
      await renderPagina()

      fireEvent.click(screen.getByRole('button', { name: velocidade }))
      expect(screen.getByRole('button', { name: velocidade })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
      expect(screen.getByRole('button', { name: '1×' })).toHaveAttribute('aria-pressed', 'false')
      fireEvent.click(screen.getByRole('button', { name: 'Reproduzir o voo' }))
      avancar(2000)

      expect(linhaDoTempo().value).toBe(esperado)
    })

    it('deve pausar no fim, sem timer, e recomeçar do zero ao reproduzir no fim', async () => {
      await renderPagina()

      fireEvent.click(screen.getByRole('button', { name: '16×' }))
      fireEvent.click(screen.getByRole('button', { name: 'Reproduzir o voo' }))
      avancar(10_000)

      expect(linhaDoTempo().value).toBe(String(DURACAO_S))
      expect(screen.getByRole('button', { name: 'Reproduzir o voo' })).toBeInTheDocument()
      expect(vi.getTimerCount()).toBe(0)

      fireEvent.click(screen.getByRole('button', { name: 'Reproduzir o voo' }))
      expect(linhaDoTempo().value).toBe('0')
      avancar(INTERVALO_DA_REPRODUCAO_MS * 4)
      expect(linhaDoTempo().value).toBe('16')
    })

    it('deve continuar de onde a linha do tempo foi posta', async () => {
      await renderPagina()

      irPara(50)
      fireEvent.click(screen.getByRole('button', { name: 'Reproduzir o voo' }))
      avancar(2000)

      expect(linhaDoTempo().value).toBe('52')
    })
  })

  // ---------- CA-005-5: trajetória ----------

  describe('CA-005-5: trajetória', () => {
    it('deve desenhar a trajetória inteira tracejada, o trecho até o instante em azul e a aeronave pelo rumo', async () => {
      const { container } = await renderPagina()
      irPara(20)

      const mapa = screen.getByRole('img', {
        name: /^Trajetória do voo, com o norte para cima/,
      })
      const restante = mapa.querySelector('.trajectory__remaining')
      const voado = mapa.querySelector('.trajectory__flown')
      expect(subcaminhos(restante?.getAttribute('d'))).toBe(1)
      expect(voado).not.toBeNull()
      expect((voado?.getAttribute('d') ?? '').split('L').length).toBeLessThan(
        (restante?.getAttribute('d') ?? '').split('L').length
      )
      expect(aeronave(container)?.getAttribute('transform')).toMatch(
        /^translate\([\d.]+ [\d.]+\) rotate\(110\.0\)$/
      )
    })

    it('não deve ter mapa de fundo nem pista', async () => {
      const { container } = await renderPagina()
      const mapa = container.querySelector('.trajectory__map') as SVGElement
      expect(mapa.querySelector('image')).toBeNull()
      expect(
        mapa.querySelectorAll('path.trajectory__remaining, path.trajectory__flown').length
      ).toBe(2)
    })

    it('deve mostrar a legenda do mapa com o texto aprovado no HITL-3', async () => {
      const { container } = await renderPagina()
      const legenda = container.querySelector('.trajectory .flight-section__caption')

      expect(legenda).toHaveTextContent(
        'Linha azul contínua: trecho já voado. Tracejado: restante. Falhas na linha: sem dados. ' +
          'A aeronave aponta para o rumo magnético do instante; sem rumo, aparece como um círculo.'
      )
    })

    it('deve mostrar um marcador circular quando a posição existe e o rumo não', async () => {
      const { container } = await renderPagina({
        leituras: leiturasDoVoo({
          parametros: [PARAMETER_IDS.LATITUDE, PARAMETER_IDS.LONGITUDE, PARAMETER_IDS.ALTITUDE_MSL],
        }),
      })
      expect(aeronave(container)?.tagName.toLowerCase()).toBe('circle')
    })
  })

  // ---------- CA-005-6: perfil vertical ----------

  describe('CA-005-6: perfil vertical', () => {
    it('deve desenhar a altitude da duração inteira com o cursor no instante', async () => {
      const { container } = await renderPagina()
      irPara(15)

      const perfil = screen.getByRole('img', {
        name: /^Perfil vertical do voo/,
      })
      expect(perfil).toHaveAccessibleName(
        'Perfil vertical do voo: Altitude MSL de 1.000 a 1.600 ft; no instante, 1.150 ft'
      )
      expect(cursorDoPerfil(container).getAttribute('x1')).toBe('250.0')
      irPara(DURACAO_S)
      expect(cursorDoPerfil(container).getAttribute('x1')).toBe('1000.0')
    })

    it('deve mostrar as marcas de tempo da duração e a altitude e a VS do instante', async () => {
      const { container } = await renderPagina()
      irPara(15)

      const eixo = container.querySelector('.vertical-profile__axis-x') as HTMLElement
      expect(Array.from(eixo.children).map((c) => c.textContent)).toEqual([
        '0:00:00',
        '0:00:15',
        '0:00:30',
        '0:00:45',
        '0:01:00',
      ])
      const leitura = container.querySelector('.vertical-profile__readout') as HTMLElement
      expect(leitura).toHaveTextContent('Altitude MSL 1.150 ft · Velocidade vertical +500 fpm')
    })

    it('deve preservar um pico isolado como máximo do perfil', async () => {
      await renderPagina({
        leituras: leiturasDoVoo({
          valores: { altitude_msl: (s) => (s === 33 ? 9000 : 1000) },
        }),
      })
      expect(screen.getByRole('img', { name: /^Perfil vertical do voo/ })).toHaveAccessibleName(
        /de 1\.000 a 9\.000 ft/
      )
    })
  })

  // ---------- CA-005-7: N/A ----------

  describe('CA-005-7: N/A', () => {
    it('deve mostrar a mistura N/A o voo todo, sem ponteiro, com rótulo "não aplicável"', async () => {
      const { container } = await renderPagina({
        sessao: {
          ...SESSAO,
          parametrosNaoAplicaveis: [PARAMETER_IDS.MIXTURE_1],
        },
      })

      for (const segundo of [0, 30, 60]) {
        irPara(segundo)
        const alavancas = instrumento('Manete: 75 %, Mistura: não aplicável')
        expect(within(alavancas).getByText('N/A')).toBeInTheDocument()
      }
      expect(container.querySelector('.lever-quadrant__mixture')).toBeNull()
      expect(container.querySelector('.lever-quadrant__throttle')).not.toBeNull()
    })

    it('deve fazer N/A vencer "sem dados" e "sem dados neste voo"', async () => {
      await renderPagina({
        sessao: {
          ...SESSAO,
          parametrosNaoAplicaveis: [PARAMETER_IDS.FLAPS, PARAMETER_IDS.RPM_1],
        },
        leituras: leiturasDoVoo({
          parametros: (Object.values(PARAMETER_IDS) as ParametroId[]).filter(
            (id) => id !== PARAMETER_IDS.FLAPS
          ),
          falhas: (s) => s >= 20 && s <= 40,
        }),
      })
      irPara(30)

      expect(instrumento('Flapes: não aplicável')).toBeInTheDocument()
      expect(instrumento('RPM: não aplicável')).toBeInTheDocument()
      expect(instrumento('Velocidade IAS: sem dados')).toBeInTheDocument()
    })

    it('não deve mostrar N/A com a lista vazia (sessão antiga)', async () => {
      await renderPagina({
        sessao: { ...SESSAO, parametrosNaoAplicaveis: [] },
      })
      expect(instrumento('Manete: 75 %, Mistura: 80 %')).toBeInTheDocument()
      expect(screen.queryByText('N/A')).not.toBeInTheDocument()
    })
  })

  // ---------- CA-005-8: perda de dados no instante ----------

  describe('CA-005-8: perda de dados no instante', () => {
    const COM_FALHA = (): LeiturasDoVoo => leiturasDoVoo({ falhas: (s) => s >= 20 && s <= 40 })

    it('deve mostrar "—" com rótulo "sem dados" e esconder ponteiro e aeronave', async () => {
      const { container } = await renderPagina({ leituras: COM_FALHA() })
      irPara(30)

      const ias = instrumento('Velocidade IAS: sem dados')
      expect(within(ias).getByText('—')).toBeInTheDocument()
      expect(ponteirosDe(ias)).toEqual([])
      expect(instrumento('Arfagem: sem dados, Rolagem: sem dados')).toBeInTheDocument()
      expect(aeronave(container)).toBeNull()
      expect(container.querySelector('.trajectory__position')).toHaveTextContent('Latitude — ')
      expect(
        screen.getByRole('img', { name: /Posição no instante: sem dados$/ })
      ).toBeInTheDocument()
    })

    it('deve manter o valor até 1 s depois da última leitura e mostrar "—" aos 2 s', async () => {
      await renderPagina({ leituras: COM_FALHA() })

      irPara(20) // última leitura aos 19 s
      expect(instrumento('Velocidade IAS: 109 kt')).toBeInTheDocument()
      irPara(21)
      expect(instrumento('Velocidade IAS: sem dados')).toBeInTheDocument()
      irPara(41)
      expect(instrumento('Velocidade IAS: 131 kt')).toBeInTheDocument()
    })

    it('deve interromper a trajetória e o perfil no trecho sem dados', async () => {
      const { container } = await renderPagina({ leituras: COM_FALHA() })

      expect(
        subcaminhos(container.querySelector('.trajectory__remaining')?.getAttribute('d'))
      ).toBe(2)
      expect(
        subcaminhos(container.querySelector('.vertical-profile__line')?.getAttribute('d'))
      ).toBe(2)
    })

    it('deve mostrar "—" no instante 0:00:00 quando a primeira leitura chega depois do início', async () => {
      await renderPagina({
        leituras: leiturasDoVoo({ falhas: (s) => s === 0 }),
      })
      expect(instrumento('Velocidade IAS: sem dados')).toBeInTheDocument()
      irPara(1)
      expect(instrumento('Velocidade IAS: 91 kt')).toBeInTheDocument()
    })
  })

  // ---------- CA-005-9: voo sem os 6 parâmetros novos ----------

  describe('CA-005-9: voo sem os 6 parâmetros novos', () => {
    it('deve mostrar "Sem dados neste voo" nos parâmetros sem leitura e a trajetória indisponível', async () => {
      const { container } = await renderPagina({
        leituras: leiturasDoVoo({ parametros: PARAMETROS_ANTIGOS }),
      })

      expect(instrumento('RPM: sem dados neste voo')).toBeInTheDocument()
      expect(
        instrumento('Manete: sem dados neste voo, Mistura: sem dados neste voo')
      ).toBeInTheDocument()
      expect(instrumento('Flapes: sem dados neste voo')).toBeInTheDocument()
      expect(within(instrumento(/^RPM:/)).getByText('Sem dados neste voo')).toBeInTheDocument()
      expect(ponteirosDe(instrumento(/^RPM:/))).toEqual([])
      expect(screen.getByText(TRAJETORIA_INDISPONIVEL)).toBeInTheDocument()
      expect(container.querySelector('.trajectory__map')).toBeNull()
      // Os 6 parâmetros antigos continuam com valor.
      expect(instrumento('Velocidade IAS: 90 kt')).toBeInTheDocument()
      expect(screen.getByRole('slider', { name: 'Instante do voo' })).toBeInTheDocument()
    })

    it('deve mostrar a trajetória indisponível quando há só a latitude', async () => {
      await renderPagina({
        leituras: leiturasDoVoo({
          parametros: [...PARAMETROS_ANTIGOS, PARAMETER_IDS.LATITUDE],
        }),
      })
      expect(screen.getByText(TRAJETORIA_INDISPONIVEL)).toBeInTheDocument()
    })

    it('deve mostrar "Sem dados neste voo" no perfil quando não há altitude', async () => {
      await renderPagina({
        leituras: leiturasDoVoo({ parametros: [PARAMETER_IDS.AIRSPEED_IAS] }),
      })
      expect(screen.getByText('Altitude MSL: Sem dados neste voo')).toBeInTheDocument()
      expect(screen.queryByRole('img', { name: /^Perfil vertical do voo/ })).not.toBeInTheDocument()
    })
  })

  // ---------- CA-005-10: voo sem leituras ----------

  describe('CA-005-10: voo sem leituras', () => {
    it('deve mostrar só o cabeçalho e a mensagem, sem reprodução, instrumentos, mapa nem perfil', async () => {
      await renderPagina({ leituras: { sessaoId: SESSAO.id, series: [] } })

      expect(
        screen.getByRole('heading', { level: 1, name: 'Voo de 17/11/2026' })
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Voltar à lista' })).toBeInTheDocument()
      expect(screen.getByText(VOO_SEM_LEITURAS)).toBeInTheDocument()
      expect(VOO_SEM_LEITURAS).toBe('Nenhuma leitura gravada neste voo.')
      expect(screen.queryByRole('slider')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Reproduzir o voo' })).not.toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: 'Painel de instrumentos' })
      ).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Trajetória' })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Perfil vertical' })).not.toBeInTheDocument()
    })

    it('deve anunciar a mensagem de voo sem leituras numa região role="status"', async () => {
      await renderPagina({ leituras: { sessaoId: SESSAO.id, series: [] } })

      const regiao = screen.getByRole('status')
      expect(regiao).toHaveTextContent(VOO_SEM_LEITURAS)
      expect(regiao).toHaveAttribute('id', 'flight-detail-sem-leituras')
      expect(screen.getAllByRole('status')).toHaveLength(1)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it.each<[string, () => LeiturasDoVoo]>([
      ['todos os parâmetros', () => leiturasDoVoo()],
      ['só os parâmetros antigos', () => leiturasDoVoo({ parametros: PARAMETROS_ANTIGOS })],
      ['perda de dados', () => leiturasDoVoo({ falhas: (s) => s >= 20 && s < 30 })],
      ['só um parâmetro', () => leiturasDoVoo({ parametros: [PARAMETER_IDS.ALTITUDE_MSL] })],
    ])(
      'não deve mostrar região role="status" com a mensagem de voo sem leituras com leituras (%s)',
      async (_caso, leituras) => {
        await renderPagina({ leituras: leituras() })

        expect(linhaDoTempo()).toBeInTheDocument()
        expect(
          screen.queryAllByRole('status').filter((r) => r.textContent?.includes(VOO_SEM_LEITURAS))
        ).toHaveLength(0)
        expect(screen.queryByText(VOO_SEM_LEITURAS)).not.toBeInTheDocument()
        expect(document.getElementById('flight-detail-sem-leituras')).toBeNull()
      }
    )

    it('deve incluir a mensagem de voo sem leituras na descrição de "Voltar à lista"', async () => {
      await renderPagina({ leituras: { sessaoId: SESSAO.id, series: [] } })
      const botao = screen.getByRole('button', { name: 'Voltar à lista' })

      expect(botao.getAttribute('aria-describedby')).toBe(
        'flight-detail-title flight-detail-meta flight-detail-sem-leituras'
      )
      expect(document.getElementById('flight-detail-sem-leituras')).toHaveTextContent(
        VOO_SEM_LEITURAS
      )
      expect(botao).toHaveAccessibleDescription(
        /^Voo de 17\/11\/2026 Início 14:00 · Duração\s*1 minuto Nenhuma leitura gravada neste voo\.$/
      )
      expect(botao).toHaveFocus()
    })

    it('não deve incluir a mensagem de voo sem leituras na descrição enquanto carrega nem no erro', async () => {
      let falhar: (erro: Error) => void = () => {}
      mockGetLeiturasDoVoo.mockReturnValue(
        new Promise<LeiturasDoVoo>((_, rejeitar) => {
          falhar = rejeitar
        })
      )
      render(<FlightDetailPage sessao={SESSAO} onVoltar={vi.fn()} timeZone={FUSO} />)
      const botao = screen.getByRole('button', { name: 'Voltar à lista' })

      expect(botao.getAttribute('aria-describedby')).toBe('flight-detail-title flight-detail-meta')
      expect(document.getElementById('flight-detail-sem-leituras')).toBeNull()

      falhar(new Error('falha'))
      await flush()

      expect(screen.getByRole('alert')).toHaveTextContent(ERRO_DADOS_DO_VOO)
      expect(botao.getAttribute('aria-describedby')).toBe('flight-detail-title flight-detail-meta')
      expect(document.getElementById('flight-detail-sem-leituras')).toBeNull()
    })
  })

  // ---------- CA-005-11: carregamento e erro ----------

  describe('CA-005-11: carregamento e erro', () => {
    it('deve mostrar "Carregando dados do voo..." com role="status" só depois de 500 ms', async () => {
      vi.useFakeTimers()
      mockGetLeiturasDoVoo.mockReturnValue(new Promise(() => {}))
      render(<FlightDetailPage sessao={SESSAO} onVoltar={vi.fn()} timeZone={FUSO} />)

      act(() => {
        vi.advanceTimersByTime(499)
      })
      expect(screen.queryByText(CARREGANDO_DADOS_DO_VOO)).not.toBeInTheDocument()
      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(screen.getByRole('status')).toHaveTextContent(CARREGANDO_DADOS_DO_VOO)
      expect(CARREGANDO_DADOS_DO_VOO).toBe('Carregando dados do voo...')
      // O cabeçalho já aparece durante o carregamento.
      expect(screen.getByRole('button', { name: 'Voltar à lista' })).toHaveFocus()
    })

    it('deve mostrar o erro com role="alert" dizendo o que fazer', async () => {
      mockGetLeiturasDoVoo.mockRejectedValue(new Error('falha'))
      render(<FlightDetailPage sessao={SESSAO} onVoltar={vi.fn()} timeZone={FUSO} />)
      await flush()

      expect(screen.getByRole('alert')).toHaveTextContent(ERRO_DADOS_DO_VOO)
      expect(ERRO_DADOS_DO_VOO).toBe(
        'Não foi possível carregar os dados do voo. Volte à lista e abra o voo de novo.'
      )
      expect(screen.queryByRole('slider')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Voltar à lista' })).toBeInTheDocument()
    })

    it('não deve mostrar carregando nem erro quando os dados chegam', async () => {
      await renderPagina()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  // ---------- CA-005-12: duração por extenso ----------

  describe('CA-005-12: duração por extenso', () => {
    it('deve esconder o h:mm:ss do leitor de tela e oferecer a duração por extenso oculta', async () => {
      const { container } = await renderPagina({
        sessao: { ...SESSAO, encerradaEm: '2026-11-17T18:02:03.000Z' },
      })
      const meta = container.querySelector('#flight-detail-meta') as HTMLElement

      expect(within(meta).getByText('1:02:03')).toHaveAttribute('aria-hidden', 'true')
      expect(within(meta).getByText('1 hora, 2 minutos e 3 segundos')).toHaveClass(
        'visualmente-oculto'
      )
    })

    it('deve descrever "Voltar à lista" pelo título e pela linha de início e duração por extenso', async () => {
      await renderPagina()
      const botao = screen.getByRole('button', { name: 'Voltar à lista' })

      expect(botao.getAttribute('aria-describedby')).toBe('flight-detail-title flight-detail-meta')
      expect(botao).toHaveAccessibleDescription(
        /^Voo de 17\/11\/2026 Início 14:00 · Duração\s*1 minuto$/
      )
      expect(botao).toHaveAccessibleName('Voltar à lista')
    })

    it('deve ler o instante por extenso no aria-valuetext da linha do tempo e esconder o h:mm:ss', async () => {
      const { container } = await renderPagina()
      irPara(45)

      expect(linhaDoTempo()).toHaveAttribute('aria-valuetext', '45 segundos de 1 minuto, 14:00:45')
      expect(container.querySelector('.flight-player__time')).toHaveAttribute('aria-hidden', 'true')
    })
  })

  // ---------- CA-005-13: navegação ----------

  describe('CA-005-13: navegação', () => {
    it('deve pôr o foco inicial no botão "Voltar à lista"', async () => {
      await renderPagina()
      expect(screen.getByRole('button', { name: 'Voltar à lista' })).toHaveFocus()
    })

    it('deve chamar onVoltar no clique em "Voltar à lista"', async () => {
      const onVoltar = vi.fn()
      await renderPagina({ onVoltar })

      await userEvent.click(screen.getByRole('button', { name: 'Voltar à lista' }))

      expect(onVoltar).toHaveBeenCalledOnce()
    })

    it('deve chamar onVoltar com Enter no botão com foco', async () => {
      const onVoltar = vi.fn()
      await renderPagina({ onVoltar })

      await userEvent.keyboard('{Enter}')

      expect(onVoltar).toHaveBeenCalledOnce()
    })

    it('deve chamar onVoltar com Esc, mesmo com o foco fora do botão', async () => {
      const onVoltar = vi.fn()
      await renderPagina({ onVoltar })
      linhaDoTempo().focus()

      await userEvent.keyboard('{Escape}')

      expect(onVoltar).toHaveBeenCalledOnce()
    })

    it('não deve reagir a outras teclas', async () => {
      const onVoltar = vi.fn()
      await renderPagina({ onVoltar })
      ;(document.activeElement as HTMLElement).blur()

      await userEvent.keyboard('a{ArrowDown}')

      expect(onVoltar).not.toHaveBeenCalled()
    })

    it('deve parar de ouvir Esc depois de desmontar', async () => {
      const onVoltar = vi.fn()
      const { unmount } = await renderPagina({ onVoltar })

      unmount()
      await userEvent.keyboard('{Escape}')

      expect(onVoltar).not.toHaveBeenCalled()
    })

    // O agendador do React usa setImmediate; só os timers do código entram na contagem.
    const TIMERS_DO_CODIGO = {
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] as const,
    }

    it('não deve deixar timer ao desmontar com a reprodução tocando', async () => {
      vi.useFakeTimers({ toFake: [...TIMERS_DO_CODIGO.toFake] })
      const { unmount } = await renderPagina()
      fireEvent.click(screen.getByRole('button', { name: 'Reproduzir o voo' }))
      expect(vi.getTimerCount()).toBe(1)

      unmount()

      expect(vi.getTimerCount()).toBe(0)
    })

    it('não deve deixar timer ao desmontar durante o carregamento', async () => {
      vi.useFakeTimers({ toFake: [...TIMERS_DO_CODIGO.toFake] })
      mockGetLeiturasDoVoo.mockReturnValue(new Promise(() => {}))
      const { unmount } = render(
        <FlightDetailPage sessao={SESSAO} onVoltar={vi.fn()} timeZone={FUSO} />
      )

      unmount()

      expect(vi.getTimerCount()).toBe(0)
    })
  })

  // ---------- CA-005-14: fora da escala ----------

  describe('CA-005-14: fora da escala', () => {
    it('deve prender o ponteiro no limite e mostrar o valor real', async () => {
      await renderPagina({
        leituras: leiturasDoVoo({
          valores: {
            airspeed_ias: () => 260,
            rpm_1: () => 4200,
            vertical_speed: () => -3000,
          },
        }),
      })

      const ias = instrumento('Velocidade IAS: 260 kt')
      expect(within(ias).getByText('260')).toBeInTheDocument()
      expect(ponteirosDe(ias)).toEqual(['rotate(150.0 100 100)'])

      const rpm = instrumento('RPM: 4.200 rpm')
      expect(ponteirosDe(rpm)).toEqual(['rotate(135.0 100 100)'])

      const vs = instrumento('Velocidade vertical: −3.000 fpm')
      expect(ponteirosDe(vs)).toEqual(['rotate(-260.0 100 100)'])
    })

    it('deve desenhar o ponteiro dentro da escala proporcional ao valor', async () => {
      await renderPagina({
        leituras: leiturasDoVoo({ valores: { airspeed_ias: () => 100 } }),
      })
      expect(ponteirosDe(instrumento('Velocidade IAS: 100 kt'))).toEqual(['rotate(0.0 100 100)'])
    })
  })
})
