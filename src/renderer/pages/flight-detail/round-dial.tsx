import React from 'react'
import { anguloNaEscala } from './escala-instrumentos'
import type { EscalaDoMostrador } from './escala-instrumentos'

export interface MarcaDoMostrador {
  angulo: number
  longa: boolean
}

export interface RotuloDoMostrador {
  angulo: number
  texto: string
}

export interface PonteiroDoMostrador {
  angulo: number
  tipo: 'longo' | 'curto'
}

/** Ponto a `raio` do centro (100, 100) no ângulo dado (0 no topo, sentido horário). */
export function pontoNoMostrador(angulo: number, raio: number): { x: number; y: number } {
  const rad = (angulo * Math.PI) / 180
  return { x: 100 + raio * Math.sin(rad), y: 100 - raio * Math.cos(rad) }
}

/** Marcas de uma escala linear, a cada `passo`, com uma marca longa a cada `cadaLonga`. */
export function marcasDaEscala(
  escala: EscalaDoMostrador,
  passo: number,
  cadaLonga: number
): MarcaDoMostrador[] {
  const marcas: MarcaDoMostrador[] = []
  const total = Math.round((escala.max - escala.min) / passo)
  for (let i = 0; i <= total; i += 1) {
    marcas.push({ angulo: anguloNaEscala(escala.min + i * passo, escala), longa: i % cadaLonga === 0 })
  }
  return marcas
}

/** Rótulos de uma escala linear nos valores dados. */
export function rotulosDaEscala(
  escala: EscalaDoMostrador,
  valores: readonly number[],
  texto: (valor: number) => string
): RotuloDoMostrador[] {
  return valores.map((valor) => ({ angulo: anguloNaEscala(valor, escala), texto: texto(valor) }))
}

interface RoundDialProps {
  marcas: readonly MarcaDoMostrador[]
  rotulos: readonly RotuloDoMostrador[]
  /** Texto fixo no centro do mostrador (ex.: "KT", "RPM ×100"). */
  legenda: string
  /** Texto fixo acima do centro (ex.: "▲ SOBE ▼ DESCE"). */
  legendaSuperior?: string
  /** Ponteiros; vazio quando não há valor no instante (N/A, "—" ou sem dados no voo). */
  ponteiros: readonly PonteiroDoMostrador[]
}

/** Mostrador redondo genérico do painel (velocímetro, tacômetro, variômetro, altímetro). */
export function RoundDial({
  marcas,
  rotulos,
  legenda,
  legendaSuperior,
  ponteiros,
}: RoundDialProps): React.ReactElement {
  return (
    <svg viewBox="0 0 200 200" className="dial" focusable="false">
      <circle cx="100" cy="100" r="99" className="dial__bezel" />
      <circle cx="100" cy="100" r="96" className="dial__face" />
      {marcas.map((marca, i) => {
        const p1 = pontoNoMostrador(marca.angulo, 88)
        const p2 = pontoNoMostrador(marca.angulo, marca.longa ? 75 : 81)
        return (
          <line
            key={i}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            className="dial__tick"
            strokeWidth={marca.longa ? 2.2 : 1}
          />
        )
      })}
      {rotulos.map((rotulo, i) => {
        const p = pontoNoMostrador(rotulo.angulo, 61)
        return (
          <text key={i} x={p.x} y={p.y + 4} textAnchor="middle" className="dial__scale-text">
            {rotulo.texto}
          </text>
        )
      })}
      <text x="100" y="140" textAnchor="middle" className="dial__legend">
        {legenda}
      </text>
      {legendaSuperior !== undefined && (
        <text x="100" y="72" textAnchor="middle" className="dial__legend dial__legend--small">
          {legendaSuperior}
        </text>
      )}
      {ponteiros.map((ponteiro, i) => (
        <g key={i} transform={`rotate(${ponteiro.angulo.toFixed(1)} 100 100)`}>
          <path
            d={ponteiro.tipo === 'longo' ? 'M100 114 L96.5 100 L100 20 L103.5 100 Z' : 'M100 110 L93 100 L100 50 L107 100 Z'}
            className="dial__pointer"
          />
        </g>
      ))}
      <circle cx="100" cy="100" r="7" className="dial__hub" />
    </svg>
  )
}
