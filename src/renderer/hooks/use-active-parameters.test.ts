import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { ParametroDeVoo } from '../../shared/types'

const { mockListActiveParametros } = vi.hoisted(() => ({
  mockListActiveParametros: vi.fn(),
}))

vi.mock('../ipc/parameter-ipc', () => ({
  listActiveParametros: () => mockListActiveParametros(),
}))

import {
  useActiveParameters,
  ordenarParaExibicao,
  PARAMETER_DISPLAY_ORDER,
} from './use-active-parameters'

function p(id: string, ativo = true): ParametroDeVoo {
  return { id, nome: id, unidade: '', ativo }
}

describe('useActiveParameters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve definir a ordem de exibição dos 12 parâmetros por grupos (CA-006-2)', () => {
    expect(PARAMETER_DISPLAY_ORDER).toEqual([
      // Linha 1 (voo)
      'altitude_msl',
      'airspeed_ias',
      'vertical_speed',
      'heading_magnetic',
      // Linha 2 (atitude e posição)
      'pitch',
      'bank',
      'latitude',
      'longitude',
      // Linha 3 (motor e configuração)
      'throttle_1',
      'mixture_1',
      'rpm_1',
      'flaps',
    ])
  })

  it('deve ordenar para exibição e deixar ids desconhecidos no fim', () => {
    const lista = [p('bank'), p('desconhecido'), p('pitch'), p('altitude_msl')]
    expect(ordenarParaExibicao(lista).map((x) => x.id)).toEqual([
      'altitude_msl',
      'pitch',
      'bank',
      'desconhecido',
    ])
    // não altera a lista original
    expect(lista[0].id).toBe('bank')
  })

  it('deve devolver só parâmetros ativos, na ordem de exibição (RN-002)', async () => {
    mockListActiveParametros.mockResolvedValue([
      p('flaps'),
      p('bank'),
      p('rpm_1'),
      p('pitch'),
      p('longitude'),
      p('heading_magnetic'),
      p('inativo', false),
      p('mixture_1'),
      p('vertical_speed'),
      p('latitude'),
      p('airspeed_ias'),
      p('throttle_1'),
      p('altitude_msl'),
    ])

    const { result } = renderHook(() => useActiveParameters())

    await waitFor(() => expect(result.current.parametros).toHaveLength(12))
    expect(result.current.parametros.map((x) => x.id)).toEqual([...PARAMETER_DISPLAY_ORDER])
    expect(result.current.erro).toBe(false)
  })

  it('deve começar com lista vazia e sem erro', () => {
    mockListActiveParametros.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useActiveParameters())
    expect(result.current).toEqual({ parametros: [], erro: false })
  })

  it('deve logar e devolver erro = true com lista vazia quando listActiveParametros falha', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const falha = new Error('ipc')
    mockListActiveParametros.mockRejectedValue(falha)

    const { result } = renderHook(() => useActiveParameters())

    await waitFor(() => expect(result.current.erro).toBe(true))
    expect(result.current.parametros).toEqual([])
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('useActiveParameters'), falha)
    consoleError.mockRestore()
  })

  it('deve logar sem atualizar o estado quando a falha chega depois de desmontar', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    let rejeitar: (e: unknown) => void = () => {}
    mockListActiveParametros.mockReturnValue(
      new Promise((_, rej) => {
        rejeitar = rej
      })
    )
    const { result, unmount } = renderHook(() => useActiveParameters())
    unmount()

    await act(async () => {
      rejeitar(new Error('ipc'))
    })

    expect(consoleError).toHaveBeenCalled()
    expect(result.current.erro).toBe(false)
    consoleError.mockRestore()
  })
})
