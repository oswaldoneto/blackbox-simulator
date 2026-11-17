import React, { useId } from 'react'
import { movimentoDoHorizonte } from './escala-instrumentos'

interface AttitudeDialProps {
  /** Arfagem bruta gravada (sinal do SimConnect). */
  arfagem: number | null
  /** Rolagem bruta gravada (sinal do SimConnect). */
  rolagem: number | null
}

/**
 * Horizonte artificial. Os sinais seguem `PITCH_POSITIVO_NARIZ_PARA_BAIXO` e
 * `BANK_POSITIVO_PARA_ESQUERDA`; a arfagem do desenho fica limitada a ±25°. Sem os dois
 * valores no instante, o horizonte não é desenhado.
 */
export function AttitudeDial({ arfagem, rolagem }: AttitudeDialProps): React.ReactElement {
  const recorte = useId()
  const movimento = arfagem === null || rolagem === null ? null : movimentoDoHorizonte(arfagem, rolagem)
  return (
    <svg viewBox="0 0 200 200" className="dial" focusable="false">
      <defs>
        <clipPath id={recorte}>
          <circle cx="100" cy="100" r="90" />
        </clipPath>
      </defs>
      <circle cx="100" cy="100" r="99" className="dial__bezel" />
      <circle cx="100" cy="100" r="96" className="dial__face" />
      {movimento !== null && (
        <>
          <g clipPath={`url(#${recorte})`}>
            <g
              transform={`rotate(${movimento.rotacao.toFixed(1)} 100 100) translate(0 ${movimento.deslocamento.toFixed(1)})`}
            >
              <rect x="-100" y="-200" width="400" height="300" className="attitude__sky" />
              <rect x="-100" y="100" width="400" height="300" className="attitude__ground" />
              <line x1="-100" y1="100" x2="300" y2="100" className="attitude__line" strokeWidth="2" />
              <line x1="85" y1="85" x2="115" y2="85" className="attitude__line" strokeWidth="1.5" />
              <line x1="78" y1="70" x2="122" y2="70" className="attitude__line" strokeWidth="1.5" />
              <line x1="85" y1="115" x2="115" y2="115" className="attitude__line" strokeWidth="1.5" />
              <line x1="78" y1="130" x2="122" y2="130" className="attitude__line" strokeWidth="1.5" />
              <text x="126" y="74" className="attitude__ladder-text">
                10
              </text>
              <text x="126" y="134" className="attitude__ladder-text">
                10
              </text>
            </g>
          </g>
          <g transform={`rotate(${movimento.rotacao.toFixed(1)} 100 100)`}>
            <path d="M100 22 L95 32 L105 32 Z" className="attitude__bank-pointer" />
          </g>
        </>
      )}
      <path
        d="M100 10 L100 20 M55 22 L60 30 M145 22 L140 30 M23 55 L31 60 M177 55 L169 60"
        className="attitude__line"
        strokeWidth="2"
      />
      <path
        d="M55 100 L85 100 L92 108 M145 100 L115 100 L108 108"
        className="attitude__aircraft"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="100" cy="100" r="3.5" className="attitude__aircraft-dot" />
    </svg>
  )
}
