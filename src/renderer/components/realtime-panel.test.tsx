import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import { RealtimePanel } from './realtime-panel'
import type { ParametroDeVoo } from '../../shared/types'
import type { JanelaDeLeituras } from './janela-de-leituras'

afterEach(cleanup)

const PARAMETROS: ParametroDeVoo[] = [
  { id: 'altitude_msl', nome: 'Altitude MSL', unidade: 'ft', ativo: true },
  { id: 'airspeed_ias', nome: 'Velocidade IAS', unidade: 'kt', ativo: true },
  { id: 'vertical_speed', nome: 'Velocidade vertical', unidade: 'fpm', ativo: true },
  { id: 'heading_magnetic', nome: 'Rumo magnético', unidade: '°', ativo: true },
  { id: 'pitch', nome: 'Arfagem', unidade: '°', ativo: true },
  { id: 'bank', nome: 'Rolagem', unidade: '°', ativo: true },
]

const VALORES: Record<string, number> = {
  altitude_msl: 4500,
  airspeed_ias: 112,
  vertical_speed: 650,
  heading_magnetic: 5,
  pitch: 0,
  bank: 0,
}

describe('RealtimePanel', () => {
  it('deve exibir um indicador por parâmetro, na ordem recebida, dentro da grade', () => {
    const { container } = render(
      <RealtimePanel parametros={PARAMETROS} valores={VALORES} estado="ativa" />
    )
    const grade = container.querySelector('.realtime-grid') as HTMLElement
    expect(grade).not.toBeNull()
    const grupos = within(grade).getAllByRole('group')
    expect(grupos.map((g) => g.querySelector('.parameter-indicator__label')?.textContent)).toEqual([
      'Altitude MSL',
      'Velocidade IAS',
      'Velocidade vertical',
      'Rumo magnético',
      'Arfagem',
      'Rolagem',
    ])
  })

  it('deve exibir os valores formatados quando ativa', () => {
    render(<RealtimePanel parametros={PARAMETROS} valores={VALORES} estado="ativa" />)
    expect(screen.getByText('4.500')).toBeInTheDocument()
    expect(screen.getByText('+650')).toBeInTheDocument()
    expect(screen.getByText('005')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('deve exibir "—" para parâmetro sem valor recebido', () => {
    render(<RealtimePanel parametros={PARAMETROS} valores={{ altitude_msl: 4500 }} estado="ativa" />)
    expect(screen.getAllByText('—')).toHaveLength(5)
    expect(screen.getByRole('group', { name: 'Velocidade IAS: sem sinal' })).toBeInTheDocument()
  })

  it('deve exibir "—" em todos os parâmetros quando sem sinal, mesmo com valores', () => {
    render(<RealtimePanel parametros={PARAMETROS} valores={VALORES} estado="sem-sinal" />)
    expect(screen.getAllByText('—')).toHaveLength(6)
    PARAMETROS.forEach((p) =>
      expect(screen.getByRole('group', { name: `${p.nome}: sem sinal` })).toBeInTheDocument()
    )
  })

  it('deve exibir aviso "Sessão encerrada" sem role="status" e manter os valores', () => {
    render(<RealtimePanel parametros={PARAMETROS} valores={VALORES} estado="encerrada" />)
    const aviso = screen.getByText('Sessão encerrada')
    expect(aviso).not.toHaveAttribute('role', 'status')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('4.500')).toBeInTheDocument()
  })

  it('deve exibir o aviso "Sem sinal do simulador" com role="status" acima da grade quando sem sinal', () => {
    const { container } = render(
      <RealtimePanel parametros={PARAMETROS} valores={VALORES} estado="sem-sinal" />
    )
    const aviso = screen.getByRole('status')
    expect(aviso).toHaveTextContent('Sem sinal do simulador')
    const grade = container.querySelector('.realtime-grid') as HTMLElement
    expect(grade).not.toBeNull()
    expect(aviso.compareDocumentPosition(grade) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getAllByText('—')).toHaveLength(6)
  })

  it('não deve exibir o aviso "Sem sinal do simulador" quando ativa ou encerrada', () => {
    const { rerender } = render(
      <RealtimePanel parametros={PARAMETROS} valores={VALORES} estado="ativa" />
    )
    expect(screen.queryByText('Sem sinal do simulador')).not.toBeInTheDocument()
    rerender(<RealtimePanel parametros={PARAMETROS} valores={VALORES} estado="encerrada" />)
    expect(screen.queryByText('Sem sinal do simulador')).not.toBeInTheDocument()
  })

  it('deve exibir "Não foi possível carregar os parâmetros." no lugar da grade quando a consulta falhou', () => {
    const { container } = render(
      <RealtimePanel parametros={[]} valores={{}} estado="ativa" erroParametros />
    )
    expect(screen.getByText('Não foi possível carregar os parâmetros.')).toBeInTheDocument()
    expect(container.querySelector('.realtime-grid')).toBeNull()
    expect(screen.queryAllByRole('group')).toHaveLength(0)
  })

  it('deve exibir o aviso "Sem sinal do simulador" junto da mensagem de erro dos parâmetros', () => {
    render(<RealtimePanel parametros={[]} valores={{}} estado="sem-sinal" erroParametros />)
    expect(screen.getByRole('status')).toHaveTextContent('Sem sinal do simulador')
    expect(screen.getByText('Não foi possível carregar os parâmetros.')).toBeInTheDocument()
  })

  it('não deve exibir a mensagem de erro sem falha na consulta', () => {
    render(<RealtimePanel parametros={PARAMETROS} valores={VALORES} estado="ativa" />)
    expect(screen.queryByText('Não foi possível carregar os parâmetros.')).not.toBeInTheDocument()
  })

  it('deve ter rótulo acessível "Painel de tempo real"', () => {
    render(<RealtimePanel parametros={PARAMETROS} valores={VALORES} estado="ativa" />)
    expect(screen.getByRole('region', { name: 'Painel de tempo real' })).toBeInTheDocument()
  })

  // --- UC-006: 12 parâmetros e N/A ---

  describe('UC-006', () => {
    const DOZE: ParametroDeVoo[] = [
      ...PARAMETROS,
      { id: 'latitude', nome: 'Latitude', unidade: '°', ativo: true },
      { id: 'longitude', nome: 'Longitude', unidade: '°', ativo: true },
      { id: 'throttle_1', nome: 'Manete', unidade: '%', ativo: true },
      { id: 'mixture_1', nome: 'Mistura', unidade: '%', ativo: true },
      { id: 'rpm_1', nome: 'RPM', unidade: 'rpm', ativo: true },
      { id: 'flaps', nome: 'Flapes', unidade: '%', ativo: true },
    ]

    const VALORES_DOZE: Record<string, number> = {
      ...VALORES,
      latitude: -23.5505199,
      longitude: -46.6333094,
      throttle_1: 85,
      mixture_1: 100,
      rpm_1: 2450,
      flaps: 30,
    }

    function rotulos(container: HTMLElement): (string | null | undefined)[] {
      const grade = container.querySelector('.realtime-grid') as HTMLElement
      return within(grade)
        .getAllByRole('group')
        .map((g) => g.querySelector('.parameter-indicator__label')?.textContent)
    }

    it('deve exibir os 12 cards com o valor atual de cada um (CA-006-2)', () => {
      const { container } = render(
        <RealtimePanel parametros={DOZE} valores={VALORES_DOZE} estado="ativa" />
      )
      expect(rotulos(container)).toEqual(DOZE.map((p) => p.nome))
      expect(screen.getByRole('group', { name: 'Latitude: 23,55052 S °' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Longitude: 46,63331 O °' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Manete: 85 %' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Mistura: 100 %' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'RPM: 2.450 rpm' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Flapes: 30 %' })).toBeInTheDocument()
    })

    it('deve colocar os 12 cards dentro de um único elemento com a classe realtime-grid', () => {
      const { container } = render(
        <RealtimePanel parametros={DOZE} valores={VALORES_DOZE} estado="ativa" />
      )
      const grades = container.querySelectorAll('.realtime-grid')
      expect(grades).toHaveLength(1)
      expect(grades[0].querySelectorAll('.parameter-indicator')).toHaveLength(12)
    })

    it('deve exibir "N/A" nos parâmetros da lista e o valor nos demais (CA-006-4)', () => {
      render(
        <RealtimePanel
          parametros={DOZE}
          valores={VALORES_DOZE}
          estado="ativa"
          parametrosNaoAplicaveis={['mixture_1', 'flaps']}
        />
      )
      expect(screen.getAllByText('N/A')).toHaveLength(2)
      expect(screen.getByRole('group', { name: 'Mistura: não aplicável' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Flapes: não aplicável' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Manete: 85 %' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'RPM: 2.450 rpm' })).toBeInTheDocument()
    })

    it('deve manter "N/A" e não "—" quando sem sinal', () => {
      render(
        <RealtimePanel
          parametros={DOZE}
          valores={VALORES_DOZE}
          estado="sem-sinal"
          parametrosNaoAplicaveis={['mixture_1']}
        />
      )
      expect(screen.getByRole('group', { name: 'Mistura: não aplicável' })).toBeInTheDocument()
      expect(screen.getAllByText('N/A')).toHaveLength(1)
      expect(screen.getAllByText('—')).toHaveLength(11)
    })

    it('deve manter "N/A" na sessão encerrada, inclusive sem valores congelados', () => {
      render(
        <RealtimePanel
          parametros={DOZE}
          valores={{}}
          estado="encerrada"
          parametrosNaoAplicaveis={['flaps']}
        />
      )
      expect(screen.getByRole('group', { name: 'Flapes: não aplicável' })).toBeInTheDocument()
      expect(screen.getAllByText('—')).toHaveLength(11)
    })

    it('deve exibir "N/A" mesmo antes de chegar qualquer leitura', () => {
      render(
        <RealtimePanel
          parametros={DOZE}
          valores={{}}
          estado="ativa"
          parametrosNaoAplicaveis={['mixture_1']}
        />
      )
      expect(screen.getByRole('group', { name: 'Mistura: não aplicável' })).toBeInTheDocument()
    })

    it('não deve exibir "N/A" quando a lista está vazia ou ausente', () => {
      render(<RealtimePanel parametros={DOZE} valores={VALORES_DOZE} estado="ativa" />)
      expect(screen.queryByText('N/A')).not.toBeInTheDocument()
    })
  })

  // --- loop-007: gráficos de linha (UC-002) ---

  describe('gráficos de linha', () => {
    const LEGENDA = 'Gráficos: últimos 2 minutos. A ponta direita da linha é o valor atual.'
    const T = Date.parse('2024-01-01T00:00:10.000Z')
    const JANELA: JanelaDeLeituras = {
      series: {
        altitude_msl: [
          { t: T - 1000, v: 4480 },
          { t: T, v: 4500 },
        ],
        airspeed_ias: [
          { t: T - 1000, v: 110 },
          { t: T, v: 112 },
        ],
        pitch: [
          { t: T - 1000, v: 0 },
          { t: T, v: 0 },
        ],
      },
      ultimoInstante: T,
    }

    function graficos(container: HTMLElement): HTMLElement[] {
      return Array.from(container.querySelectorAll<HTMLElement>('.grafico-do-painel'))
    }

    it('deve exibir a legenda dos gráficos (decisão 12)', () => {
      render(<RealtimePanel parametros={PARAMETROS} valores={VALORES} estado="ativa" />)
      expect(screen.getByText(LEGENDA)).toBeInTheDocument()
    })

    it('deve trocar a legenda pela mensagem de erro quando a consulta dos parâmetros falhou', () => {
      render(<RealtimePanel parametros={[]} valores={{}} estado="ativa" erroParametros />)
      expect(screen.queryByText(LEGENDA)).not.toBeInTheDocument()
    })

    it('deve exibir um gráfico por card, com a ponta da linha no último pacote (CA-002-7)', () => {
      const { container } = render(
        <RealtimePanel parametros={PARAMETROS} valores={VALORES} estado="ativa" janela={JANELA} />
      )

      expect(graficos(container)).toHaveLength(6)
      const linha = within(screen.getByRole('group', { name: /^Altitude MSL:/ }))
        .getByText('Altitude MSL')
        .closest('.parameter-indicator')
        ?.querySelector('.grafico-do-painel__linha')
      expect(linha?.getAttribute('d')).toMatch(/L1000\.0 [\d.]+$/)
      expect(
        screen.getByRole('group', { name: 'Altitude MSL: 4.500 ft; últimos 2 minutos: de 4.480 a 4.500 ft' })
      ).toBeInTheDocument()
    })

    it('deve usar a cor do grupo, sem cinza, na sessão ativa', () => {
      const { container } = render(
        <RealtimePanel parametros={PARAMETROS} valores={VALORES} estado="ativa" janela={JANELA} />
      )

      for (const grafico of graficos(container)) {
        expect(grafico).not.toHaveClass('grafico-do-painel--sem-sinal')
      }
    })

    it('deve deixar as linhas cinza no sem sinal (CA-002-5)', () => {
      const { container } = render(
        <RealtimePanel parametros={PARAMETROS} valores={VALORES} estado="sem-sinal" janela={JANELA} />
      )

      const lista = graficos(container)
      expect(lista).toHaveLength(6)
      for (const grafico of lista) {
        expect(grafico).toHaveClass('grafico-do-painel--sem-sinal')
      }
    })

    it('deve congelar os gráficos na cor do grupo na sessão encerrada (CA-002-4, P3)', () => {
      const { container } = render(
        <RealtimePanel parametros={PARAMETROS} valores={VALORES} estado="encerrada" janela={JANELA} />
      )

      const lista = graficos(container)
      expect(lista[0]).toHaveClass('grafico-do-painel--voo')
      expect(lista[4]).toHaveClass('grafico-do-painel--atitude-posicao')
      for (const grafico of lista) {
        expect(grafico).not.toHaveClass('grafico-do-painel--sem-sinal')
      }
      expect(
        screen.getByRole('group', { name: 'Altitude MSL: 4.500 ft; últimos 2 minutos: de 4.480 a 4.500 ft' })
      ).toBeInTheDocument()
    })

    it('deve deixar as linhas cinza na sessão encerrada com os valores descartados (CA-002-4)', () => {
      const { container } = render(
        <RealtimePanel
          parametros={PARAMETROS}
          valores={{}}
          estado="encerrada"
          janela={JANELA}
          valoresDescartados
        />
      )

      for (const grafico of graficos(container)) {
        expect(grafico).toHaveClass('grafico-do-painel--sem-sinal')
      }
      expect(screen.getAllByText('—')).toHaveLength(6)
    })

    it('não deve exibir gráfico nos cards N/A (CA-002-18)', () => {
      const { container } = render(
        <RealtimePanel
          parametros={PARAMETROS}
          valores={VALORES}
          estado="ativa"
          janela={JANELA}
          parametrosNaoAplicaveis={['pitch']}
        />
      )

      expect(graficos(container)).toHaveLength(5)
      expect(screen.getByText('A aeronave não possui este item')).toBeInTheDocument()
    })

    it('deve exibir os gráficos vazios sem janela (início da sessão)', () => {
      const { container } = render(
        <RealtimePanel parametros={PARAMETROS} valores={{}} estado="ativa" />
      )

      expect(graficos(container)).toHaveLength(6)
      expect(container.querySelector('.grafico-do-painel__linha')).toBeNull()
      expect(container.querySelector('.grafico-do-painel__ponto')).toBeNull()
    })
  })
})
