import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ParameterIndicator } from './parameter-indicator'
import { CONFIG_GRAFICO_PAINEL } from './config-grafico-painel'
import type { PontoNoTempo } from './segmentar-serie'
import { PARAMETER_IDS, TODOS_PARAMETER_IDS } from '../../shared/parameter-ids'

afterEach(cleanup)

describe('ParameterIndicator', () => {
  it('deve exibir rótulo, valor formatado e unidade como textos separados', () => {
    render(
      <ParameterIndicator parametroId="altitude_msl" nome="Altitude MSL" unidade="ft" valor={4500} />
    )
    expect(screen.getByText('Altitude MSL')).toBeInTheDocument()
    expect(screen.getByText('4.500')).toBeInTheDocument()
    expect(screen.getByText('ft')).toBeInTheDocument()
  })

  it('deve expor role="group" com aria-label textual do valor', () => {
    render(
      <ParameterIndicator parametroId="airspeed_ias" nome="Velocidade IAS" unidade="kt" valor={112} />
    )
    expect(screen.getByRole('group', { name: 'Velocidade IAS: 112 kt' })).toBeInTheDocument()
  })

  it('deve exibir "—" e aria-label "sem sinal" quando o valor é null', () => {
    const { container } = render(
      <ParameterIndicator parametroId="pitch" nome="Arfagem" unidade="°" valor={null} />
    )
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Arfagem: sem sinal' })).toBeInTheDocument()
    expect(container.querySelector('.parameter-indicator__value--no-signal')).not.toBeNull()
  })

  it('não deve usar a classe de sem sinal quando há valor', () => {
    const { container } = render(
      <ParameterIndicator parametroId="pitch" nome="Arfagem" unidade="°" valor={0} />
    )
    expect(container.querySelector('.parameter-indicator__value--no-signal')).toBeNull()
  })

  it('não deve usar aria-live (sem anúncio a cada atualização)', () => {
    const { container } = render(
      <ParameterIndicator parametroId="bank" nome="Rolagem" unidade="°" valor={10} />
    )
    expect(container.querySelector('[aria-live]')).toBeNull()
  })

  // --- UC-006 / RN-007: N/A ---

  describe('naoAplicavel', () => {
    it('deve exibir "N/A" no lugar do valor e manter rótulo e unidade (CA-006-4)', () => {
      render(
        <ParameterIndicator
          parametroId="mixture_1"
          nome="Mistura"
          unidade="%"
          valor={100}
          naoAplicavel
        />
      )
      expect(screen.getByText('N/A')).toBeInTheDocument()
      expect(screen.getByText('Mistura')).toBeInTheDocument()
      expect(screen.getByText('%')).toBeInTheDocument()
      expect(screen.queryByText('100')).not.toBeInTheDocument()
    })

    it('deve usar aria-label "<rótulo>: não aplicável"', () => {
      render(
        <ParameterIndicator parametroId="flaps" nome="Flapes" unidade="%" valor={0} naoAplicavel />
      )
      expect(screen.getByRole('group', { name: 'Flapes: não aplicável' })).toBeInTheDocument()
    })

    it('deve vencer o "—" quando o valor é null', () => {
      render(
        <ParameterIndicator parametroId="flaps" nome="Flapes" unidade="%" valor={null} naoAplicavel />
      )
      expect(screen.getByText('N/A')).toBeInTheDocument()
      expect(screen.queryByText('—')).not.toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Flapes: sem sinal' })).not.toBeInTheDocument()
    })

    it('deve usar o mesmo estilo do "—" (classe de sem valor)', () => {
      const { container } = render(
        <ParameterIndicator parametroId="flaps" nome="Flapes" unidade="%" valor={10} naoAplicavel />
      )
      expect(container.querySelector('.parameter-indicator__value--no-signal')).not.toBeNull()
    })

    it('deve exibir o valor normalmente quando naoAplicavel é falso', () => {
      render(
        <ParameterIndicator
          parametroId="flaps"
          nome="Flapes"
          unidade="%"
          valor={0}
          naoAplicavel={false}
        />
      )
      expect(screen.getByRole('group', { name: 'Flapes: 0 %' })).toBeInTheDocument()
      expect(screen.queryByText('N/A')).not.toBeInTheDocument()
    })
  })

  // --- loop-007: gráfico de linha (UC-002) ---

  describe('gráfico de linha', () => {
    const AGORA = Date.parse('2026-11-17T12:00:00.000Z')
    const PONTOS: PontoNoTempo[] = [
      { t: AGORA - 2000, v: 4300 },
      { t: AGORA - 1000, v: 4700 },
      { t: AGORA, v: 4500 },
    ]

    function renderAltitude(extra: Partial<React.ComponentProps<typeof ParameterIndicator>> = {}) {
      return render(
        <ParameterIndicator
          parametroId={PARAMETER_IDS.ALTITUDE_MSL}
          nome="Altitude MSL"
          unidade="ft"
          valor={4500}
          pontos={PONTOS}
          agora={AGORA}
          {...extra}
        />
      )
    }

    it('deve desenhar a linha, a área e os limites da escala abaixo do valor (CA-002-7)', () => {
      const { container } = renderAltitude()
      const grafico = container.querySelector('.grafico-do-painel') as HTMLElement

      expect(grafico).not.toBeNull()
      expect(grafico.querySelector('svg')).toHaveAttribute('viewBox', '0 0 1000 100')
      expect(grafico.querySelector('.grafico-do-painel__linha')?.getAttribute('d')).toMatch(/^M/)
      expect(grafico.querySelector('.grafico-do-painel__area')?.getAttribute('d')).toMatch(/Z$/)
      const limites = Array.from(grafico.querySelectorAll('.grafico-do-painel__limites span')).map(
        (el) => el.textContent
      )
      expect(limites).toEqual(['4.270', '4.730'])
      const valor = container.querySelector('.parameter-indicator__value') as HTMLElement
      expect(valor.compareDocumentPosition(grafico) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('deve ocultar o desenho e os limites do leitor de tela (CA-002-19)', () => {
      const { container } = renderAltitude()
      const grafico = container.querySelector('.grafico-do-painel') as HTMLElement

      expect(grafico).toHaveAttribute('aria-hidden', 'true')
      expect(grafico.querySelector('svg')).toHaveAttribute('focusable', 'false')
      expect(grafico.contains(container.querySelector('.grafico-do-painel__limites'))).toBe(true)
    })

    it('deve ler valor e faixa dos últimos 2 minutos no rótulo do grupo (CA-002-19)', () => {
      renderAltitude()

      expect(
        screen.getByRole('group', {
          name: 'Altitude MSL: 4.500 ft; últimos 2 minutos: de 4.300 a 4.700 ft',
        })
      ).toBeInTheDocument()
    })

    it('não deve usar aria-live no card com gráfico (CA-002-19)', () => {
      const { container } = renderAltitude()
      expect(container.querySelector('[aria-live]')).toBeNull()
    })

    it('deve desenhar uma leitura única como ponto isolado (CA-002-14)', () => {
      const { container } = renderAltitude({ pontos: [{ t: AGORA, v: 4500 }] })

      expect(container.querySelector('.grafico-do-painel__linha')).toBeNull()
      expect(container.querySelector('.grafico-do-painel__ponto')).toHaveAttribute(
        'd',
        'M1000.0 50.0 L1000.0 50.0'
      )
    })

    it('deve mostrar o gráfico sem linha e sem limites automáticos antes da primeira leitura', () => {
      const { container } = render(
        <ParameterIndicator parametroId={PARAMETER_IDS.ALTITUDE_MSL} nome="Altitude MSL" unidade="ft" valor={null} />
      )

      expect(container.querySelector('.grafico-do-painel')).not.toBeNull()
      expect(container.querySelector('.grafico-do-painel__linha')).toBeNull()
      expect(container.querySelector('.grafico-do-painel__limites')?.textContent).toBe('')
      expect(screen.getByRole('group', { name: 'Altitude MSL: sem sinal' })).toBeInTheDocument()
    })

    it.each(TODOS_PARAMETER_IDS.map((id) => [id, CONFIG_GRAFICO_PAINEL[id].grupo]))(
      'deve usar a classe do grupo no gráfico de %s (%s) (CA-002-13)',
      (id, grupo) => {
        const { container } = render(
          <ParameterIndicator parametroId={id} nome="Rótulo" unidade="u" valor={1} pontos={[{ t: AGORA, v: 1 }]} agora={AGORA} />
        )
        const grafico = container.querySelector('.grafico-do-painel') as HTMLElement
        expect(grafico).toHaveClass(`grafico-do-painel--${grupo}`)
        expect(grafico).not.toHaveClass('grafico-do-painel--sem-sinal')
        expect(screen.getByText('Rótulo')).toBeInTheDocument()
      }
    )

    it('deve usar a classe --sem-sinal com a linha cinza e manter a linha desenhada (CA-002-5)', () => {
      const { container } = renderAltitude({ valor: null, linhaCinza: true })
      const grafico = container.querySelector('.grafico-do-painel') as HTMLElement

      expect(grafico).toHaveClass('grafico-do-painel--sem-sinal')
      expect(grafico).toHaveClass('grafico-do-painel--voo')
      expect(grafico.querySelector('.grafico-do-painel__linha')).not.toBeNull()
      expect(screen.getByText('—')).toBeInTheDocument()
      expect(
        screen.getByRole('group', {
          name: 'Altitude MSL: sem sinal; últimos 2 minutos: de 4.300 a 4.700 ft',
        })
      ).toBeInTheDocument()
    })

    it('deve mostrar no número o valor real fora da escala fixa (CA-002-10)', () => {
      const { container } = render(
        <ParameterIndicator
          parametroId={PARAMETER_IDS.THROTTLE_1}
          nome="Manete"
          unidade="%"
          valor={-20}
          pontos={[
            { t: AGORA - 1000, v: 10 },
            { t: AGORA, v: -20 },
          ]}
          agora={AGORA}
        />
      )

      expect(container.querySelector('.parameter-indicator__value')).toHaveTextContent('−20')
      expect(container.querySelector('.grafico-do-painel__linha')).toHaveAttribute('d', 'M991.7 86.0 L1000.0 95.0')
    })

    it('não deve desenhar gráfico para um parâmetro desconhecido', () => {
      const { container } = render(
        <ParameterIndicator parametroId="fuel_qty" nome="Combustível" unidade="gal" valor={10} agora={AGORA} />
      )
      expect(container.querySelector('.grafico-do-painel')).toBeNull()
    })

    describe('card N/A (CA-002-18)', () => {
      it('deve mostrar "N/A" com a unidade, sem gráfico, com o texto da caixa', () => {
        const { container } = render(
          <ParameterIndicator
            parametroId={PARAMETER_IDS.MIXTURE_1}
            nome="Mistura"
            unidade="%"
            valor={100}
            naoAplicavel
            pontos={[{ t: AGORA, v: 100 }]}
            agora={AGORA}
          />
        )

        expect(screen.getByText('N/A')).toBeInTheDocument()
        expect(screen.getByText('%')).toBeInTheDocument()
        expect(container.querySelector('.grafico-do-painel')).toBeNull()
        expect(container.querySelector('svg')).toBeNull()
        expect(container.querySelector('.parameter-indicator__sem-item')).toHaveTextContent(
          'A aeronave não possui este item'
        )
        expect(screen.getByRole('group', { name: 'Mistura: não aplicável' })).toBeInTheDocument()
      })

      it('não deve ter a caixa N/A nos cards aplicáveis', () => {
        const { container } = renderAltitude()
        expect(container.querySelector('.parameter-indicator__sem-item')).toBeNull()
        expect(screen.queryByText('A aeronave não possui este item')).not.toBeInTheDocument()
      })
    })
  })
})
