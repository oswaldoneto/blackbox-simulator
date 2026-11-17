import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest'
import { render, screen, cleanup, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import { formatarDataDoVoo, formatarHoraDoVoo } from './components/format-flight-time'
import type { ElectronApi } from './electron-api'
import type { EstadoConexao, PacoteDeLeituras, ParametroDeVoo, Sessao } from '../shared/types'

// ---------- fake window.electronApi ----------

type Listener<T> = (payload: T) => void

interface FakeApiOptions {
  sessao?: Sessao | null
  conexao?: EstadoConexao
  parametros?: ParametroDeVoo[]
  sessoesEncerradas?: Sessao[]
}

interface FakeApi {
  api: ElectronApi
  emitSessionStarted: (s: Sessao) => void
  emitSessionEnded: (s: Sessao) => void
  emitSessionEndFailed: (s: Sessao) => void
  emitReadings: (p: PacoteDeLeituras) => void
  emitConnection: (e: EstadoConexao) => void
  totalListeners: () => number
}

function subscribe<T>(lista: Listener<T>[], cb: Listener<T>): () => void {
  lista.push(cb)
  return () => {
    const i = lista.indexOf(cb)
    if (i >= 0) lista.splice(i, 1)
  }
}

function createFakeApi(opts: FakeApiOptions = {}): FakeApi {
  const started: Listener<Sessao>[] = []
  const ended: Listener<Sessao>[] = []
  const endFailed: Listener<Sessao>[] = []
  const readings: Listener<PacoteDeLeituras>[] = []
  const connection: Listener<EstadoConexao>[] = []

  const api: ElectronApi = {
    getActiveSessao: vi.fn().mockResolvedValue(opts.sessao ?? null),
    listSessoesEncerradas: vi.fn().mockResolvedValue(opts.sessoesEncerradas ?? []),
    onSessionStarted: (cb) => subscribe(started, cb),
    onSessionEnded: (cb) => subscribe(ended, cb),
    onSessionEndFailed: (cb) => subscribe(endFailed, cb),
    listActiveParametros: vi.fn().mockResolvedValue(opts.parametros ?? CATALOGO),
    getConnectionState: vi.fn().mockResolvedValue(opts.conexao ?? 'conectado'),
    onParameterReadings: (cb) => subscribe(readings, cb),
    onConnectionStateChanged: (cb) => subscribe(connection, cb),
  }

  const emitir =
    <T,>(lista: Listener<T>[]) =>
    (payload: T): void => {
      const copia = [...lista]
      act(() => {
        copia.forEach((cb) => cb(payload))
      })
    }

  return {
    api,
    emitSessionStarted: emitir(started),
    emitSessionEnded: emitir(ended),
    emitSessionEndFailed: emitir(endFailed),
    emitReadings: emitir(readings),
    emitConnection: emitir(connection),
    totalListeners: () =>
      started.length + ended.length + endFailed.length + readings.length + connection.length,
  }
}

// ---------- dados ----------

/** Catálogo fora da ordem de exibição e com um parâmetro inativo, para testar RN-002 e a ordem. */
const CATALOGO: ParametroDeVoo[] = [
  { id: 'bank', nome: 'Rolagem', unidade: '°', ativo: true },
  { id: 'heading_magnetic', nome: 'Rumo magnético', unidade: '°', ativo: true },
  { id: 'altitude_msl', nome: 'Altitude MSL', unidade: 'ft', ativo: true },
  { id: 'fuel_qty', nome: 'Combustível', unidade: 'gal', ativo: false },
  { id: 'pitch', nome: 'Arfagem', unidade: '°', ativo: true },
  { id: 'vertical_speed', nome: 'Velocidade vertical', unidade: 'fpm', ativo: true },
  { id: 'airspeed_ias', nome: 'Velocidade IAS', unidade: 'kt', ativo: true },
]

const ORDEM_ROTULOS = [
  'Altitude MSL',
  'Velocidade IAS',
  'Velocidade vertical',
  'Rumo magnético',
  'Arfagem',
  'Rolagem',
]

const ORIENTACAO = 'Inicie o simulador e ligue o motor para começar'

function makeSessao(overrides: Partial<Sessao> = {}): Sessao {
  return {
    id: 'sess-1',
    iniciadaEm: '2024-01-01T00:00:00.000Z',
    encerradaEm: null,
    aeronave: '',
    aerodromoOrigem: null,
    aerodromoDestino: null,
    status: 'ativa',
    parametrosNaoAplicaveis: [],
    ...overrides,
  }
}

function encerrar(s: Sessao): Sessao {
  return { ...s, status: 'encerrada', encerradaEm: '2024-01-01T01:00:00.000Z' }
}

function pacote(sessaoId: string, altitude: number, ias = 112): PacoteDeLeituras {
  return {
    sessaoId,
    timestamp: '2024-01-01T00:00:01.000Z',
    leituras: [
      { parametroId: 'altitude_msl', valor: altitude },
      { parametroId: 'airspeed_ias', valor: ias },
      { parametroId: 'vertical_speed', valor: 647 },
      { parametroId: 'heading_magnetic', valor: 5 },
      { parametroId: 'pitch', valor: 0 },
      { parametroId: 'bank', valor: 0 },
    ],
  }
}

/** Resolve as promessas das consultas iniciais (getActiveSessao, listActiveParametros, getConnectionState). */
async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
  })
}

async function renderApp(fake: FakeApi): Promise<ReturnType<typeof render>> {
  window.electronApi = fake.api
  const r = render(<App />)
  await flush()
  return r
}

function grupoDe(nome: string): HTMLElement {
  return screen.getByRole('group', { name: new RegExp(`^${nome}:`) })
}

function rotulosDoPainel(): string[] {
  const painel = screen.getByRole('region', { name: 'Painel de tempo real' })
  return within(painel)
    .getAllByRole('group')
    .map((g) => g.querySelector('.parameter-indicator__label')?.textContent ?? '')
}

function statusBar(): HTMLElement {
  return screen.getByRole('banner')
}

function avisoSessaoEncerrada(): HTMLElement | null {
  const painel = screen.queryByRole('region', { name: 'Painel de tempo real' })
  return painel === null ? null : within(painel).queryByText('Sessão encerrada')
}

const SEM_SINAL = 'Sem sinal do simulador'
const ERRO_PARAMETROS = 'Não foi possível carregar os parâmetros.'

function avisoSemSinal(): HTMLElement | undefined {
  return screen.queryAllByRole('status').find((el) => el.textContent === SEM_SINAL)
}

// ---------- testes ----------

