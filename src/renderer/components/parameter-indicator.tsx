import React from 'react'
import { formatParameterValue, SEM_VALOR } from './format-parameter-value'

interface ParameterIndicatorProps {
  parametroId: string
  nome: string
  unidade: string
  /** Valor bruto do parâmetro; `null` exibe "—" (sem sinal). */
  valor: number | null
}

function ParameterIndicatorBase({
  parametroId,
  nome,
  unidade,
  valor,
}: ParameterIndicatorProps): React.ReactElement {
  const valorFormatado = formatParameterValue(parametroId, valor)
  const semSinal = valorFormatado === SEM_VALOR
  const descricao = semSinal ? `${nome}: sem sinal` : `${nome}: ${valorFormatado} ${unidade}`

  return (
    <div className="parameter-indicator" role="group" aria-label={descricao}>
      <span className="parameter-indicator__label">{nome}</span>
      <span className="parameter-indicator__reading">
        <span
          className={
            semSinal
              ? 'parameter-indicator__value parameter-indicator__value--no-signal'
              : 'parameter-indicator__value'
          }
        >
          {valorFormatado}
        </span>
        <span className="parameter-indicator__unit">{unidade}</span>
      </span>
    </div>
  )
}

export const ParameterIndicator = React.memo(ParameterIndicatorBase)
