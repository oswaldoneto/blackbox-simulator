import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusBar } from './StatusBar'
import type { Sessao } from '../../shared/types'

afterEach(cleanup)

/** Props de navegação (UC-004) que não importam nos testes do indicador. */
const nav = { secaoAtual: 'painel' as const, onNavegar: () => undefined }

const sessaoAtiva: Sessao = {
  id: 'abc-123',
  iniciadaEm: '2024-01-01T00:00:00.000Z',
  encerradaEm: null,
  aeronave: 'Cessna 172',
  aerodromoOrigem: null,
  aerodromoDestino: null,
  status: 'ativa',
  parametrosNaoAplicaveis: [],
}

describe('StatusBar', () => {
  it('deve exibir "Blackbox Simulator" como nome da aplicação', () => {
    render(<StatusBar sessaoAtiva={null} conexao="conectado" {...nav} />)
    expect(screen.getByText('Blackbox Simulator')).toBeInTheDocument()
  })

  it('deve exibir "Sessão ativa" e ponto colorido quando conectado com sessão ativa', () => {
    const { container } = render(<StatusBar sessaoAtiva={sessaoAtiva} conexao="conectado" {...nav} />)
    expect(screen.getByText('Sessão ativa')).toBeInTheDocument()
    expect(screen.getByLabelText('Sessão ativa')).toBeInTheDocument()
    // The dot span is the first child of the indicator wrapper; verify its style string
    const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement
    expect(dot.getAttribute('style')).toContain('var(--color-success)')
  })

  it('deve exibir "Sem conexão" quando desconectado e sem sessão', () => {
    const { container } = render(<StatusBar sessaoAtiva={null} conexao="desconectado" {...nav} />)
    expect(screen.getByText('Sem conexão')).toBeInTheDocument()
    expect(screen.getByLabelText('Sem conexão')).toBeInTheDocument()
    const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement
    expect(dot.getAttribute('style')).toContain('var(--color-error)')
  })

  it('deve exibir "Sem conexão" no lugar de "Sessão ativa" quando a conexão cai durante a sessão', () => {
    render(<StatusBar sessaoAtiva={sessaoAtiva} conexao="desconectado" {...nav} />)
    expect(screen.getByText('Sem conexão')).toBeInTheDocument()
    expect(screen.queryByText('Sessão ativa')).not.toBeInTheDocument()
  })

  it('deve exibir "Aguardando motor" quando conectado sem sessão', () => {
    const { container } = render(<StatusBar sessaoAtiva={null} conexao="conectado" {...nav} />)
    expect(screen.getByText('Aguardando motor')).toBeInTheDocument()
    expect(screen.getByLabelText('Aguardando motor')).toBeInTheDocument()
    expect(screen.queryByText('Sem conexão')).not.toBeInTheDocument()
    const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement
    expect(dot.getAttribute('style')).toContain('var(--color-text-secondary)')
  })

  it('deve exibir "Encerrada" quando conectado e a sessão tem status !== "ativa"', () => {
    const sessaoEncerrada: Sessao = { ...sessaoAtiva, status: 'encerrada' }
    render(<StatusBar sessaoAtiva={sessaoEncerrada} conexao="conectado" {...nav} />)
    expect(screen.getByText('Encerrada')).toBeInTheDocument()
    expect(screen.getByLabelText('Encerrada')).toBeInTheDocument()
  })

  it('deve exibir cor secundária no ponto quando sessaoAtiva tem status !== "ativa"', () => {
    const sessaoEncerrada: Sessao = { ...sessaoAtiva, status: 'encerrada' }
    const { container } = render(<StatusBar sessaoAtiva={sessaoEncerrada} conexao="conectado" {...nav} />)
    const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement
    expect(dot.getAttribute('style')).toContain('var(--color-text-secondary)')
  })

  it('deve exibir "Sem conexão" quando desconectado com a sessão encerrada', () => {
    const sessaoEncerrada: Sessao = { ...sessaoAtiva, status: 'encerrada' }
    render(<StatusBar sessaoAtiva={sessaoEncerrada} conexao="desconectado" {...nav} />)
    expect(screen.getByText('Sem conexão')).toBeInTheDocument()
    expect(screen.queryByText('Encerrada')).not.toBeInTheDocument()
  })

  describe('navegação (UC-004)', () => {
    function navegacao(): HTMLElement {
      return screen.getByRole('navigation', { name: 'Navegação principal' })
    }

    it('deve exibir os botões "Painel" e "Voos", nessa ordem, na barra', () => {
      render(<StatusBar sessaoAtiva={null} conexao="conectado" secaoAtual="painel" onNavegar={vi.fn()} />)

      const botoes = within(navegacao()).getAllByRole('button')
      expect(botoes.map((b) => b.textContent)).toEqual(['Painel', 'Voos'])
      expect(screen.getByRole('banner')).toContainElement(navegacao())
    })

    it('deve pôr a navegação logo depois do nome do app', () => {
      render(<StatusBar sessaoAtiva={null} conexao="conectado" secaoAtual="painel" onNavegar={vi.fn()} />)
      expect(screen.getByText('Blackbox Simulator').nextElementSibling).toBe(navegacao())
    })

    it('deve marcar "Painel" com aria-current="page" quando a seção atual é o painel', () => {
      render(<StatusBar sessaoAtiva={null} conexao="conectado" secaoAtual="painel" onNavegar={vi.fn()} />)

      expect(screen.getByRole('button', { name: 'Painel' })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('button', { name: 'Voos' })).not.toHaveAttribute('aria-current')
    })

    it('deve marcar "Voos" com aria-current="page" quando a seção atual é a de voos', () => {
      render(<StatusBar sessaoAtiva={null} conexao="conectado" secaoAtual="voos" onNavegar={vi.fn()} />)

      expect(screen.getByRole('button', { name: 'Voos' })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('button', { name: 'Painel' })).not.toHaveAttribute('aria-current')
    })

    it('deve chamar onNavegar com a seção do botão clicado', async () => {
      const onNavegar = vi.fn()
      render(<StatusBar sessaoAtiva={null} conexao="conectado" secaoAtual="painel" onNavegar={onNavegar} />)

      await userEvent.click(screen.getByRole('button', { name: 'Voos' }))
      await userEvent.click(screen.getByRole('button', { name: 'Painel' }))

      expect(onNavegar.mock.calls).toEqual([['voos'], ['painel']])
    })

    it('deve ser acessível pelo teclado (Tab e Enter)', async () => {
      const onNavegar = vi.fn()
      render(<StatusBar sessaoAtiva={null} conexao="conectado" secaoAtual="painel" onNavegar={onNavegar} />)

      await userEvent.tab()
      expect(screen.getByRole('button', { name: 'Painel' })).toHaveFocus()
      await userEvent.tab()
      expect(screen.getByRole('button', { name: 'Voos' })).toHaveFocus()
      await userEvent.keyboard('{Enter}')

      expect(onNavegar).toHaveBeenCalledWith('voos')
    })

    it('deve manter a navegação com sessão ativa e sem conexão, junto do indicador de estado', () => {
      render(
        <StatusBar sessaoAtiva={sessaoAtiva} conexao="desconectado" secaoAtual="voos" onNavegar={vi.fn()} />
      )
      expect(within(navegacao()).getAllByRole('button')).toHaveLength(2)
      expect(screen.getByText('Sem conexão')).toBeInTheDocument()
    })
  })
})
