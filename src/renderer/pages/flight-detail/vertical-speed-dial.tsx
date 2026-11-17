import React from 'react'
import { RoundDial, marcasDaEscala, rotulosDaEscala } from './round-dial'
import { ESCALA_VS, anguloNaEscala } from './escala-instrumentos'

const MARCAS = marcasDaEscala(ESCALA_VS, 100, 5)
const ROTULOS = rotulosDaEscala(
  ESCALA_VS,
  [-2000, -1500, -1000, -500, 0, 500, 1000, 1500, 2000],
  (v) => String(Math.abs(v) / 100)
)

/** Variômetro (−2.000 a +2.000 fpm); `null` não desenha o ponteiro. */
export function VerticalSpeedDial({ vs }: { vs: number | null }): React.ReactElement {
  return (
    <RoundDial
      marcas={MARCAS}
      rotulos={ROTULOS}
      legenda="FPM ×100"
      legendaSuperior="▲ SOBE  ▼ DESCE"
      ponteiros={vs === null ? [] : [{ angulo: anguloNaEscala(vs, ESCALA_VS), tipo: 'longo' }]}
    />
  )
}