describe('App', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  describe('CA-002-1: painel aparece sozinho com o conjunto inicial', () => {
    it('deve exibir a orientação e nenhum card quando não há sessão', async () => {
      await renderApp(createFakeApi({ sessao: null }))

      expect(screen.getByText(ORIENTACAO)).toBeInTheDocument()
      expect(screen.queryByRole('region', { name: 'Painel de tempo real' })).not.toBeInTheDocument()
      expect(screen.queryAllByRole('group')).toHaveLength(0)
    })

    it('deve exibir o painel sozinho, sem ação do piloto, quando a sessão é iniciada', async () => {
      const fake = createFakeApi({ sessao: null })
      await renderApp(fake)

      fake.emitSessionStarted(makeSessao())

      expect(screen.queryByText(ORIENTACAO)).not.toBeInTheDocument()
      expect(rotulosDoPainel()).toEqual(ORDEM_ROTULOS)
    })

    it('deve exibir o painel quando a sessão já está ativa na montagem', async () => {
      await renderApp(createFakeApi({ sessao: makeSessao() }))

      expect(screen.queryByText(ORIENTACAO)).not.toBeInTheDocument()
      expect(rotulosDoPainel()).toEqual(ORDEM_ROTULOS)
    })

    it('deve exibir só os 6 parâmetros ativos (RN-002), sem o parâmetro inativo', async () => {
      await renderApp(createFakeApi({ sessao: makeSessao() }))

      expect(screen.getAllByRole('group')).toHaveLength(6)
      expect(screen.queryByText('Combustível')).not.toBeInTheDocument()
    })

    it('deve exibir o painel na área principal da janela', async () => {
      await renderApp(createFakeApi({ sessao: makeSessao() }))

      const main = screen.getByRole('main')
      expect(within(main).getByRole('region', { name: 'Painel de tempo real' })).toBeInTheDocument()
    })
  })

  describe('CA-002-2: valores atualizados a cada ciclo da leitura', () => {
    it('deve exibir os valores do pacote assim que ele chega', async () => {
      const fake = createFakeApi({ sessao: makeSessao() })
      await renderApp(fake)

      fake.emitReadings(pacote('sess-1', 4500, 112))

      expect(within(grupoDe('Altitude MSL')).getByText('4.500')).toBeInTheDocument()
      expect(within(grupoDe('Velocidade IAS')).getByText('112')).toBeInTheDocument()
      expect(within(grupoDe('Velocidade vertical')).getByText('+650')).toBeInTheDocument()
      expect(within(grupoDe('Rumo magnético')).getByText('005')).toBeInTheDocument()
      expect(grupoDe('Altitude MSL')).toHaveAccessibleName('Altitude MSL: 4.500 ft')
    })

    it('deve atualizar os valores a cada novo pacote', async () => {
      const fake = createFakeApi({ sessao: makeSessao() })
      await renderApp(fake)

      fake.emitReadings(pacote('sess-1', 4500))
      fake.emitReadings(pacote('sess-1', 4620))

      expect(within(grupoDe('Altitude MSL')).getByText('4.620')).toBeInTheDocument()
      expect(within(grupoDe('Altitude MSL')).queryByText('4.500')).not.toBeInTheDocument()
    })

    it('não deve fazer chamadas ao main além das consultas iniciais ao receber leituras', async () => {
      const fake = createFakeApi({ sessao: makeSessao() })
      await renderApp(fake)

      fake.emitReadings(pacote('sess-1', 4500))
      fake.emitReadings(pacote('sess-1', 4510))

      // As únicas chamadas de ida ao main são as três consultas iniciais.
      expect(fake.api.getActiveSessao).toHaveBeenCalledTimes(1)
      expect(fake.api.listActiveParametros).toHaveBeenCalledTimes(1)
      expect(fake.api.getConnectionState).toHaveBeenCalledTimes(1)
      // A lista de voos só é lida quando o piloto abre "Voos" (UC-004).
      expect(fake.api.listSessoesEncerradas).not.toHaveBeenCalled()
    })
  })

  describe('sessão encerrada', () => {
    it('deve congelar os últimos valores e exibir o aviso "Sessão encerrada" sem role="status"', async () => {
      const sessao = makeSessao()
      const fake = createFakeApi({ sessao })
      await renderApp(fake)
      fake.emitReadings(pacote('sess-1', 4500))

      fake.emitSessionEnded(encerrar(sessao))

      const aviso = avisoSessaoEncerrada()
      expect(aviso).not.toBeNull()
      expect(aviso).not.toHaveAttribute('role', 'status')
      expect(within(grupoDe('Altitude MSL')).getByText('4.500')).toBeInTheDocument()
    })

    it('deve ter um único anúncio de encerramento: a notificação "Sessão encerrada. Dados salvos."', async () => {
      const sessao = makeSessao()
      const fake = createFakeApi({ sessao })
      await renderApp(fake)

      fake.emitSessionEnded(encerrar(sessao))

      expect(screen.getByText('Sessão encerrada. Dados salvos.')).toBeInTheDocument()
      const anunciosNoPainel = within(
        screen.getByRole('region', { name: 'Painel de tempo real' })
      ).queryAllByRole('status')
      expect(anunciosNoPainel).toHaveLength(0)
    })

    it('deve ignorar pacotes que chegam depois do encerramento, inclusive de outra sessão', async () => {
      const sessao = makeSessao()
      const fake = createFakeApi({ sessao })
      await renderApp(fake)
      fake.emitReadings(pacote('sess-1', 4500))
      fake.emitSessionEnded(encerrar(sessao))

      fake.emitReadings(pacote('outra-sessao', 9000))
      fake.emitReadings(pacote('sess-1', 8000))

      expect(within(grupoDe('Altitude MSL')).getByText('4.500')).toBeInTheDocument()
    })

    it('deve manter os valores congelados após mais de 2 s', async () => {
      vi.useFakeTimers()
      const sessao = makeSessao()
      const fake = createFakeApi({ sessao })
      await renderApp(fake)
      fake.emitReadings(pacote('sess-1', 4500))
      fake.emitSessionEnded(encerrar(sessao))

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(within(grupoDe('Altitude MSL')).getByText('4.500')).toBeInTheDocument()
    })

    it('deve zerar os valores e tirar o aviso quando começa uma nova sessão', async () => {
      const sessao = makeSessao()
      const fake = createFakeApi({ sessao })
      await renderApp(fake)
      fake.emitReadings(pacote('sess-1', 4500))
      fake.emitSessionEnded(encerrar(sessao))

      fake.emitSessionStarted(makeSessao({ id: 'sess-2' }))

      expect(avisoSessaoEncerrada()).toBeNull()
      expect(screen.queryByText('4.500')).not.toBeInTheDocument()
      expect(screen.getAllByText('—')).toHaveLength(6)

      fake.emitReadings(pacote('sess-2', 1200))
      expect(within(grupoDe('Altitude MSL')).getByText('1.200')).toBeInTheDocument()
    })
  })

  describe('sem sinal', () => {
    it('deve trocar os valores por "—" com aria-label "sem sinal" quando a conexão cai com sessão ativa', async () => {
      const fake = createFakeApi({ sessao: makeSessao() })
      await renderApp(fake)
      fake.emitReadings(pacote('sess-1', 4500))

      fake.emitConnection('desconectado')

      expect(screen.getAllByText('—')).toHaveLength(6)
      ORDEM_ROTULOS.forEach((nome) =>
        expect(screen.getByRole('group', { name: `${nome}: sem sinal` })).toBeInTheDocument()
      )
    })

    it('deve voltar a exibir valores quando a conexão volta e chega pacote novo', async () => {
      const fake = createFakeApi({ sessao: makeSessao() })
      await renderApp(fake)
      fake.emitReadings(pacote('sess-1', 4500))
      fake.emitConnection('desconectado')

      fake.emitConnection('conectado')
      fake.emitReadings(pacote('sess-1', 4700))

      expect(within(grupoDe('Altitude MSL')).getByText('4.700')).toBeInTheDocument()
    })

    it('deve exibir "—" após 2 s sem pacote com a conexão aberta e voltar ao chegar pacote novo', async () => {
      vi.useFakeTimers()
      const fake = createFakeApi({ sessao: makeSessao() })
      await renderApp(fake)
      fake.emitReadings(pacote('sess-1', 4500))

      act(() => {
        vi.advanceTimersByTime(1999)
      })
      expect(within(grupoDe('Altitude MSL')).getByText('4.500')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(screen.getAllByText('—')).toHaveLength(6)
      expect(screen.getByRole('group', { name: 'Altitude MSL: sem sinal' })).toBeInTheDocument()

      fake.emitReadings(pacote('sess-1', 4800))
      expect(within(grupoDe('Altitude MSL')).getByText('4.800')).toBeInTheDocument()
    })

    it('deve exibir o aviso "Sem sinal do simulador" com role="status" acima da grade quando a conexão cai', async () => {
      const fake = createFakeApi({ sessao: makeSessao() })
      await renderApp(fake)
      fake.emitReadings(pacote('sess-1', 4500))
      expect(avisoSemSinal()).toBeUndefined()

      fake.emitConnection('desconectado')

      const aviso = avisoSemSinal()
      expect(aviso).toBeDefined()
      const painel = screen.getByRole('region', { name: 'Painel de tempo real' })
      const grade = painel.querySelector('.realtime-grid') as HTMLElement
      expect(grade).not.toBeNull()
      expect(aviso!.compareDocumentPosition(grade) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(screen.getAllByText('—')).toHaveLength(6)
    })

    it('deve exibir o aviso "Sem sinal do simulador" após 2 s sem pacote e tirá-lo quando chega pacote novo', async () => {
      vi.useFakeTimers()
      const fake = createFakeApi({ sessao: makeSessao() })
      await renderApp(fake)
      fake.emitReadings(pacote('sess-1', 4500))

      act(() => {
        vi.advanceTimersByTime(2000)
      })
      expect(avisoSemSinal()).toBeDefined()
      expect(screen.getAllByText('—')).toHaveLength(6)

      fake.emitReadings(pacote('sess-1', 4800))
      expect(avisoSemSinal()).toBeUndefined()
    })

    it('não deve mudar a StatusBar quando o painel entra em sem sinal por 2 s sem pacote', async () => {
      vi.useFakeTimers()
      const fake = createFakeApi({ sessao: makeSessao(), conexao: 'conectado' })
      await renderApp(fake)
      fake.emitReadings(pacote('sess-1', 4500))

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(avisoSemSinal()).toBeDefined()
      expect(within(statusBar()).getByText('Sessão ativa')).toBeInTheDocument()
      expect(within(statusBar()).queryByText(SEM_SINAL)).not.toBeInTheDocument()
    })

    it('não deve exibir o aviso "Sem sinal do simulador" com a sessão encerrada', async () => {
      const sessao = makeSessao()
      const fake = createFakeApi({ sessao })
      await renderApp(fake)
      fake.emitSessionEnded(encerrar(sessao))

      fake.emitConnection('desconectado')

      expect(avisoSemSinal()).toBeUndefined()
    })
  })

  describe('falha nas consultas iniciais', () => {
    let consoleError: MockInstance<Parameters<typeof console.error>, void>

    beforeEach(() => {
      consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleError.mockRestore()
    })

    it('deve sair de "Aguardando..." e seguir sem sessão quando getActiveSessao falha', async () => {
      const fake = createFakeApi()
      fake.api.getActiveSessao = vi.fn().mockRejectedValue(new Error('ipc'))
      await renderApp(fake)
      await flush()

      expect(screen.queryByText('Aguardando...')).not.toBeInTheDocument()
      expect(screen.getByText(ORIENTACAO)).toBeInTheDocument()
      expect(consoleError).toHaveBeenCalled()
    })

    it('deve exibir o painel quando a sessão começa depois de getActiveSessao falhar', async () => {
      const fake = createFakeApi()
      fake.api.getActiveSessao = vi.fn().mockRejectedValue(new Error('ipc'))
      await renderApp(fake)
      await flush()

      fake.emitSessionStarted(makeSessao())

      expect(rotulosDoPainel()).toEqual(ORDEM_ROTULOS)
    })

    it('deve exibir "Sem conexão" na StatusBar quando getConnectionState falha', async () => {
      const fake = createFakeApi({ sessao: null })
      fake.api.getConnectionState = vi.fn().mockRejectedValue(new Error('ipc'))
      await renderApp(fake)
      await flush()

      expect(within(statusBar()).getByText('Sem conexão')).toBeInTheDocument()
      expect(consoleError).toHaveBeenCalled()
    })

    it('deve exibir "Não foi possível carregar os parâmetros." no lugar da grade quando listActiveParametros falha com sessão ativa', async () => {
      const fake = createFakeApi({ sessao: makeSessao() })
      fake.api.listActiveParametros = vi.fn().mockRejectedValue(new Error('ipc'))
      await renderApp(fake)
      await flush()

      const painel = screen.getByRole('region', { name: 'Painel de tempo real' })
      expect(within(painel).getByText(ERRO_PARAMETROS)).toBeInTheDocument()
      expect(painel.querySelector('.realtime-grid')).toBeNull()
      expect(screen.queryAllByRole('group')).toHaveLength(0)
      expect(consoleError).toHaveBeenCalled()
    })

    it('deve exibir a orientação, sem a mensagem de erro, quando listActiveParametros falha sem sessão', async () => {
      const fake = createFakeApi({ sessao: null })
      fake.api.listActiveParametros = vi.fn().mockRejectedValue(new Error('ipc'))
      await renderApp(fake)
      await flush()

      expect(screen.getByText(ORIENTACAO)).toBeInTheDocument()
      expect(screen.queryByText(ERRO_PARAMETROS)).not.toBeInTheDocument()
    })
  })

  describe('StatusBar', () => {
    it('deve exibir "Aguardando motor" quando conectado sem sessão', async () => {
      await renderApp(createFakeApi({ sessao: null, conexao: 'conectado' }))
      expect(within(statusBar()).getByText('Aguardando motor')).toBeInTheDocument()
    })

    it('deve exibir "Sem conexão" quando desconectado sem sessão', async () => {
      await renderApp(createFakeApi({ sessao: null, conexao: 'desconectado' }))
      expect(within(statusBar()).getByText('Sem conexão')).toBeInTheDocument()
    })

    it('deve exibir "Sessão ativa" quando conectado com sessão ativa', async () => {
      await renderApp(createFakeApi({ sessao: makeSessao(), conexao: 'conectado' }))
      expect(within(statusBar()).getByText('Sessão ativa')).toBeInTheDocument()
    })

    it('deve trocar "Sessão ativa" por "Sem conexão" quando a conexão cai', async () => {
      const fake = createFakeApi({ sessao: makeSessao(), conexao: 'conectado' })
      await renderApp(fake)

      fake.emitConnection('desconectado')

      expect(within(statusBar()).getByText('Sem conexão')).toBeInTheDocument()
      expect(within(statusBar()).queryByText('Sessão ativa')).not.toBeInTheDocument()
    })

    it('deve exibir "Encerrada" quando a sessão é encerrada com a conexão aberta', async () => {
      const sessao = makeSessao()
      const fake = createFakeApi({ sessao, conexao: 'conectado' })
      await renderApp(fake)

      fake.emitSessionEnded(encerrar(sessao))

      expect(within(statusBar()).getByText('Encerrada')).toBeInTheDocument()
    })
  })

  describe('limpeza', () => {
    beforeEach(() => {
      vi.useRealTimers()
    })

    it('deve remover todos os listeners ao desmontar', async () => {
      const fake = createFakeApi({ sessao: makeSessao() })
      const { unmount } = await renderApp(fake)

      expect(fake.totalListeners()).toBeGreaterThan(0)

      unmount()

      expect(fake.totalListeners()).toBe(0)
    })
  })

  // ---------- UC-006: 12 parâmetros e N/A ----------

  describe('UC-006: posição, motor e flapes', () => {
    /** Catálogo dos 12 parâmetros fora da ordem de exibição, mais um inativo. */
    const CATALOGO_DOZE: ParametroDeVoo[] = [
      { id: 'flaps', nome: 'Flapes', unidade: '%', ativo: true },
      { id: 'longitude', nome: 'Longitude', unidade: '°', ativo: true },
      ...CATALOGO,
      { id: 'rpm_1', nome: 'RPM', unidade: 'rpm', ativo: true },
      { id: 'throttle_1', nome: 'Manete', unidade: '%', ativo: true },
      { id: 'latitude', nome: 'Latitude', unidade: '°', ativo: true },
      { id: 'mixture_1', nome: 'Mistura', unidade: '%', ativo: true },
    ]

    const ORDEM_DOZE = [
      'Altitude MSL',
      'Velocidade IAS',
      'Velocidade vertical',
      'Rumo magnético',
      'Arfagem',
      'Rolagem',
      'Latitude',
      'Longitude',
      'Manete',
      'Mistura',
      'RPM',
      'Flapes',
    ]

    /** Pacote do main: sem as leituras dos parâmetros N/A (o main não as envia). */
    function pacoteDoze(sessaoId: string, semIds: string[] = []): PacoteDeLeituras {
      const base = pacote(sessaoId, 4500)
      return {
        ...base,
        leituras: [
          ...base.leituras,
          { parametroId: 'latitude', valor: -23.5505199 },
          { parametroId: 'longitude', valor: -46.6333094 },
          { parametroId: 'throttle_1', valor: 85 },
          { parametroId: 'mixture_1', valor: 100 },
          { parametroId: 'rpm_1', valor: 2450 },
          { parametroId: 'flaps', valor: 30 },
        ].filter((l) => !semIds.includes(l.parametroId)),
      }
    }

    it('deve exibir os 12 cards na ordem dos grupos (CA-006-2)', async () => {
      await renderApp(createFakeApi({ sessao: makeSessao(), parametros: CATALOGO_DOZE }))

      expect(rotulosDoPainel()).toEqual(ORDEM_DOZE)
    })

    it('deve exibir o valor atual dos 6 parâmetros novos ao chegar o pacote', async () => {
      const fake = createFakeApi({ sessao: makeSessao(), parametros: CATALOGO_DOZE })
      await renderApp(fake)

      fake.emitReadings(pacoteDoze('sess-1'))

      expect(within(grupoDe('Latitude')).getByText('23,55052 S')).toBeInTheDocument()
      expect(within(grupoDe('Longitude')).getByText('46,63331 O')).toBeInTheDocument()
      expect(within(grupoDe('Manete')).getByText('85')).toBeInTheDocument()
      expect(within(grupoDe('Mistura')).getByText('100')).toBeInTheDocument()
      expect(within(grupoDe('RPM')).getByText('2.450')).toBeInTheDocument()
      expect(within(grupoDe('Flapes')).getByText('30')).toBeInTheDocument()
    })

    it('deve exibir "N/A" nos parâmetros da lista da sessão, com a unidade (CA-006-4)', async () => {
      const fake = createFakeApi({
        sessao: makeSessao({ parametrosNaoAplicaveis: ['mixture_1', 'flaps'] }),
        parametros: CATALOGO_DOZE,
      })
      await renderApp(fake)

      fake.emitReadings(pacoteDoze('sess-1', ['mixture_1', 'flaps']))

      const mistura = screen.getByRole('group', { name: 'Mistura: não aplicável' })
      expect(within(mistura).getByText('N/A')).toBeInTheDocument()
      expect(within(mistura).getByText('%')).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Flapes: não aplicável' })).toBeInTheDocument()
      expect(within(grupoDe('RPM')).getByText('2.450')).toBeInTheDocument()
    })

    it('deve usar a lista da sessão recebida no evento de sessão iniciada', async () => {
      const fake = createFakeApi({ sessao: null, parametros: CATALOGO_DOZE })
      await renderApp(fake)

      fake.emitSessionStarted(makeSessao({ parametrosNaoAplicaveis: ['mixture_1'] }))

      expect(screen.getByRole('group', { name: 'Mistura: não aplicável' })).toBeInTheDocument()
      expect(screen.getAllByText('N/A')).toHaveLength(1)
    })

    it('deve manter "N/A" quando a conexão cai (N/A vence "—")', async () => {
      const fake = createFakeApi({
        sessao: makeSessao({ parametrosNaoAplicaveis: ['flaps'] }),
        parametros: CATALOGO_DOZE,
      })
      await renderApp(fake)
      fake.emitReadings(pacoteDoze('sess-1', ['flaps']))

      fake.emitConnection('desconectado')

      expect(screen.getByRole('group', { name: 'Flapes: não aplicável' })).toBeInTheDocument()
      expect(screen.getAllByText('—')).toHaveLength(11)
    })

    it('deve manter "N/A" após 2 s sem pacote com a conexão aberta', async () => {
      vi.useFakeTimers()
      const fake = createFakeApi({
        sessao: makeSessao({ parametrosNaoAplicaveis: ['mixture_1'] }),
        parametros: CATALOGO_DOZE,
      })
      await renderApp(fake)
      fake.emitReadings(pacoteDoze('sess-1', ['mixture_1']))

      act(() => {
        vi.advanceTimersByTime(2500)
      })

      expect(avisoSemSinal()).toBeDefined()
      expect(screen.getByRole('group', { name: 'Mistura: não aplicável' })).toBeInTheDocument()
    })

    it('deve manter "N/A" na sessão encerrada com a conexão caída', async () => {
      const sessao = makeSessao({ parametrosNaoAplicaveis: ['mixture_1'] })
      const fake = createFakeApi({ sessao, parametros: CATALOGO_DOZE })
      await renderApp(fake)
      fake.emitReadings(pacoteDoze('sess-1', ['mixture_1']))
      fake.emitConnection('desconectado')

      fake.emitSessionEnded(encerrar(sessao))

      expect(avisoSessaoEncerrada()).not.toBeNull()
      expect(screen.getByRole('group', { name: 'Mistura: não aplicável' })).toBeInTheDocument()
    })

    it('deve manter "N/A" e os valores congelados na sessão encerrada com a conexão aberta', async () => {
      const sessao = makeSessao({ parametrosNaoAplicaveis: ['flaps'] })
      const fake = createFakeApi({ sessao, parametros: CATALOGO_DOZE })
      await renderApp(fake)
      fake.emitReadings(pacoteDoze('sess-1', ['flaps']))

      fake.emitSessionEnded(encerrar(sessao))

      expect(screen.getByRole('group', { name: 'Flapes: não aplicável' })).toBeInTheDocument()
      expect(within(grupoDe('RPM')).getByText('2.450')).toBeInTheDocument()
    })

    it('deve trocar a lista de N/A quando começa uma nova sessão com outra aeronave', async () => {
      const sessao = makeSessao({ parametrosNaoAplicaveis: ['mixture_1'] })
      const fake = createFakeApi({ sessao, parametros: CATALOGO_DOZE })
      await renderApp(fake)
      fake.emitSessionEnded(encerrar(sessao))

      fake.emitSessionStarted(makeSessao({ id: 'sess-2', parametrosNaoAplicaveis: ['flaps'] }))

      expect(screen.getByRole('group', { name: 'Flapes: não aplicável' })).toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Mistura: não aplicável' })).not.toBeInTheDocument()
    })
  })

  // ---------- UC-003: encerramento da sessão ----------

  describe('UC-003: encerramento da sessão', () => {
    const ERRO_ENCERRAMENTO =
      'Não foi possível salvar o encerramento. Os dados do voo foram mantidos e o encerramento será concluído na próxima abertura.'
    const SUCESSO_ENCERRAMENTO = 'Sessão encerrada. Dados salvos.'

    function notificacao(texto: string): HTMLElement | undefined {
      return screen.queryAllByRole('status').find((el) => el.textContent === texto)
    }

    it('deve exibir a notificação de sucesso com a cor de sucesso quando a sessão é encerrada', async () => {
      const sessao = makeSessao()
      const fake = createFakeApi({ sessao })
      await renderApp(fake)

      fake.emitSessionEnded(encerrar(sessao))

      const aviso = notificacao(SUCESSO_ENCERRAMENTO)
      expect(aviso).toBeDefined()
      expect(aviso!.getAttribute('style')).toContain('var(--color-success)')
      expect(screen.queryByText(ERRO_ENCERRAMENTO)).not.toBeInTheDocument()
    })

    it('deve exibir a notificação de erro, com a cor de erro, quando a gravação do encerramento falha', async () => {
      const sessao = makeSessao()
      const fake = createFakeApi({ sessao })
      await renderApp(fake)

      fake.emitSessionEndFailed(sessao)

      const aviso = notificacao(ERRO_ENCERRAMENTO)
      expect(aviso).toBeDefined()
      expect(aviso!.getAttribute('style')).toContain('var(--color-error)')
      expect(screen.queryByText(SUCESSO_ENCERRAMENTO)).not.toBeInTheDocument()
    })

    it('deve tratar o painel como encerrado quando a gravação falha: valores congelados, aviso e "Encerrada"', async () => {
      const sessao = makeSessao()
      const fake = createFakeApi({ sessao, conexao: 'conectado' })
      await renderApp(fake)
      fake.emitReadings(pacote('sess-1', 4500))

      // O main envia a sessão como estava na memória (ainda "ativa").
      fake.emitSessionEndFailed(sessao)

      expect(avisoSessaoEncerrada()).not.toBeNull()
      expect(within(grupoDe('Altitude MSL')).getByText('4.500')).toBeInTheDocument()
      expect(within(statusBar()).getByText('Encerrada')).toBeInTheDocument()
      expect(within(statusBar()).queryByText('Sessão ativa')).not.toBeInTheDocument()

      fake.emitReadings(pacote('sess-1', 9000))
      expect(within(grupoDe('Altitude MSL')).getByText('4.500')).toBeInTheDocument()
    })

    it('deve abrir o painel da nova sessão quando o motor é religado depois da falha', async () => {
      const sessao = makeSessao()
      const fake = createFakeApi({ sessao })
      await renderApp(fake)
      fake.emitReadings(pacote('sess-1', 4500))
      fake.emitSessionEndFailed(sessao)

      fake.emitSessionStarted(makeSessao({ id: 'sess-2' }))

      expect(avisoSessaoEncerrada()).toBeNull()
      expect(within(statusBar()).getByText('Sessão ativa')).toBeInTheDocument()
      fake.emitReadings(pacote('sess-2', 1200))
      expect(within(grupoDe('Altitude MSL')).getByText('1.200')).toBeInTheDocument()
    })

    it('deve abrir com a orientação, sem notificação, quando o main não tem sessão ativa (sessão em verificação ou encerrada na abertura)', async () => {
      await renderApp(createFakeApi({ sessao: null }))

      expect(screen.getByText(ORIENTACAO)).toBeInTheDocument()
      expect(screen.queryAllByRole('status')).toHaveLength(0)
    })

    it('deve exibir "Coleta iniciada" quando a sessão restaurada é confirmada pelo motor', async () => {
      const fake = createFakeApi({ sessao: null })
      await renderApp(fake)

      fake.emitSessionStarted(makeSessao({ id: 'restaurada' }))

      expect(notificacao('Coleta iniciada')).toBeDefined()
      expect(rotulosDoPainel()).toEqual(ORDEM_ROTULOS)
    })

    it('deve exibir o texto exato de erro do encerramento, com tipo error, e nenhuma outra notificação', async () => {
      const sessao = makeSessao()
      const fake = createFakeApi({ sessao })
      await renderApp(fake)

      fake.emitSessionEndFailed(sessao)

      const avisos = screen.queryAllByRole('status').filter((el) => el.getAttribute('aria-live') === 'polite')
      const aviso = avisos.find((el) => el.textContent === ERRO_ENCERRAMENTO)
      expect(aviso).toBeDefined()
      expect(aviso!.textContent).toBe(
        'Não foi possível salvar o encerramento. Os dados do voo foram mantidos e o encerramento será concluído na próxima abertura.',
      )
      expect(aviso!.getAttribute('style')).toContain('var(--color-error)')
      expect(screen.queryByText('Não foi possível salvar o encerramento da sessão.')).not.toBeInTheDocument()
    })
  })

  // ---------- notificação: 4 s completos a cada notificação nova ----------

  describe('notificação: tempo de 4 s reinicia a cada notificação nova', () => {
    const SUCESSO_ENCERRAMENTO = 'Sessão encerrada. Dados salvos.'
    const ERRO_ENCERRAMENTO =
      'Não foi possível salvar o encerramento. Os dados do voo foram mantidos e o encerramento será concluído na próxima abertura.'

    function notificacao(texto: string): HTMLElement | undefined {
      return screen.queryAllByRole('status').find((el) => el.textContent === texto)
    }

    function avancar(ms: number): void {
      act(() => {
        vi.advanceTimersByTime(ms)
      })
    }

    it('deve manter uma notificação isolada por 4 s e tirá-la depois', async () => {
      vi.useFakeTimers()
      const sessao = makeSessao()
      const fake = createFakeApi({ sessao })
      await renderApp(fake)

      fake.emitSessionEnded(encerrar(sessao))
      avancar(3999)
      expect(notificacao(SUCESSO_ENCERRAMENTO)).toBeDefined()
      avancar(1)
      expect(notificacao(SUCESSO_ENCERRAMENTO)).toBeUndefined()
    })

    it('deve manter por 4 s completos uma notificação que substitui outra aos 3 s', async () => {
      vi.useFakeTimers()
      const sessao = makeSessao()
      const fake = createFakeApi({ sessao })
      await renderApp(fake)

      fake.emitSessionEndFailed(sessao)
      avancar(3000)
      fake.emitSessionStarted(makeSessao({ id: 'sess-2' }))
      expect(notificacao(ERRO_ENCERRAMENTO)).toBeUndefined()
      expect(notificacao('Coleta iniciada')).toBeDefined()

      // Os 1 s que restavam da anterior não tiram a nova.
      avancar(1000)
      expect(notificacao('Coleta iniciada')).toBeDefined()
      avancar(2999)
      expect(notificacao('Coleta iniciada')).toBeDefined()
      avancar(1)
      expect(notificacao('Coleta iniciada')).toBeUndefined()
    })

    it('deve reiniciar os 4 s quando a mesma mensagem se repete antes de sumir', async () => {
      vi.useFakeTimers()
      const fake = createFakeApi({ sessao: null })
      await renderApp(fake)

      fake.emitSessionStarted(makeSessao({ id: 'sess-1' }))
      avancar(3000)
      fake.emitSessionStarted(makeSessao({ id: 'sess-2' }))
      expect(screen.queryAllByRole('status').filter((el) => el.textContent === 'Coleta iniciada')).toHaveLength(1)

      avancar(1000)
      expect(notificacao('Coleta iniciada')).toBeDefined()
      avancar(2999)
      expect(notificacao('Coleta iniciada')).toBeDefined()
      avancar(1)
      expect(notificacao('Coleta iniciada')).toBeUndefined()
    })

    it('deve reiniciar os 4 s quando a mesma mensagem de erro se repete', async () => {
      vi.useFakeTimers()
      const sessao = makeSessao()
      const fake = createFakeApi({ sessao })
      await renderApp(fake)

      fake.emitSessionEndFailed(sessao)
      avancar(3500)
      fake.emitSessionEndFailed(sessao)

      avancar(500)
      expect(notificacao(ERRO_ENCERRAMENTO)).toBeDefined()
      avancar(3499)
      expect(notificacao(ERRO_ENCERRAMENTO)).toBeDefined()
      avancar(1)
      expect(notificacao(ERRO_ENCERRAMENTO)).toBeUndefined()
    })

    it('UC-003: deve manter "Coleta iniciada" por 4 s quando o motor é religado 1 s depois do encerramento', async () => {
      vi.useFakeTimers()
      const sessao = makeSessao()
      const fake = createFakeApi({ sessao })
      await renderApp(fake)

      fake.emitSessionEnded(encerrar(sessao))
      expect(notificacao(SUCESSO_ENCERRAMENTO)).toBeDefined()

      avancar(1000)
      fake.emitSessionStarted(makeSessao({ id: 'sess-2' }))
      expect(notificacao(SUCESSO_ENCERRAMENTO)).toBeUndefined()
      expect(notificacao('Coleta iniciada')).toBeDefined()

      // Aos 4 s do encerramento (3 s depois do religamento), ainda visível.
      avancar(3000)
      expect(notificacao('Coleta iniciada')).toBeDefined()
      avancar(999)
      expect(notificacao('Coleta iniciada')).toBeDefined()
      avancar(1)
      expect(notificacao('Coleta iniciada')).toBeUndefined()
    })
  })

  // ---------- UC-004: lista de voos, tela provisória e navegação ----------

  describe('UC-004: selecionar voo', () => {
    const VAZIO = 'Nenhum voo registrado. Inicie o simulador e ligue o motor para começar.'
    const SUCESSO_ENCERRAMENTO = 'Sessão encerrada. Dados salvos.'
    const ERRO_ENCERRAMENTO =
      'Não foi possível salvar o encerramento. Os dados do voo foram mantidos e o encerramento será concluído na próxima abertura.'

    function voo(id: string, iniciadaEm: string, encerradaEm: string): Sessao {
      return makeSessao({ id, iniciadaEm, encerradaEm, status: 'encerrada' })
    }

    // Na ordem do main (iniciada_em DESC).
    const VOO_RECENTE = voo('v2', '2026-11-17T13:05:00.000Z', '2026-11-17T14:20:30.000Z')
    const VOO_ANTIGO = voo('v1', '2026-11-10T09:00:00.000Z', '2026-11-10T09:00:00.000Z')

    function rotulo(s: Sessao, duracao: string): string {
      return `Voo de ${formatarDataDoVoo(s.iniciadaEm)} às ${formatarHoraDoVoo(s.iniciadaEm)}, duração ${duracao}`
    }

    function botaoNav(nome: 'Painel' | 'Voos'): HTMLElement {
      return within(screen.getByRole('navigation', { name: 'Navegação principal' })).getByRole(
        'button',
        { name: nome }
      )
    }

    function notificacao(texto: string): HTMLElement | undefined {
      return screen.queryAllByRole('status').find((el) => el.textContent === texto)
    }

    async function abrirVoos(): Promise<void> {
      await userEvent.click(botaoNav('Voos'))
      await flush()
    }

    function telaDoVoo(s: Sessao): HTMLElement | null {
      return screen.queryByRole('heading', { level: 1, name: `Voo de ${formatarDataDoVoo(s.iniciadaEm)}` })
    }

    function telaDaLista(): HTMLElement | null {
      return screen.queryByRole('heading', { level: 1, name: 'Voos' })
    }

    it('deve abrir no painel, com "Painel" marcado como tela atual, sem ler a lista de voos', async () => {
      const fake = createFakeApi({ sessao: null })
      await renderApp(fake)

      expect(botaoNav('Painel')).toHaveAttribute('aria-current', 'page')
      expect(botaoNav('Voos')).not.toHaveAttribute('aria-current')
      expect(screen.getByText(ORIENTACAO)).toBeInTheDocument()
      expect(fake.api.listSessoesEncerradas).not.toHaveBeenCalled()
    })

    it('CA-004-1: deve exibir os voos encerrados em ordem cronológica inversa, com data, hora e duração', async () => {
      const fake = createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE, VOO_ANTIGO] })
      await renderApp(fake)

      await abrirVoos()

      expect(fake.api.listSessoesEncerradas).toHaveBeenCalledOnce()
      expect(telaDaLista()).toBeInTheDocument()
      expect(botaoNav('Voos')).toHaveAttribute('aria-current', 'page')
      expect(botaoNav('Painel')).not.toHaveAttribute('aria-current')
      const cards = within(screen.getByRole('list')).getAllByRole('button')
      expect(cards.map((c) => c.getAttribute('aria-label'))).toEqual([
        rotulo(VOO_RECENTE, '1 hora, 15 minutos e 30 segundos'),
        rotulo(VOO_ANTIGO, '0 segundos'),
      ])
      expect(screen.queryByText(ORIENTACAO)).not.toBeInTheDocument()
    })

    it('CA-004-3: deve exibir o estado vazio quando não há voos encerrados', async () => {
      await renderApp(createFakeApi({ sessao: null, sessoesEncerradas: [] }))

      await abrirVoos()

      expect(screen.getByText(VAZIO)).toBeInTheDocument()
    })

    it('CA-004-3: deve exibir o estado vazio quando só existe a sessão ativa, e não mostrar a ativa', async () => {
      const ativa = makeSessao({ id: 'ativa' })
      await renderApp(createFakeApi({ sessao: ativa, sessoesEncerradas: [] }))

      await abrirVoos()

      expect(screen.getByText(VAZIO)).toBeInTheDocument()
      expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })

    it('deve exibir a mensagem de erro quando a primeira carga da lista falha', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const fake = createFakeApi({ sessao: null })
      fake.api.listSessoesEncerradas = vi.fn().mockRejectedValue(new Error('ipc'))
      await renderApp(fake)

      await abrirVoos()
      await flush()

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Não foi possível carregar a lista de voos. Feche e abra o aplicativo para tentar de novo.'
      )
      expect(consoleError).toHaveBeenCalled()
      consoleError.mockRestore()
    })

    it('CA-004-2: deve abrir a tela provisória do voo no clique do card, com data, hora, duração e aviso', async () => {
      await renderApp(createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE, VOO_ANTIGO] }))
      await abrirVoos()

      await userEvent.click(screen.getByRole('button', { name: rotulo(VOO_RECENTE, '1 hora, 15 minutos e 30 segundos') }))

      expect(telaDoVoo(VOO_RECENTE)).toBeInTheDocument()
      expect(telaDaLista()).not.toBeInTheDocument()
      expect(screen.getByText(formatarHoraDoVoo(VOO_RECENTE.iniciadaEm), { selector: 'dd' })).toBeInTheDocument()
      expect(screen.getByText('1:15:30', { selector: 'dd' })).toBeInTheDocument()
      expect(screen.getByText('Debriefing disponível em breve')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Voltar à lista' })).toHaveFocus()
      // A tela do voo pertence à seção "Voos".
      expect(botaoNav('Voos')).toHaveAttribute('aria-current', 'page')
    })

    it('deve voltar à lista pelo botão "Voltar à lista", com foco no card de origem', async () => {
      await renderApp(createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE, VOO_ANTIGO] }))
      await abrirVoos()
      await userEvent.click(screen.getByRole('button', { name: rotulo(VOO_ANTIGO, '0 segundos') }))

      await userEvent.click(screen.getByRole('button', { name: 'Voltar à lista' }))
      await flush()

      expect(telaDaLista()).toBeInTheDocument()
      expect(screen.getByRole('button', { name: rotulo(VOO_ANTIGO, '0 segundos') })).toHaveFocus()
    })

    it('deve percorrer os voos com Tab, abrir com Enter e voltar à lista com Esc, com foco no card de origem', async () => {
      await renderApp(createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE, VOO_ANTIGO] }))
      await abrirVoos()
      const cardAntigo = screen.getByRole('button', { name: rotulo(VOO_ANTIGO, '0 segundos') })
      const cardRecente = screen.getByRole('button', { name: rotulo(VOO_RECENTE, '1 hora, 15 minutos e 30 segundos') })

      // O foco está no título "Voos" depois do clique; o Tab segue para os cards.
      await userEvent.tab()
      expect(cardRecente).toHaveFocus()
      await userEvent.tab()
      expect(cardAntigo).toHaveFocus()
      await userEvent.keyboard('{Enter}')

      expect(telaDoVoo(VOO_ANTIGO)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Voltar à lista' })).toHaveFocus()

      await userEvent.keyboard('{Escape}')
      await flush()

      expect(telaDaLista()).toBeInTheDocument()
      expect(screen.getByRole('button', { name: rotulo(VOO_ANTIGO, '0 segundos') })).toHaveFocus()
    })

    it('deve voltar à lista pelo botão "Voos" da barra quando está na tela do voo', async () => {
      await renderApp(createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE] }))
      await abrirVoos()
      await userEvent.click(screen.getByRole('button', { name: rotulo(VOO_RECENTE, '1 hora, 15 minutos e 30 segundos') }))

      await abrirVoos()

      expect(telaDaLista()).toBeInTheDocument()
      expect(telaDoVoo(VOO_RECENTE)).not.toBeInTheDocument()
    })

    it('deve voltar ao painel pelo botão "Painel"', async () => {
      await renderApp(createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE] }))
      await abrirVoos()

      await userEvent.click(botaoNav('Painel'))

      expect(screen.getByText(ORIENTACAO)).toBeInTheDocument()
      expect(telaDaLista()).not.toBeInTheDocument()
      expect(botaoNav('Painel')).toHaveAttribute('aria-current', 'page')
    })

    it('não deve recarregar a lista ao clicar de novo em "Voos" já estando nela', async () => {
      const fake = createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE] })
      await renderApp(fake)
      await abrirVoos()

      await abrirVoos()

      expect(fake.api.listSessoesEncerradas).toHaveBeenCalledOnce()
    })

    it('deve buscar a lista de novo a cada abertura de "Voos"', async () => {
      const fake = createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE] })
      await renderApp(fake)
      await abrirVoos()
      await userEvent.click(botaoNav('Painel'))

      await abrirVoos()

      expect(fake.api.listSessoesEncerradas).toHaveBeenCalledTimes(2)
    })

    it('deve manter a barra de estado visível nas 3 telas', async () => {
      await renderApp(
        createFakeApi({ sessao: makeSessao(), conexao: 'conectado', sessoesEncerradas: [VOO_RECENTE] })
      )
      expect(within(statusBar()).getByText('Sessão ativa')).toBeInTheDocument()

      await abrirVoos()
      expect(within(statusBar()).getByText('Sessão ativa')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: rotulo(VOO_RECENTE, '1 hora, 15 minutos e 30 segundos') }))
      expect(telaDoVoo(VOO_RECENTE)).toBeInTheDocument()
      expect(within(statusBar()).getByText('Sessão ativa')).toBeInTheDocument()
    })

    it('deve atualizar a barra de estado com a conexão mesmo fora do painel', async () => {
      const fake = createFakeApi({ sessao: makeSessao(), conexao: 'conectado', sessoesEncerradas: [] })
      await renderApp(fake)
      await abrirVoos()

      fake.emitConnection('desconectado')

      expect(within(statusBar()).getByText('Sem conexão')).toBeInTheDocument()
    })

    it('deve mostrar no painel os valores ao vivo que chegaram enquanto a lista estava aberta', async () => {
      const fake = createFakeApi({ sessao: makeSessao(), sessoesEncerradas: [] })
      await renderApp(fake)
      fake.emitReadings(pacote('sess-1', 4500))

      await abrirVoos()
      expect(screen.queryByRole('region', { name: 'Painel de tempo real' })).not.toBeInTheDocument()
      fake.emitReadings(pacote('sess-1', 4620))
      await userEvent.click(botaoNav('Painel'))

      expect(within(grupoDe('Altitude MSL')).getByText('4.620')).toBeInTheDocument()
      expect(avisoSemSinal()).toBeUndefined()
    })

    it('deve voltar ao painel com "Coleta iniciada" quando a sessão começa com a lista aberta', async () => {
      const fake = createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE] })
      await renderApp(fake)
      await abrirVoos()

      fake.emitSessionStarted(makeSessao({ id: 'sess-2' }))

      expect(telaDaLista()).not.toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Painel de tempo real' })).toBeInTheDocument()
      expect(botaoNav('Painel')).toHaveAttribute('aria-current', 'page')
      expect(notificacao('Coleta iniciada')).toBeDefined()
    })

    it('deve voltar ao painel com "Coleta iniciada" quando a sessão começa com a tela do voo aberta', async () => {
      const fake = createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE] })
      await renderApp(fake)
      await abrirVoos()
      await userEvent.click(screen.getByRole('button', { name: rotulo(VOO_RECENTE, '1 hora, 15 minutos e 30 segundos') }))

      fake.emitSessionStarted(makeSessao({ id: 'sess-2' }))

      expect(telaDoVoo(VOO_RECENTE)).not.toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Painel de tempo real' })).toBeInTheDocument()
      expect(notificacao('Coleta iniciada')).toBeDefined()
    })

    it('deve continuar na lista, atualizá-la e notificar quando a sessão encerra com a lista aberta', async () => {
      const ativa = makeSessao({ id: 'sess-1', iniciadaEm: '2026-11-17T15:00:00.000Z' })
      const encerrada = { ...ativa, status: 'encerrada' as const, encerradaEm: '2026-11-17T15:45:00.000Z' }
      const fake = createFakeApi({ sessao: ativa, sessoesEncerradas: [VOO_RECENTE] })
      await renderApp(fake)
      await abrirVoos()
      ;(fake.api.listSessoesEncerradas as ReturnType<typeof vi.fn>).mockResolvedValue([
        encerrada,
        VOO_RECENTE,
      ])

      fake.emitSessionEnded(encerrada)
      await flush()

      expect(telaDaLista()).toBeInTheDocument()
      expect(fake.api.listSessoesEncerradas).toHaveBeenCalledTimes(2)
      expect(within(screen.getByRole('list')).getAllByRole('button')[0]).toHaveAccessibleName(
        rotulo(encerrada, '45 minutos')
      )
      expect(notificacao(SUCESSO_ENCERRAMENTO)).toBeDefined()
    })

    it('deve continuar na tela do voo quando a sessão encerra', async () => {
      const ativa = makeSessao()
      const fake = createFakeApi({ sessao: ativa, sessoesEncerradas: [VOO_RECENTE] })
      await renderApp(fake)
      await abrirVoos()
      await userEvent.click(screen.getByRole('button', { name: rotulo(VOO_RECENTE, '1 hora, 15 minutos e 30 segundos') }))

      fake.emitSessionEnded(encerrar(ativa))

      expect(telaDoVoo(VOO_RECENTE)).toBeInTheDocument()
      expect(notificacao(SUCESSO_ENCERRAMENTO)).toBeDefined()
    })

    it('deve continuar na lista, sem nova busca, quando a gravação do encerramento falha', async () => {
      const ativa = makeSessao()
      const fake = createFakeApi({ sessao: ativa, sessoesEncerradas: [VOO_RECENTE] })
      await renderApp(fake)
      await abrirVoos()

      fake.emitSessionEndFailed(ativa)
      await flush()

      expect(telaDaLista()).toBeInTheDocument()
      expect(fake.api.listSessoesEncerradas).toHaveBeenCalledOnce()
      expect(notificacao(ERRO_ENCERRAMENTO)).toBeDefined()
    })

    it('deve continuar na tela do voo quando a gravação do encerramento falha', async () => {
      const ativa = makeSessao()
      const fake = createFakeApi({ sessao: ativa, sessoesEncerradas: [VOO_RECENTE] })
      await renderApp(fake)
      await abrirVoos()
      await userEvent.click(screen.getByRole('button', { name: rotulo(VOO_RECENTE, '1 hora, 15 minutos e 30 segundos') }))

      fake.emitSessionEndFailed(ativa)

      expect(telaDoVoo(VOO_RECENTE)).toBeInTheDocument()
      expect(notificacao(ERRO_ENCERRAMENTO)).toBeDefined()
    })

    // ---------- foco ao trocar de tela (HITL-3 do loop-005) ----------

    function tituloPainel(): HTMLElement {
      return screen.getByRole('heading', { level: 1, name: 'Painel de tempo real' })
    }

    it('não deve mover o foco na carga inicial do app', async () => {
      await renderApp(createFakeApi({ sessao: makeSessao(), sessoesEncerradas: [VOO_RECENTE] }))

      expect(tituloPainel()).toBeInTheDocument()
      expect(tituloPainel()).not.toHaveFocus()
      expect(document.body).toHaveFocus()
    })

    it('deve ter no painel um título h1 visualmente oculto "Painel de tempo real", focável só por script', async () => {
      await renderApp(createFakeApi({ sessao: null }))

      const titulo = tituloPainel()
      expect(titulo).toHaveAttribute('tabindex', '-1')
      const estilo = titulo.getAttribute('style') ?? ''
      expect(estilo).toContain('position: absolute')
      expect(estilo).toContain('width: 1px')
      expect(estilo).toContain('height: 1px')
      expect(estilo).toContain('overflow: hidden')
    })

    it('deve pôr o foco no título "Voos" ao ir para a lista pela barra', async () => {
      await renderApp(createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE] }))

      await abrirVoos()

      expect(telaDaLista()).toHaveFocus()
    })

    it('deve pôr o foco no título "Voos" ao ir para a lista pela barra estando na tela do voo', async () => {
      await renderApp(createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE] }))
      await abrirVoos()
      await userEvent.click(
        screen.getByRole('button', { name: rotulo(VOO_RECENTE, '1 hora, 15 minutos e 30 segundos') })
      )

      await abrirVoos()

      expect(telaDaLista()).toHaveFocus()
    })

    it('deve pôr o foco no título oculto do painel ao ir para o painel pela barra', async () => {
      await renderApp(createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE] }))
      await abrirVoos()

      await userEvent.click(botaoNav('Painel'))

      expect(tituloPainel()).toHaveFocus()
    })

    it('deve pôr o foco no título oculto do painel ao ir para o painel pela barra estando na tela do voo', async () => {
      await renderApp(createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE] }))
      await abrirVoos()
      await userEvent.click(
        screen.getByRole('button', { name: rotulo(VOO_RECENTE, '1 hora, 15 minutos e 30 segundos') })
      )

      await userEvent.click(botaoNav('Painel'))

      expect(tituloPainel()).toHaveFocus()
    })

    it('não deve mover o foco ao clicar em "Painel" já estando no painel', async () => {
      await renderApp(createFakeApi({ sessao: null }))

      await userEvent.click(botaoNav('Painel'))

      expect(botaoNav('Painel')).toHaveFocus()
      expect(tituloPainel()).not.toHaveFocus()
    })

    it('deve pôr o foco no título oculto do painel na volta automática vinda da lista (session:started)', async () => {
      const fake = createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE] })
      await renderApp(fake)
      await abrirVoos()

      fake.emitSessionStarted(makeSessao({ id: 'sess-2' }))

      expect(tituloPainel()).toHaveFocus()
    })

    it('deve pôr o foco no título oculto do painel na volta automática vinda da tela do voo (session:started)', async () => {
      const fake = createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE] })
      await renderApp(fake)
      await abrirVoos()
      await userEvent.click(
        screen.getByRole('button', { name: rotulo(VOO_RECENTE, '1 hora, 15 minutos e 30 segundos') })
      )
      expect(screen.getByRole('button', { name: 'Voltar à lista' })).toHaveFocus()

      fake.emitSessionStarted(makeSessao({ id: 'sess-2' }))

      expect(tituloPainel()).toHaveFocus()
      expect(document.body).not.toHaveFocus()
    })

    it('não deve roubar o foco quando session:started chega com o painel já aberto', async () => {
      const fake = createFakeApi({ sessao: null })
      await renderApp(fake)
      botaoNav('Voos').focus()

      fake.emitSessionStarted(makeSessao({ id: 'sess-2' }))

      expect(botaoNav('Voos')).toHaveFocus()
      expect(tituloPainel()).not.toHaveFocus()
    })

    it('não deve roubar o foco quando session:started chega depois de voltar ao painel pela barra', async () => {
      const fake = createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE] })
      await renderApp(fake)
      await abrirVoos()
      await userEvent.click(botaoNav('Painel'))
      botaoNav('Voos').focus()

      fake.emitSessionStarted(makeSessao({ id: 'sess-2' }))

      expect(botaoNav('Voos')).toHaveFocus()
    })

    it('deve pôr o foco no título "Voos" ao voltar da tela do voo quando o card de origem não existe mais', async () => {
      const fake = createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE, VOO_ANTIGO] })
      await renderApp(fake)
      await abrirVoos()
      await userEvent.click(screen.getByRole('button', { name: rotulo(VOO_ANTIGO, '0 segundos') }))
      ;(fake.api.listSessoesEncerradas as ReturnType<typeof vi.fn>).mockResolvedValue([VOO_RECENTE])

      await userEvent.click(screen.getByRole('button', { name: 'Voltar à lista' }))
      await flush()

      expect(telaDaLista()).toHaveFocus()
      expect(
        screen.queryByRole('button', { name: rotulo(VOO_ANTIGO, '0 segundos') })
      ).not.toBeInTheDocument()
    })

    it('deve descrever "Voltar à lista" pelo título do voo e pelo aviso', async () => {
      await renderApp(createFakeApi({ sessao: null, sessoesEncerradas: [VOO_RECENTE] }))
      await abrirVoos()
      await userEvent.click(
        screen.getByRole('button', { name: rotulo(VOO_RECENTE, '1 hora, 15 minutos e 30 segundos') })
      )

      const voltar = screen.getByRole('button', { name: 'Voltar à lista' })
      expect(voltar).toHaveFocus()
      expect(voltar).toHaveAccessibleDescription(
        `Voo de ${formatarDataDoVoo(VOO_RECENTE.iniciadaEm)} Debriefing disponível em breve`
      )
    })

    it('deve remover todos os listeners ao desmontar com a lista aberta', async () => {
      const fake = createFakeApi({ sessao: makeSessao(), sessoesEncerradas: [VOO_RECENTE] })
      const { unmount } = await renderApp(fake)
      await abrirVoos()

      unmount()

      expect(fake.totalListeners()).toBe(0)
    })
  })
})
