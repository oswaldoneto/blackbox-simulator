import React, { useId, useMemo } from 'react'
import { PARAMETER_IDS } from '../../../shared/parameter-ids'
import { formatParameterValue } from '../../components/format-parameter-value'
import { formatarSegundosHms } from '../../components/format-flight-time'
import { VALOR_DO_PONTO, pontosDaSerie, reduzirSegmento, segmentarPorFalhas } from './reduzir-pontos'
import { caminhoDaLinha } from './caminho-svg'
import { leituraNoInstante } from './catalogo'
import type { ContextoDoInstante } from './catalogo'
import { SEM_DADOS_NO_VOO, textoDaLeitura } from './leitura-do-mostrador'

/** Tamanho do `viewBox` do perfil vertical. */
export const PERFIL_LARGURA = 1000
export const PERFIL_ALTURA = 200

/** Faixa vertical do desenho: 10 unidades de folga em cima e embaixo. */
const TOPO = 10
const BASE = 190

/** Quantidade de baldes da redução de pontos ao longo da duração do voo (só no desenho). */
const BALDES_NO_DESENHO = 1000

/** Frações da duração onde ficam as marcas de tempo. */
const MARCAS_DE_TEMPO = [0, 0.25, 0.5, 0.75, 1]

interface VerticalProfileProps {
  contexto: ContextoDoInstante
  inicioMs: number
  duracaoMs: number
}

/** Posição x no `viewBox` de um instante, entre a hora de início e a hora de fim. */
export function xNoPerfil(instanteMs: number, inicioMs: number, duracaoMs: number): number {
  if (!(duracaoMs > 0)) {
    return 0
  }
  const fracao = Math.min(1, Math.max(0, (instanteMs - inicioMs) / duracaoMs))
  return fracao * PERFIL_LARGURA
}

/**
 * Perfil vertical (UC-005): altitude ao longo da duração inteira, com cursor no instante.
 * A linha é reduzida por trechos só no desenho, preservando máximos e mínimos, e é
 * interrompida na perda de dados. Sem altitude no voo, mostra "Sem dados neste voo".
 */
