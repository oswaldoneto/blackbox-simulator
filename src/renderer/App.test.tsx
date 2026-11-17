import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest'
import { render, screen, cleanup, act, within } from '@testing-library/react'
import { App } from './App'
import type { ElectronApi } from './electron-api'
import type { EstadoConexao, PacoteDeLeituras, ParametroDeVoo, Sessao } from '../shared/types'

// ---------- fake window.electronApi ----------

type Listener<T> = (payload: T) => void

interface FakeApiOptions {
  sessao?: Sessao | null
  conexao?: EstadoConexao
  parametros?: ParametroDeVoo[]
}

interface FakeApi {
  api: ElectronApi
  emitSessionStarted: (s: Sessao) => void
  emitSessionEnded: (s: Sessao) => void
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
  const readings: Listener<PacoteDeLeituras>[] = []
  const connection: Listener<EstadoConexao>[] = []

  const api: ElectronApi = {
    getActiveSessao: vi.fn().mockResolvedValue(opts.sessao ?? null),
    onSessionStarted: (cb) => subscribe(started, cb),
    onSessionEnded: (cb) => subscribe(ended, cb),
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
    emitReadings: emitir(readings),
    emitConnection: emitir(connection),
    totalListeners: () => started.length + ended.length + readings.length + connection.length,
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
})
