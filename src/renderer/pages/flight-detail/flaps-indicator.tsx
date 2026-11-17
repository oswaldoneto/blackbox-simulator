import React from 'react'
import { FLAPE_ANGULO_MAXIMO, anguloDoFlape } from './escala-instrumentos'

const CENTRO_X = 150
const CENTRO_Y = 73

const MARCAS = [0, 25, 50, 75, 100].map((percentual) => {
  const rad = ((percentual / 100) * FLAPE_ANGULO_MAXIMO * Math.PI) / 180
  return {
    percentual,
    x1: CENTRO_X + 62 * Math.cos(rad),
    y1: CENTRO_Y + 62 * Math.sin(rad),
    x2: CENTRO_X + 70 * Math.cos(rad),
    y2: CENTRO_Y + 70 * Math.sin(rad),
    tx: CENTRO_X + 84 * Math.cos(rad),
    ty: CENTRO_Y + 84 * Math.sin(rad) + 4,
    rotulo: percentual % 50 === 0 ? String(percentual) : '',
  }
})

/**
 * Indicador esquemático dos flapes: o ângulo do desenho é proporcional ao % de extensão,
 * sem graus (só o % é gravado). Sem valor no instante, o flape não aparece.
 */
export function FlapsIndicator({ flapes }: { flapes: number | null }): React.ReactElement {
  return (
    <svg viewBox="0 0 240 170" className="flaps-indicator" focusable="false">
      {MARCAS.map((marca) => (
        <g key={marca.percentual}>
          <line
            x1={marca.x1}
            y1={marca.y1}
            x2={marca.x2}
            y2={marca.y2}
            className="flaps-indicator__tick"
            strokeWidth="2"
          />
          <text x={marca.tx} y={marca.ty} textAnchor="middle" className="flaps-indicator__scale">
            {marca.rotulo}
          </text>
        </g>
      ))}
      <path
        d="M20 80 Q34 56 90 58 L150 66 L150 80 L42 90 Q24 90 20 80 Z"
        className="flaps-indicator__wing"
        strokeWidth="1.5"
      />
      {flapes !== null && (
        <g transform={`rotate(${anguloDoFlape(flapes).toFixed(1)} ${CENTRO_X} ${CENTRO_Y})`}>
          <path d="M152 66 L206 71 L206 75 L152 80 Z" className="flaps-indicator__flap" />
        </g>
      )}
      <circle cx={CENTRO_X} cy={CENTRO_Y} r="3" className="flaps-indicator__hinge" />
    </svg>
  )
}
