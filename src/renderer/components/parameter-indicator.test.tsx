import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ParameterIndicator } from './parameter-indicator'

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
})
