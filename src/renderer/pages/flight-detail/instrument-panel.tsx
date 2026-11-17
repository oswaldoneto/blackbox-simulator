import React from 'react'
import { PARAMETER_IDS } from '../../../shared/parameter-ids'
import { InstrumentSlot } from './instrument-slot'
import { AirspeedDial } from './airspeed-dial'
import { AttitudeDial } from './attitude-dial'
import { AltimeterDial } from './altimeter-dial'
import { TachometerDial } from './tachometer-dial'
import { HeadingDial } from './heading-dial'
import { VerticalSpeedDial } from './vertical-speed-dial'
import { LeverQuadrant } from './lever-quadrant'
import { FlapsIndicator } from './flaps-indicator'
import { leituraNoInstante } from './catalogo'
import type { ContextoDoInstante } from './catalogo'
import { valorDoEstado } from './leitura-do-mostrador'
import './instrument-panel.css'

/**
 * Painel de instrumentos escuro do debriefing (UC-005), no instante selecionado: valores
 * gravados, sem interpolação e sem faixas de cor. N/A, "—" e "Sem dados neste voo"
 * escondem o ponteiro; fora da escala, o ponteiro para no limite e o número mostra o
 * valor real.
 */
export function InstrumentPanel(contexto: ContextoDoInstante): React.ReactElement {
  const ias = leituraNoInstante(PARAMETER_IDS.AIRSPEED_IAS, contexto)
  const arfagem = leituraNoInstante(PARAMETER_IDS.PITCH, contexto)
  const rolagem = leituraNoInstante(PARAMETER_IDS.BANK, contexto)
  const altitude = leituraNoInstante(PARAMETER_IDS.ALTITUDE_MSL, contexto)
  const rpm = leituraNoInstante(PARAMETER_IDS.RPM_1, contexto)
  const rumo = leituraNoInstante(PARAMETER_IDS.HEADING_MAGNETIC, contexto)
  const vs = leituraNoInstante(PARAMETER_IDS.VERTICAL_SPEED, contexto)
  const manete = leituraNoInstante(PARAMETER_IDS.THROTTLE_1, contexto)
  const mistura = leituraNoInstante(PARAMETER_IDS.MIXTURE_1, contexto)
  const flapes = leituraNoInstante(PARAMETER_IDS.FLAPS, contexto)

  return (
    <section className="instrument-panel" aria-labelledby="instrument-panel-title">
      <h2 id="instrument-panel-title" className="instrument-panel__title">
        Painel de instrumentos
      </h2>
      <div className="instrument-panel__body">
        <div className="instrument-panel__grid">
          <InstrumentSlot leituras={[ias]}>
            <AirspeedDial ias={valorDoEstado(ias.estado)} />
          </InstrumentSlot>
          <InstrumentSlot leituras={[arfagem, rolagem]}>
            <AttitudeDial
              arfagem={valorDoEstado(arfagem.estado)}
              rolagem={valorDoEstado(rolagem.estado)}
            />
          </InstrumentSlot>
          <InstrumentSlot leituras={[altitude]}>
            <AltimeterDial altitude={valorDoEstado(altitude.estado)} />
          </InstrumentSlot>
          <InstrumentSlot leituras={[rpm]}>
            <TachometerDial rpm={valorDoEstado(rpm.estado)} />
          </InstrumentSlot>
          <InstrumentSlot leituras={[rumo]}>
            <HeadingDial rumo={valorDoEstado(rumo.estado)} />
          </InstrumentSlot>
          <InstrumentSlot leituras={[vs]}>
            <VerticalSpeedDial vs={valorDoEstado(vs.estado)} />
          </InstrumentSlot>
        </div>
        <div className="instrument-panel__side">
          <InstrumentSlot leituras={[manete, mistura]}>
            <LeverQuadrant
              manete={valorDoEstado(manete.estado)}
              mistura={valorDoEstado(mistura.estado)}
              rotuloManete={manete.rotulo}
              rotuloMistura={mistura.rotulo}
            />
          </InstrumentSlot>
          <InstrumentSlot leituras={[flapes]}>
            <FlapsIndicator flapes={valorDoEstado(flapes.estado)} />
          </InstrumentSlot>
        </div>
      </div>
    </section>
  )
}
