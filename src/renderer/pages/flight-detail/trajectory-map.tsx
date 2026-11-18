import React, { useMemo } from 'react'
import { PARAMETER_IDS } from '../../../shared/parameter-ids'
import { formatParameterValue, SEM_VALOR } from '../../components/format-parameter-value'
import { SEM_DADOS_LIMITE_MS } from '../../components/limites-de-tempo'
import { MAPA_ALTURA, MAPA_LARGURA, criarProjecao, paresDePosicao } from './projecao-trajetoria'
import type { PontoNoMapa, Posicao } from './projecao-trajetoria'
import { reduzirSegmento } from './reduzir-pontos'
import { segmentarPorFalhas } from '../../components/segmentar-serie'
import { indiceAteOInstante } from './valor-no-instante'
import { caminhoDaLinha } from '../../components/caminho-svg'
import { leituraNoInstante } from './catalogo'
import type { ContextoDoInstante } from './catalogo'
import { valorDoEstado } from './leitura-do-mostrador'

/** Mensagem do mapa quando o voo não tem latitude e longitude gravadas (CA-005-9). */
export const TRAJETORIA_INDISPONIVEL =
  'Trajetória indisponível: este voo não tem latitude e longitude gravadas (por exemplo, voos gravados antes da v0.3.0).'

/** Quantidade de baldes da redução de pontos ao longo da duração do voo (só no desenho). */
const BALDES_NO_DESENHO = 1000

type PontoDoTrecho = PontoNoMapa & { t: number }

interface TrajectoryMapProps {
  contexto: ContextoDoInstante
  /** Duração do voo em ms, para o tamanho dos baldes da redução de pontos. */
  duracaoMs: number
}

const LATITUDE = (p: Posicao): number => p.lat
const LONGITUDE = (p: Posicao): number => p.lon

/**
 * Mapa da trajetória (UC-005): trajetória inteira tracejada, sem mapa de fundo e sem
 * pista, com o norte para cima; o trecho até o instante em azul; a aeronave no instante,
 * girada pelo rumo magnético (marcador circular sem rumo), escondida sem posição nos 2 s
 * até o instante. Perda de dados interrompe a linha.
 */
