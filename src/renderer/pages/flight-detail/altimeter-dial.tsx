import React from 'react'
import { RoundDial } from './round-dial'
import type { MarcaDoMostrador, RotuloDoMostrador } from './round-dial'
import { angulosDoAltimetro } from './escala-instrumentos'

const MARCAS: MarcaDoMostrador[] = Array.from({ length: 50 }, (_, i) => ({
  angulo: (i * 20 * 360) / 1000,
  longa: i % 5 === 0,
}))

const ROTULOS: RotuloDoMostrador[] = Array.from({ length: 10 }, (_, i) => ({
  angulo: i * 36,
  texto: String(i),
}))

/**
 * Altímetro com dois ponteiros: o longo dá a volta a cada 1.000 ft e o curto a cada
 * 10.000 ft. `null` não desenha os ponteiros.
 */
export function AltimeterDial({ altitude }: { altitude: number | null }): React.ReactElement {
  const angulos = altitude === null ? null : angulosDoAltimetro(altitude)
  return (
    <RoundDial
      marcas={MARCAS}
      rotulos={ROTULOS}
      legenda="ALT ×100 FT"
      ponteiros={
        angulos === null
          ? []
          : [
              { angulo: angulos.milhares, tipo: 'curto' },
              { angulo: angulos.centenas, tipo: 'longo' },
            ]
      }
    />
  )
}
