import { describe, it, expect } from 'vitest'
import { derivePanelState } from './panel-state'
import type { Sessao } from '../../shared/types'

const sessaoAtiva: Sessao = {
  id: 'sess-1',
  iniciadaEm: '2024-01-01T00:00:00.000Z',
  encerradaEm: null,
  aeronave: '',
  aerodromoOrigem: null,
  aerodromoDestino: null,
  status: 'ativa',
  parametrosNaoAplicaveis: [],
}

const sessaoEncerrada: Sessao = {
  ...sessaoAtiva,
  status: 'encerrada',
  encerradaEm: '2024-01-01T01:00:00.000Z',
}

describe('derivePanelState', () => {
  it('deve devolver "sem-sessao" quando não há sessão, qualquer que seja a conexão', () => {
    expect(derivePanelState({ sessao: null, conexao: 'conectado' })).toBe('sem-sessao')
    expect(derivePanelState({ sessao: null, conexao: 'desconectado', semDados: true })).toBe(
      'sem-sessao'
    )
  })

  it('deve devolver "encerrada" para sessão encerrada, mesmo desconectado ou sem dados', () => {
    expect(derivePanelState({ sessao: sessaoEncerrada, conexao: 'conectado' })).toBe('encerrada')
    expect(
      derivePanelState({ sessao: sessaoEncerrada, conexao: 'desconectado', semDados: true })
    ).toBe('encerrada')
  })

  it('deve devolver "sem-sinal" com sessão ativa e conexão perdida', () => {
    expect(derivePanelState({ sessao: sessaoAtiva, conexao: 'desconectado' })).toBe('sem-sinal')
  })

  it('deve devolver "sem-sinal" com sessão ativa, conectado, mas sem dados', () => {
    expect(derivePanelState({ sessao: sessaoAtiva, conexao: 'conectado', semDados: true })).toBe(
      'sem-sinal'
    )
  })

  it('deve devolver "ativa" com sessão ativa, conectado e com dados', () => {
    expect(derivePanelState({ sessao: sessaoAtiva, conexao: 'conectado' })).toBe('ativa')
    expect(derivePanelState({ sessao: sessaoAtiva, conexao: 'conectado', semDados: false })).toBe(
      'ativa'
    )
  })
})
