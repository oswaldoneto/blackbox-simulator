import React from 'react'
import { pontoNoMostrador } from './round-dial'
import { rotacaoDaRosa } from './escala-instrumentos'

const MARCAS = Array.from({ length: 36 }, (_, i) => ({ angulo: i * 10, longa: i % 3 === 0 }))

const ROTULOS = [
  { angulo: 0, texto: 'N' },
  { angulo: 30, texto: '3' },
  { angulo: 60, texto: '6' },
  { angulo: 90, texto: 'L' },
  { angulo: 120, texto: '12' },
  { angulo: 150, texto: '15' },
  { angulo: 180, texto: 'S' },
  { angulo: 210, texto: '21' },
  { angulo: 240, texto: '24' },
  { angulo: 270, texto: 'O' },
  { angulo: 300, texto: '30' },
  { angulo: 330, texto: '33' },
]

/**
 * Bússola de rosa girada: a rosa gira ao contrário do rumo magnético, e o rumo fica sob o
 * índice do topo. Sem rumo no instante, a rosa não é desenhada.
 */
export function HeadingDial({ rumo }: { rumo: number | null }): React.ReactElement {
  return (
    <svg viewBox="0 0 200 200" className="dial" focusable="false">
      <circle cx="100" cy="100" r="99" className="dial__bezel" />
      <circle cx="100" cy="100" r="96" className="dial__face" />
      {rumo !== null && (
        <g transform={`rotate(${rotacaoDaRosa(rumo).toFixed(1)} 100 100)`}>
          {MARCAS.map((marca) => {
            const p1 = pontoNoMostrador(marca.angulo, 92)
            const p2 = pontoNoMostrador(marca.angulo, marca.longa ? 78 : 84)
            return (
              <line
                key={marca.angulo}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                className="dial__tick"
                strokeWidth={marca.longa ? 2.5 : 1.2}
              />
            )
          })}
          {ROTULOS.map((rotulo) => (
            <text
              key={rotulo.angulo}
              x="100"
              y="44"
              textAnchor="middle"
              transform={`rotate(${rotulo.angulo} 100 100)`}
              className={
                rotulo.angulo % 90 === 0
                  ? 'heading__label heading__label--cardinal'
                  : 'heading__label'
              }
            >
              {rotulo.texto}
            </text>
          ))}
        </g>
      )}
      <path d="M100 6 L93 20 L107 20 Z" className="heading__index" />
      <path
        d="M100 74 L104 92 L124 100 L124 104 L104 102 L102 116 L108 120 L108 123 L100 121 L92 123 L92 120 L98 116 L96 102 L76 104 L76 100 L96 92 Z"
        className="heading__index"
      />
    </svg>
  )
}