export function TrajectoryMap({ contexto, duracaoMs }: TrajectoryMapProps): React.ReactElement {
  const latitude = contexto.series.get(PARAMETER_IDS.LATITUDE)
  const longitude = contexto.series.get(PARAMETER_IDS.LONGITUDE)
  const rotuloLatitude = contexto.catalogo.get(PARAMETER_IDS.LATITUDE)?.nome ?? 'Latitude'
  const rotuloLongitude = contexto.catalogo.get(PARAMETER_IDS.LONGITUDE)?.nome ?? 'Longitude'
  const unidadeLatitude = contexto.catalogo.get(PARAMETER_IDS.LATITUDE)?.unidade ?? ''
  const unidadeLongitude = contexto.catalogo.get(PARAMETER_IDS.LONGITUDE)?.unidade ?? ''

  const desenho = useMemo(() => {
    const pares = paresDePosicao(latitude, longitude)
    const projetar = criarProjecao(pares)
    const baldeMs = duracaoMs / BALDES_NO_DESENHO
    const trechos: PontoDoTrecho[][] = segmentarPorFalhas(pares).map((trecho) =>
      reduzirSegmento(trecho, baldeMs, [LATITUDE, LONGITUDE]).map((p) => ({
        t: p.t,
        ...projetar(p.lat, p.lon),
      }))
    )
    return {
      pares,
      instantes: pares.map((p) => p.t),
      projetar,
      trechos,
      caminhoTodo: trechos.map(caminhoDaLinha).join(' '),
    }
  }, [latitude, longitude, duracaoMs])

  if (desenho.pares.length === 0) {
    return (
      <section className="flight-section trajectory" aria-labelledby="trajectory-title">
        <h2 id="trajectory-title" className="flight-section__title">
          Trajetória
        </h2>
        <p className="trajectory__unavailable">{TRAJETORIA_INDISPONIVEL}</p>
      </section>
    )
  }

  const instanteMs = contexto.instanteMs
  const indice = indiceAteOInstante(desenho.instantes, instanteMs)
  const posicao =
    indice !== -1 && instanteMs - desenho.pares[indice].t < SEM_DADOS_LIMITE_MS
      ? desenho.pares[indice]
      : null
  const pontoAtual = posicao === null ? null : desenho.projetar(posicao.lat, posicao.lon)

  const caminhoFeito = desenho.trechos
    .map((trecho) => {
      const feitos: PontoNoMapa[] = trecho.filter((p) => p.t <= instanteMs)
      if (
        posicao !== null &&
        pontoAtual !== null &&
        trecho.length > 0 &&
        trecho[0].t <= posicao.t &&
        posicao.t <= trecho[trecho.length - 1].t
      ) {
        feitos.push(pontoAtual)
      }
      return caminhoDaLinha(feitos)
    })
    .filter((caminho) => caminho !== '')
    .join(' ')

  const rumo = valorDoEstado(leituraNoInstante(PARAMETER_IDS.HEADING_MAGNETIC, contexto).estado)

  const textoLatitude =
    posicao === null ? SEM_VALOR : formatParameterValue(PARAMETER_IDS.LATITUDE, posicao.lat)
  const textoLongitude =
    posicao === null ? SEM_VALOR : formatParameterValue(PARAMETER_IDS.LONGITUDE, posicao.lon)
  const descricaoPosicao =
    posicao === null
      ? 'sem dados'
      : `${rotuloLatitude} ${textoLatitude}, ${rotuloLongitude} ${textoLongitude}`

  return (
    <section className="flight-section trajectory" aria-labelledby="trajectory-title">
      <div className="flight-section__header">
        <h2 id="trajectory-title" className="flight-section__title">
          Trajetória
        </h2>
        <span className="trajectory__position">
          <span className="flight-section__label">{rotuloLatitude}</span>{' '}
          <span className={posicao === null ? 'flight-section__value--muted' : undefined}>
            {textoLatitude}
          </span>{' '}
          <span className="flight-section__label">{unidadeLatitude}</span>
          {' · '}
          <span className="flight-section__label">{rotuloLongitude}</span>{' '}
          <span className={posicao === null ? 'flight-section__value--muted' : undefined}>
            {textoLongitude}
          </span>{' '}
          <span className="flight-section__label">{unidadeLongitude}</span>
        </span>
      </div>
      <svg
        viewBox={`0 0 ${MAPA_LARGURA} ${MAPA_ALTURA}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Trajetória do voo, com o norte para cima. Posição no instante: ${descricaoPosicao}`}
        className="trajectory__map"
      >
        <path d={desenho.caminhoTodo} className="trajectory__remaining" />
        {caminhoFeito !== '' && <path d={caminhoFeito} className="trajectory__flown" />}
        {pontoAtual !== null && rumo !== null && (
          <g
            className="trajectory__aircraft"
            transform={`translate(${pontoAtual.x.toFixed(1)} ${pontoAtual.y.toFixed(1)}) rotate(${rumo.toFixed(1)})`}
          >
            <path d="M0 -20 L5 -4 L20 2 L20 6 L5 4 L3 14 L8 18 L8 21 L0 19 L-8 21 L-8 18 L-3 14 L-5 4 L-20 6 L-20 2 L-5 -4 Z" />
          </g>
        )}
        {pontoAtual !== null && rumo === null && (
          <circle
            className="trajectory__aircraft"
            cx={pontoAtual.x.toFixed(1)}
            cy={pontoAtual.y.toFixed(1)}
            r="10"
          />
        )}
        <text x="960" y="50" textAnchor="middle" className="trajectory__north-text">
          N
        </text>
        <path d="M960 58 L952 80 L960 74 L968 80 Z" className="trajectory__north" />
      </svg>
      <p className="flight-section__caption">
        Linha azul contínua: trecho já voado. Tracejado: restante. Falhas na linha: sem dados. A
        aeronave aponta para o rumo magnético do instante; sem rumo, aparece como um círculo.
      </p>
    </section>
  )
}
