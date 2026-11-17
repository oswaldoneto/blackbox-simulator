import React from 'react'
import { descricaoDaLeitura, textoDaLeitura } from './leitura-do-mostrador'
import type { LeituraDoMostrador } from './leitura-do-mostrador'

interface InstrumentSlotProps {
  /** Parâmetros mostrados pelo instrumento (um ou dois). */
  leituras: readonly LeituraDoMostrador[]
  /** Desenho do instrumento; vai com `aria-hidden`, porque o grupo já diz os valores. */
  children: React.ReactNode
}

/**
 * Lugar de um instrumento no painel do debriefing (UC-005): grupo com rótulo acessível,
 * desenho e, abaixo, rótulo e valor de cada parâmetro. Sem `aria-live`.
 */
export function InstrumentSlot({ leituras, children }: InstrumentSlotProps): React.ReactElement {
  const descricao = leituras.map(descricaoDaLeitura).join(', ')
  return (
    <div className="instrument" role="group" aria-label={descricao}>
      <div className="instrument__drawing" aria-hidden="true">
        {children}
      </div>
      {leituras.map((leitura) => {
        const comValor = leitura.estado.tipo === 'valor'
        return (
          <div key={leitura.parametroId} className="instrument__reading">
            <span className="instrument__label">{leitura.rotulo}</span>
            <span
              className={
                comValor ? 'instrument__value' : 'instrument__value instrument__value--muted'
              }
            >
              {textoDaLeitura(leitura)}
              {comValor && <span className="instrument__unit"> {leitura.unidade}</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}
