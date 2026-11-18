import { describe, it, expect } from 'vitest'
import { CONFIG_GRAFICO_PAINEL, configDoGrafico } from './config-grafico-painel'
import { PARAMETER_IDS, TODOS_PARAMETER_IDS } from '../../shared/parameter-ids'

describe('CONFIG_GRAFICO_PAINEL', () => {
  it('deve ter configuração para os 12 parâmetros', () => {
    expect(Object.keys(CONFIG_GRAFICO_PAINEL).sort()).toEqual([...TODOS_PARAMETER_IDS].sort())
  })

  it('deve dar uma cor por grupo: voo, atitude e posição, motor e configuração (CA-002-13)', () => {
    const grupoDe = (id: keyof typeof CONFIG_GRAFICO_PAINEL): string => CONFIG_GRAFICO_PAINEL[id].grupo

    expect(
      [
        PARAMETER_IDS.ALTITUDE_MSL,
        PARAMETER_IDS.AIRSPEED_IAS,
        PARAMETER_IDS.VERTICAL_SPEED,
        PARAMETER_IDS.HEADING_MAGNETIC,
      ].map(grupoDe)
    ).toEqual(['voo', 'voo', 'voo', 'voo'])
    expect(
      [PARAMETER_IDS.PITCH, PARAMETER_IDS.BANK, PARAMETER_IDS.LATITUDE, PARAMETER_IDS.LONGITUDE].map(
        grupoDe
      )
    ).toEqual(['atitude-posicao', 'atitude-posicao', 'atitude-posicao', 'atitude-posicao'])
    expect(
      [PARAMETER_IDS.THROTTLE_1, PARAMETER_IDS.MIXTURE_1, PARAMETER_IDS.RPM_1, PARAMETER_IDS.FLAPS].map(
        grupoDe
      )
    ).toEqual(['motor-configuracao', 'motor-configuracao', 'motor-configuracao', 'motor-configuracao'])
  })

  it('deve usar escala fixa no rumo (0–360, circular) e em manete, mistura e flapes (0–100) (CA-002-8)', () => {
    expect(CONFIG_GRAFICO_PAINEL[PARAMETER_IDS.HEADING_MAGNETIC].escala).toEqual({
      tipo: 'fixa',
      min: 0,
      max: 360,
      circular: true,
    })
    for (const id of [PARAMETER_IDS.THROTTLE_1, PARAMETER_IDS.MIXTURE_1, PARAMETER_IDS.FLAPS]) {
      expect(CONFIG_GRAFICO_PAINEL[id].escala).toEqual({ tipo: 'fixa', min: 0, max: 100, circular: false })
    }
  })

  it('deve usar zero no centro em VS (±300), arfagem (±5) e rolagem (±15) (CA-002-8, decisão 5)', () => {
    expect(CONFIG_GRAFICO_PAINEL[PARAMETER_IDS.VERTICAL_SPEED].escala).toEqual({
      tipo: 'centro-zero',
      meiaAmplitudeMinima: 300,
    })
    expect(CONFIG_GRAFICO_PAINEL[PARAMETER_IDS.PITCH].escala).toEqual({
      tipo: 'centro-zero',
      meiaAmplitudeMinima: 5,
    })
    expect(CONFIG_GRAFICO_PAINEL[PARAMETER_IDS.BANK].escala).toEqual({
      tipo: 'centro-zero',
      meiaAmplitudeMinima: 15,
    })
  })

  it('deve usar escala automática com as amplitudes mínimas e piso 0 em IAS e RPM (CA-002-8, decisão 5)', () => {
    expect(CONFIG_GRAFICO_PAINEL[PARAMETER_IDS.ALTITUDE_MSL].escala).toEqual({
      tipo: 'automatica',
      amplitudeMinima: 200,
      piso: null,
    })
    expect(CONFIG_GRAFICO_PAINEL[PARAMETER_IDS.AIRSPEED_IAS].escala).toEqual({
      tipo: 'automatica',
      amplitudeMinima: 20,
      piso: 0,
    })
    expect(CONFIG_GRAFICO_PAINEL[PARAMETER_IDS.LATITUDE].escala).toEqual({
      tipo: 'automatica',
      amplitudeMinima: 0.01,
      piso: null,
    })
    expect(CONFIG_GRAFICO_PAINEL[PARAMETER_IDS.LONGITUDE].escala).toEqual({
      tipo: 'automatica',
      amplitudeMinima: 0.01,
      piso: null,
    })
    expect(CONFIG_GRAFICO_PAINEL[PARAMETER_IDS.RPM_1].escala).toEqual({
      tipo: 'automatica',
      amplitudeMinima: 500,
      piso: 0,
    })
  })
})

describe('configDoGrafico', () => {
  it('deve devolver a configuração de um parâmetro conhecido', () => {
    expect(configDoGrafico(PARAMETER_IDS.FLAPS)).toBe(CONFIG_GRAFICO_PAINEL[PARAMETER_IDS.FLAPS])
  })

  it('deve devolver null para um parâmetro desconhecido', () => {
    expect(configDoGrafico('fuel_qty')).toBeNull()
  })
})
