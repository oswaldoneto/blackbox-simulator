import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { StatusBar } from './StatusBar'
import type { Sessao } from '../../shared/types'

afterEach(cleanup)

const sessaoAtiva: Sessao = {
  id: 'abc-123',
  iniciadaEm: '2024-01-01T00:00:00.000Z',
  encerradaEm: null,
  aeronave: 'Cessna 172',
  aerodromoOrigem: null,
  aerodromoDestino: null,
  status: 'ativa',
}

describe('StatusBar', () => {
  it('deve exibir "Blackbox Simulator" como nome da aplicação', () => {
    render(<StatusBar sessaoAtiva={null} />)
    expect(screen.getByText('Blackbox Simulator')).toBeInTheDocument()
  })

  it('deve exibir "Sessão ativa" e ponto colorido quando sessaoAtiva não é null', () => {
    const { container } = render(<StatusBar sessaoAtiva={sessaoAtiva} />)
    expect(screen.getByText('Sessão ativa')).toBeInTheDocument()
    expect(screen.getByLabelText('Sessão ativa')).toBeInTheDocument()
    // The dot span is the first child of the indicator wrapper; verify its style string
    const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement
    expect(dot.getAttribute('style')).toContain('var(--color-success)')
  })

  it('deve exibir "Sem conexão" quando sessaoAtiva é null', () => {
    render(<StatusBar sessaoAtiva={null} />)
    expect(screen.getByText('Sem conexão')).toBeInTheDocument()
    expect(screen.getByLabelText('Sem conexão')).toBeInTheDocument()
  })

  it('deve exibir "Encerrada" quando sessaoAtiva tem status !== "ativa"', () => {
    const sessaoEncerrada: Sessao = { ...sessaoAtiva, status: 'encerrada' }
    render(<StatusBar sessaoAtiva={sessaoEncerrada} />)
    expect(screen.getByText('Encerrada')).toBeInTheDocument()
    expect(screen.getByLabelText('Encerrada')).toBeInTheDocument()
  })

  it('deve exibir cor secundária no ponto quando sessaoAtiva tem status !== "ativa"', () => {
    const sessaoEncerrada: Sessao = { ...sessaoAtiva, status: 'encerrada' }
    const { container } = render(<StatusBar sessaoAtiva={sessaoEncerrada} />)
    const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement
    expect(dot.getAttribute('style')).toContain('var(--color-text-secondary)')
  })
})
