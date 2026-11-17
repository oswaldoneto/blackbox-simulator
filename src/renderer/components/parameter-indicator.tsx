import React from 'react'
import { formatParameterValue, NAO_APLICAVEL, SEM_VALOR } from './format-parameter-value'

interface ParameterIndicatorProps {
  parametroId: string
  nome: string
  unidade: string
  /** Valor bruto do parâmetro; `null` exibe "—" (sem sinal). */
  valor: number | null
  /** A aeronave não possui o item (RN-007): exibe "N/A", que vence o valor e o "—". */
  naoAplicavel?: boolean
}

function ParameterIndicatorBase({
  parametroId,
  nome,
  unidade,
  valor,
  naoAplicavel = false,
}: ParameterIndicatorProps): React.ReactElement {
  const valorFormatado = naoAplicavel ? NAO_APLICAVEL : formatParameterValue(parametroId, valor)
  const semSinal = !naoAplicavel && valorFormatado === SEM_VALOR
  const semValor = naoAplicavel || semSinal
  let descricao = `${nome}: ${valorFormatado} ${unidade}`
  if (naoAplicavel) descricao = `${nome}: não aplicável`
  else if (semSinal) descricao = `${nome}: sem sinal`

  return (
    <div className="parameter-indicator" role="group" aria-label={descricao}>
      <span className="parameter-indicator__label">{nome}</span>
      <span className="parameter-indicator__reading">
        <span
          className={
            semValor
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
