import React from 'react'
import { RoundDial, marcasDaEscala, rotulosDaEscala } from './round-dial'
import { ESCALA_IAS, anguloNaEscala } from './escala-instrumentos'

const MARCAS = marcasDaEscala(ESCALA_IAS, 10, 2)
const ROTULOS = rotulosDaEscala(ESCALA_IAS, [0, 40, 80, 120, 160, 200], String)

/** Velocímetro (IAS, 0 a 200 kt), sem faixas de cor; `null` não desenha o ponteiro. */
export function AirspeedDial({ ias }: { ias: number | null }): React.ReactElement {
  return (
    <RoundDial
      marcas={MARCAS}
      rotulos={ROTULOS}
      legenda="KT"
      ponteiros={ias === null ? [] : [{ angulo: anguloNaEscala(ias, ESCALA_IAS), tipo: 'longo' }]}
    />
  )
}
