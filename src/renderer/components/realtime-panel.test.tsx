import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import { RealtimePanel } from './realtime-panel'
import type { ParametroDeVoo } from '../../shared/types'

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
})
