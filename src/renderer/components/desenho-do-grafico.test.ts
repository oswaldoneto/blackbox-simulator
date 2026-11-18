import { describe, it, expect } from 'vitest'
import { desenharGrafico, GRAFICO_ALTURA, GRAFICO_LARGURA, menorArcoDoRumo } from './desenho-do-grafico'
import type { PontoNoTempo } from './segmentar-serie'
import { PARAMETER_IDS } from '../../shared/parameter-ids'

const AGORA = Date.parse('2026-11-17T12:00:00.000Z')

/** Pontos a cada `passoMs`, terminando em `AGORA`, com os valores dados. */
function serieAteAgora(valores: number[], passoMs = 1000): PontoNoTempo[] {
  return valores.map((v, i) => ({ t: AGORA - (valores.length - 1 - i) * passoMs, v }))
}

/** Subcaminhos ("M ...") de um caminho SVG, cada um como lista de coordenadas. */
function subcaminhos(caminho: string): { x: number; y: number }[][] {
  if (caminho === '') return []
  return caminho
    .split('M')
    .filter((parte) => parte.trim() !== '')
    .map((parte) =>
      [...parte.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map((m) => ({
        x: Number(m[1]),
        y: Number(m[2]),
      }))
    )
}

describe('desenharGrafico', () => {
  it('deve usar o viewBox 1000×100', () => {
    expect(GRAFICO_LARGURA).toBe(1000)
    expect(GRAFICO_ALTURA).toBe(100)
  })

  it('não deve desenhar nada para um parâmetro desconhecido', () => {
    expect(desenharGrafico({ parametroId: 'fuel_qty', pontos: serieAteAgora([1, 2]), agora: AGORA })).toEqual({
      linha: '',
      area: '',
      pontosIsolados: '',
      limiteInferior: null,
      limiteSuperior: null,
      faixa: null,
    })
  })

  describe('eixo de 2 minutos (CA-002-7 e CA-002-14)', () => {
    it('deve pôr a leitura mais recente na borda direita e a de 2 minutos atrás na esquerda', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.ALTITUDE_MSL,
        pontos: [
          { t: AGORA - 120000, v: 4500 },
          { t: AGORA - 119000, v: 4500 },
        ],
        agora: AGORA + 1000,
      })
      const linha = subcaminhos(desenho.linha)[0]
      expect(linha[0].x).toBeCloseTo(-8.3, 1)

      const atual = desenharGrafico({
        parametroId: PARAMETER_IDS.ALTITUDE_MSL,
        pontos: [
          { t: AGORA - 120000, v: 4500 },
          { t: AGORA - 119000, v: 4500 },
          { t: AGORA - 60000, v: 4500 },
          { t: AGORA - 59000, v: 4500 },
          { t: AGORA - 1000, v: 4500 },
          { t: AGORA, v: 4500 },
        ],
        agora: AGORA,
      })
      const xs = subcaminhos(atual.linha).flat().map((c) => c.x)
      expect(xs[0]).toBe(0)
      expect(xs).toContain(500)
      expect(xs[xs.length - 1]).toBe(1000)
    })

    it('deve manter o eixo de 2 minutos com poucas leituras, com a linha à direita', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.ALTITUDE_MSL,
        pontos: serieAteAgora([4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500]),
        agora: AGORA,
      })

      const [linha] = subcaminhos(desenho.linha)
      expect(linha).toHaveLength(11)
      expect(linha[0].x).toBeCloseTo(916.7, 1)
      expect(linha[linha.length - 1].x).toBe(1000)
    })

    it('deve desenhar uma única leitura como ponto isolado na borda direita', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.ALTITUDE_MSL,
        pontos: serieAteAgora([4500]),
        agora: AGORA,
      })

      expect(desenho.linha).toBe('')
      expect(desenho.area).toBe('')
      expect(desenho.pontosIsolados).toBe('M1000.0 50.0 L1000.0 50.0')
    })

    it('deve ignorar pontos depois do "agora"', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.ALTITUDE_MSL,
        pontos: [
          { t: AGORA, v: 4500 },
          { t: AGORA + 1000, v: 9999 },
        ],
        agora: AGORA,
      })

      expect(desenho.linha).toBe('')
      expect(desenho.pontosIsolados).toBe('M1000.0 50.0 L1000.0 50.0')
      expect(desenho.faixa).toEqual({ de: 4500, ate: 4500 })
    })

    it('deve fechar a área clara na base do gráfico', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.ALTITUDE_MSL,
        pontos: serieAteAgora([4500, 4510]),
        agora: AGORA,
      })

      expect(desenho.area).toBe(`${desenho.linha} L1000.0 100 L991.7 100 Z`)
    })
  })

  describe('"agora" avançando sem pontos novos (CA-002-5, decisão 1)', () => {
    const pontos = serieAteAgora([4500, 4510, 4520])

    it('deve deslocar a linha para a esquerda e deixar a falha crescer à direita', () => {
      const antes = subcaminhos(desenharGrafico({ parametroId: PARAMETER_IDS.ALTITUDE_MSL, pontos, agora: AGORA }).linha)
      const depois = subcaminhos(
        desenharGrafico({ parametroId: PARAMETER_IDS.ALTITUDE_MSL, pontos, agora: AGORA + 30000 }).linha
      )

      expect(antes[0][2].x).toBe(1000)
      expect(depois[0][2].x).toBe(750)
      expect(depois[0]).toHaveLength(3)
    })

    it('não deve inventar pontos no intervalo sem leituras', () => {
      const desenho = desenharGrafico({ parametroId: PARAMETER_IDS.ALTITUDE_MSL, pontos, agora: AGORA + 30000 })

      expect(subcaminhos(desenho.linha).flat()).toHaveLength(3)
      expect(desenho.pontosIsolados).toBe('')
    })

    it('deve esvaziar o gráfico quando as leituras saem da janela', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.ALTITUDE_MSL,
        pontos,
        agora: AGORA + 121000,
      })

      expect(desenho.linha).toBe('')
      expect(desenho.pontosIsolados).toBe('')
      expect(desenho.faixa).toBeNull()
      expect(desenho.limiteInferior).toBeNull()
    })
  })

  describe('ponto anterior à janela', () => {
    it('deve entrar na linha pela borda esquerda sem pesar na escala nem na faixa', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.ALTITUDE_MSL,
        pontos: [
          { t: AGORA - 121000, v: 99999 },
          { t: AGORA - 120000 + 500, v: 4500 },
          { t: AGORA - 119000 + 500, v: 4500 },
        ],
        agora: AGORA,
      })

      const [linha] = subcaminhos(desenho.linha)
      expect(linha[0].x).toBeLessThan(0)
      expect(linha[0].y).toBe(5) // preso no limite de cima
      expect(desenho.limiteInferior).toBe('4.400')
      expect(desenho.limiteSuperior).toBe('4.600')
      expect(desenho.faixa).toEqual({ de: 4500, ate: 4500 })
    })

    it('não deve desenhar o ponto anterior sozinho, fora do eixo', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.ALTITUDE_MSL,
        pontos: [
          { t: AGORA - 125000, v: 4500 },
          { t: AGORA, v: 4500 },
        ],
        agora: AGORA,
      })

      expect(desenho.linha).toBe('')
      expect(desenho.pontosIsolados).toBe('M1000.0 50.0 L1000.0 50.0')
    })
  })

  describe('valor constante (CA-002-9)', () => {
    it('deve deixar a linha reta no meio da escala', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.RPM_1,
        pontos: serieAteAgora([2400, 2400, 2400]),
        agora: AGORA,
      })

      expect(subcaminhos(desenho.linha)[0].map((c) => c.y)).toEqual([50, 50, 50])
    })
  })

  describe('limite da escala fixa (CA-002-10)', () => {
    it('deve parar a linha no limite de baixo no reverso e no de cima acima de 100', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.THROTTLE_1,
        pontos: serieAteAgora([-20, 50, 130]),
        agora: AGORA,
      })

      expect(subcaminhos(desenho.linha)[0].map((c) => c.y)).toEqual([95, 50, 5])
      expect(desenho.limiteInferior).toBe('0')
      expect(desenho.limiteSuperior).toBe('100')
      // A faixa (texto acessível) usa os valores reais.
      expect(desenho.faixa).toEqual({ de: -20, ate: 130 })
    })
  })

  describe('rumo passando pelo norte (CA-002-11)', () => {
    it('deve interromper a linha na passagem de 359° para 000°', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.HEADING_MAGNETIC,
        pontos: serieAteAgora([350, 355, 359, 1, 5, 10]),
        agora: AGORA,
      })

      const trechos = subcaminhos(desenho.linha)
      expect(trechos).toHaveLength(2)
      expect(trechos[0]).toHaveLength(3)
      expect(trechos[1]).toHaveLength(3)
    })

    it('não deve interromper a linha numa curva comum', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.HEADING_MAGNETIC,
        pontos: serieAteAgora([90, 120, 150, 180, 210]),
        agora: AGORA,
      })

      expect(subcaminhos(desenho.linha)).toHaveLength(1)
    })

    it('deve levar o rumo a 0–360 antes de desenhar', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.HEADING_MAGNETIC,
        pontos: serieAteAgora([360, 720]),
        agora: AGORA,
      })

      expect(subcaminhos(desenho.linha)[0].map((c) => c.y)).toEqual([95, 95])
    })

    it('deve dar a faixa pelo menor arco', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.HEADING_MAGNETIC,
        pontos: serieAteAgora([350, 355, 5, 10]),
        agora: AGORA,
      })

      expect(desenho.faixa).toEqual({ de: 350, ate: 10 })
    })
  })

  describe('falha entre leituras (CA-002-12)', () => {
    it('deve manter a linha com 1999 ms entre duas leituras', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.ALTITUDE_MSL,
        pontos: serieAteAgora([4500, 4510], 1999),
        agora: AGORA,
      })

      expect(subcaminhos(desenho.linha)).toHaveLength(1)
      expect(desenho.pontosIsolados).toBe('')
    })

    it('deve interromper a linha com 2000 ms entre duas leituras', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.ALTITUDE_MSL,
        pontos: serieAteAgora([4500, 4510], 2000),
        agora: AGORA,
      })

      expect(desenho.linha).toBe('')
      expect(subcaminhos(desenho.pontosIsolados)).toHaveLength(2)
    })

    it('deve manter a falha visível depois que o sinal volta (CA-002-5 e CA-002-15)', () => {
      const desenho = desenharGrafico({
        parametroId: PARAMETER_IDS.ALTITUDE_MSL,
        pontos: [
          { t: AGORA - 20000, v: 4500 },
          { t: AGORA - 19000, v: 4510 },
          { t: AGORA - 1000, v: 4600 },
          { t: AGORA, v: 4610 },
        ],
        agora: AGORA,
      })

      const trechos = subcaminhos(desenho.linha)
      expect(trechos).toHaveLength(2)
      expect(trechos[0][1].x).toBeCloseTo(841.7, 1)
      expect(trechos[1][0].x).toBeCloseTo(991.7, 1)
    })
  })

  describe('limites da escala (CA-002-7 e CA-002-8)', () => {
    function limites(parametroId: string, valores: number[]): [string | null, string | null] {
      const d = desenharGrafico({ parametroId, pontos: serieAteAgora(valores), agora: AGORA })
      return [d.limiteInferior, d.limiteSuperior]
    }

    it('deve mostrar "000" e "360" no rumo', () => {
      expect(limites(PARAMETER_IDS.HEADING_MAGNETIC, [90])).toEqual(['000', '360'])
    })

    it('deve mostrar "0" e "100" em manete, mistura e flapes', () => {
      expect(limites(PARAMETER_IDS.THROTTLE_1, [85])).toEqual(['0', '100'])
      expect(limites(PARAMETER_IDS.MIXTURE_1, [100])).toEqual(['0', '100'])
      expect(limites(PARAMETER_IDS.FLAPS, [30])).toEqual(['0', '100'])
    })

    it('deve mostrar os limites de zero no centro com o sinal da exibição', () => {
      expect(limites(PARAMETER_IDS.VERTICAL_SPEED, [0])).toEqual(['−300', '+300'])
      expect(limites(PARAMETER_IDS.PITCH, [0])).toEqual(['−5,0', '+5,0'])
      // Rolagem: direita para cima (T4).
      expect(limites(PARAMETER_IDS.BANK, [0])).toEqual(['15,0 E', '15,0 D'])
    })

    it('deve mostrar os limites da escala automática formatados', () => {
      expect(limites(PARAMETER_IDS.ALTITUDE_MSL, [4500])).toEqual(['4.400', '4.600'])
      expect(limites(PARAMETER_IDS.AIRSPEED_IAS, [5])).toEqual(['0', '20'])
      expect(limites(PARAMETER_IDS.RPM_1, [2400])).toEqual(['2.150', '2.650'])
    })

    it('deve esconder os limites da escala automática antes da primeira leitura (T8)', () => {
      const d = desenharGrafico({ parametroId: PARAMETER_IDS.ALTITUDE_MSL, pontos: [], agora: null })
      expect([d.limiteInferior, d.limiteSuperior]).toEqual([null, null])
    })

    it('deve mostrar os limites fixos e os mínimos de zero no centro antes da primeira leitura', () => {
      const rumo = desenharGrafico({ parametroId: PARAMETER_IDS.HEADING_MAGNETIC, pontos: [], agora: null })
      const vs = desenharGrafico({ parametroId: PARAMETER_IDS.VERTICAL_SPEED, pontos: [], agora: null })

      expect([rumo.limiteInferior, rumo.limiteSuperior]).toEqual(['000', '360'])
      expect([vs.limiteInferior, vs.limiteSuperior]).toEqual(['−300', '+300'])
      expect(rumo.linha).toBe('')
      expect(rumo.faixa).toBeNull()
    })
  })

  describe('faixa da janela (CA-002-19)', () => {
    it('deve dar a menor e a maior leitura da janela', () => {
      const d = desenharGrafico({
        parametroId: PARAMETER_IDS.ALTITUDE_MSL,
        pontos: serieAteAgora([4500, 4300, 4700]),
        agora: AGORA,
      })
      expect(d.faixa).toEqual({ de: 4300, ate: 4700 })
    })

    it('deve dar a faixa da arfagem em valores brutos, do nariz mais baixo ao mais alto', () => {
      // Brutos 2 e −3 = exibidos −2 e +3.
      const d = desenharGrafico({ parametroId: PARAMETER_IDS.PITCH, pontos: serieAteAgora([2, -3]), agora: AGORA })
      expect(d.faixa).toEqual({ de: 2, ate: -3 })
    })

    it('deve dar a faixa nula sem leituras', () => {
      const d = desenharGrafico({ parametroId: PARAMETER_IDS.ALTITUDE_MSL, pontos: [], agora: AGORA })
      expect(d.faixa).toBeNull()
    })
  })
})

describe('menorArcoDoRumo', () => {
  it('deve devolver null sem rumos', () => {
    expect(menorArcoDoRumo([])).toBeNull()
  })

  it('deve dar o mínimo e o máximo quando o arco não passa pelo norte', () => {
    expect(menorArcoDoRumo([30, 10, 20])).toEqual({ de: 10, ate: 30 })
  })

  it('deve dar as pontas do menor arco quando passa pelo norte (T6)', () => {
    expect(menorArcoDoRumo([350, 355, 5, 10])).toEqual({ de: 350, ate: 10 })
  })

  it('deve dar o mesmo rumo nas duas pontas com uma leitura só', () => {
    expect(menorArcoDoRumo([90])).toEqual({ de: 90, ate: 90 })
  })
})
