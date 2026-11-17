import React from 'react'
import { ESCALA_PERCENTUAL, fracaoNaEscala } from './escala-instrumentos'

/** Altura útil do curso das alavancas no desenho, em unidades do `viewBox`. */
const CURSO = 130
const BASE = 154

function posicaoY(valor: number): number {
  return BASE - fracaoNaEscala(valor, ESCALA_PERCENTUAL.min, ESCALA_PERCENTUAL.max) * CURSO - 8
}

interface LeverQuadrantProps {
  manete: number | null
  mistura: number | null
  rotuloManete: string
  rotuloMistura: string
}

/**
 * Pedestal com manete e mistura (0 a 100 %). A manobra fora da escala (reverso) para no
 * limite; o número mostra o valor real. Sem valor no instante, a alavanca não aparece.
 */
export function LeverQuadrant({
  manete,
  mistura,
  rotuloManete,
  rotuloMistura,
}: LeverQuadrantProps): React.ReactElement {
  return (
    <svg viewBox="0 0 200 200" className="lever-quadrant" focusable="false">
      <rect x="30" y="20" width="140" height="150" rx="6" className="lever-quadrant__housing" />
      <text x="22" y="34" textAnchor="end" className="lever-quadrant__scale">
        100
      </text>
      <text x="22" y="164" textAnchor="end" className="lever-quadrant__scale">
        0
      </text>
      <rect x="66" y="28" width="8" height="134" rx="4" className="lever-quadrant__track" />
      <rect x="126" y="28" width="8" height="134" rx="4" className="lever-quadrant__track" />
      {manete !== null && (
        <rect
          x="48"
          y={posicaoY(manete).toFixed(1)}
          width="44"
          height="16"
          rx="3"
          className="lever-quadrant__throttle"
          strokeWidth="1.5"
        />
      )}
      {mistura !== null && (
        <rect
          x="108"
          y={posicaoY(mistura).toFixed(1)}
          width="44"
          height="16"
          rx="8"
          className="lever-quadrant__mixture"
        />
      )}
      <text x="70" y="188" textAnchor="middle" className="lever-quadrant__label">
        {rotuloManete}
      </text>
      <text x="130" y="188" textAnchor="middle" className="lever-quadrant__label">
        {rotuloMistura}
      </text>
    </svg>
  )
}
