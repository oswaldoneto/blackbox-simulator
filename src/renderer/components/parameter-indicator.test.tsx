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
})
