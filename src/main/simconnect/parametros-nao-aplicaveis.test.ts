import { describe, it, expect } from 'vitest'
import { derivarParametrosNaoAplicaveis } from './parametros-nao-aplicaveis'
import type { PerfilDaAeronave } from './parametros-nao-aplicaveis'

describe('derivarParametrosNaoAplicaveis', () => {
  it.each<[string, PerfilDaAeronave, string[]]>([
    ['pistão com flapes', { motorAPistao: true, temFlapes: true }, []],
    ['pistão sem flapes', { motorAPistao: true, temFlapes: false }, ['flaps']],
    ['não pistão com flapes', { motorAPistao: false, temFlapes: true }, ['mixture_1']],
    ['não pistão sem flapes', { motorAPistao: false, temFlapes: false }, ['flaps', 'mixture_1']],
  ])('deve derivar a lista certa para aeronave %s', (_nome, perfil, esperado) => {
    expect([...derivarParametrosNaoAplicaveis(perfil)].sort()).toEqual(esperado)
  })

  it('nunca deve marcar manete, RPM, latitude, longitude nem os parâmetros de voo como N/A', () => {
    const lista = derivarParametrosNaoAplicaveis({ motorAPistao: false, temFlapes: false })
    for (const id of [
      'throttle_1',
      'rpm_1',
      'latitude',
      'longitude',
      'altitude_msl',
      'airspeed_ias',
      'vertical_speed',
      'heading_magnetic',
      'pitch',
      'bank',
    ]) {
      expect(lista).not.toContain(id)
    }
  })
})