export function VerticalProfile({
  contexto,
  inicioMs,
  duracaoMs,
}: VerticalProfileProps): React.ReactElement {
  const recorte = useId()
  const serie = contexto.series.get(PARAMETER_IDS.ALTITUDE_MSL)

  const desenho = useMemo(() => {
    if (serie === undefined || serie.instantes.length === 0) {
      return null
    }
    let minimo = Infinity
    let maximo = -Infinity
    for (const valor of serie.valores) {
      if (valor < minimo) minimo = valor
      if (valor > maximo) maximo = valor
    }
    const folga = maximo - minimo > 0 ? (maximo - minimo) * 0.08 : 50
    const baixo = minimo - folga
    const alto = maximo + folga
    const yDe = (valor: number): number => BASE - ((valor - baixo) / (alto - baixo)) * (BASE - TOPO)
    const baldeMs = duracaoMs / BALDES_NO_DESENHO
    const trechos = segmentarPorFalhas(pontosDaSerie(serie.instantes, serie.valores)).map((trecho) =>
      reduzirSegmento(trecho, baldeMs, [VALOR_DO_PONTO]).map((p) => ({
        x: xNoPerfil(p.t, inicioMs, duracaoMs),
        y: yDe(p.v),
      }))
    )
    const linha = trechos.map(caminhoDaLinha).join(' ')
    const area = trechos
      .map((trecho) => {
        const primeiro = trecho[0]
        const ultimo = trecho[trecho.length - 1]
        return `${caminhoDaLinha(trecho)} L${ultimo.x.toFixed(1)} ${PERFIL_ALTURA} L${primeiro.x.toFixed(1)} ${PERFIL_ALTURA} Z`
      })
      .join(' ')
    return { linha, area, minimo, maximo }
  }, [serie, inicioMs, duracaoMs])

  const altitude = leituraNoInstante(PARAMETER_IDS.ALTITUDE_MSL, contexto)
  const vs = leituraNoInstante(PARAMETER_IDS.VERTICAL_SPEED, contexto)

  if (desenho === null) {
    return (
      <section className="flight-section" aria-labelledby="profile-title">
        <h2 id="profile-title" className="flight-section__title">
          Perfil vertical
        </h2>
        <p className="flight-section__unavailable">
          {altitude.rotulo}: {SEM_DADOS_NO_VOO}
        </p>
      </section>
    )
  }

  const cursorX = xNoPerfil(contexto.instanteMs, inicioMs, duracaoMs)
  const textoAltitude = textoDaLeitura(altitude)
  const textoVs = textoDaLeitura(vs)
  const textoMaximo = formatParameterValue(PARAMETER_IDS.ALTITUDE_MSL, desenho.maximo)
  const textoMinimo = formatParameterValue(PARAMETER_IDS.ALTITUDE_MSL, desenho.minimo)
  const altitudeComUnidade =
    altitude.estado.tipo === 'valor' ? `${textoAltitude} ${altitude.unidade}` : textoAltitude

  return (
    <section className="flight-section" aria-labelledby="profile-title">
      <div className="flight-section__header">
        <h2 id="profile-title" className="flight-section__title">
          Perfil vertical
        </h2>
        <span className="vertical-profile__readout">
          <span className="flight-section__label">{altitude.rotulo}</span>{' '}
          <span className={altitude.estado.tipo === 'valor' ? undefined : 'flight-section__value--muted'}>
            {textoAltitude}
          </span>{' '}
          {altitude.estado.tipo === 'valor' && (
            <span className="flight-section__label">{altitude.unidade}</span>
          )}
          {' · '}
          <span className="flight-section__label">{vs.rotulo}</span>{' '}
          <span className={vs.estado.tipo === 'valor' ? undefined : 'flight-section__value--muted'}>
            {textoVs}
          </span>{' '}
          {vs.estado.tipo === 'valor' && <span className="flight-section__label">{vs.unidade}</span>}
        </span>
      </div>
      <div className="vertical-profile__chart">
        <div className="vertical-profile__axis-y" aria-hidden="true">
          <span>{textoMaximo}</span>
          <span>{textoMinimo}</span>
        </div>
        <svg
          viewBox={`0 0 ${PERFIL_LARGURA} ${PERFIL_ALTURA}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Perfil vertical do voo: ${altitude.rotulo} de ${textoMinimo} a ${textoMaximo} ${altitude.unidade}; no instante, ${altitudeComUnidade}`}
          className="vertical-profile__svg"
        >
          <defs>
            <clipPath id={recorte}>
              <rect x="0" y="0" width={cursorX.toFixed(1)} height={PERFIL_ALTURA} />
            </clipPath>
          </defs>
          <line
            x1="0"
            y1={PERFIL_ALTURA / 2}
            x2={PERFIL_LARGURA}
            y2={PERFIL_ALTURA / 2}
            className="vertical-profile__grid"
            vectorEffect="non-scaling-stroke"
          />
          <path d={desenho.area} className="vertical-profile__area" />
          <path d={desenho.area} className="vertical-profile__area-flown" clipPath={`url(#${recorte})`} />
          <path d={desenho.linha} className="vertical-profile__line" vectorEffect="non-scaling-stroke" />
          <line
            x1={cursorX.toFixed(1)}
            y1="0"
            x2={cursorX.toFixed(1)}
            y2={PERFIL_ALTURA}
            className="vertical-profile__cursor"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="vertical-profile__axis-x" aria-hidden="true">
        {MARCAS_DE_TEMPO.map((fracao) => (
          <span key={fracao}>{formatarSegundosHms((duracaoMs * fracao) / 1000)}</span>
        ))}
      </div>
    </section>
  )
}
