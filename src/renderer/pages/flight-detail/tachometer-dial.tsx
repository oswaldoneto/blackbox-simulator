import React from 'react'
import { RoundDial, marcasDaEscala, rotulosDaEscala } from './round-dial'
import { ESCALA_RPM, anguloNaEscala } from './escala-instrumentos'

const MARCAS = marcasDaEscala(ESCALA_RPM, 100, 5)
const ROTULOS = rotulosDaEscala(ESCALA_RPM, [0, 500, 1000, 1500, 2000, 2500, 3000, 3500], (v) =>
  String(v / 100)
)

/** Tacômetro (0 a 3.500 rpm), sem faixas de cor; `null` não desenha o ponteiro. */
export function TachometerDial({ rpm }: { rpm: number | null }): React.ReactElement {
  return (
    <RoundDial
      marcas={MARCAS}
      rotulos={ROTULOS}
      legenda="RPM ×100"
      ponteiros={rpm === null ? [] : [{ angulo: anguloNaEscala(rpm, ESCALA_RPM), tipo: 'longo' }]}
    />
  )
}
