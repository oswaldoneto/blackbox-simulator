import React, { useMemo } from 'react'
import { formatParameterValue, NAO_APLICAVEL, SEM_VALOR } from './format-parameter-value'
import { configDoGrafico } from './config-grafico-painel'
import { desenharGrafico } from './desenho-do-grafico'
import { GraficoDoPainel } from './grafico-do-painel'
import type { PontoNoTempo } from './segmentar-serie'
import { TEXTO_SEM_ITEM, textoDoIndicador } from './texto-do-indicador'

/** Lista vazia estável, para o `useMemo` não refazer o desenho sem necessidade. */
const SEM_PONTOS: readonly PontoNoTempo[] = []

interface ParameterIndicatorProps {
  parametroId: string
  nome: string
  unidade: string
  /** Valor bruto do parâmetro; `null` exibe "—" (sem sinal). */
  valor: number | null
  /** A aeronave não possui o item (RN-007): exibe "N/A", que vence o valor e o "—". */
  naoAplicavel?: boolean
  /** Leituras dos últimos 2 minutos, com valores brutos, para o gráfico de linha. */
  pontos?: readonly PontoNoTempo[]
  /** Instante da borda direita do gráfico (ms UTC); `null` antes da primeira leitura. */
  agora?: number | null
  /** Linha cinza: sem sinal, ou sessão encerrada com os valores descartados. */
  linhaCinza?: boolean
}

function ParameterIndicatorBase({
  parametroId,
  nome,
  unidade,
  valor,
  naoAplicavel = false,
  pontos = SEM_PONTOS,
  agora = null,
  linhaCinza = false,
}: ParameterIndicatorProps): React.ReactElement {
  const valorFormatado = naoAplicavel ? NAO_APLICAVEL : formatParameterValue(parametroId, valor)
  const semSinal = !naoAplicavel && valorFormatado === SEM_VALOR
  const semValor = naoAplicavel || semSinal
  const config = configDoGrafico(parametroId)

  // O card N/A não tem gráfico (CA-002-18).
  const desenho = useMemo(
    () => (naoAplicavel || config === null ? null : desenharGrafico({ parametroId, pontos, agora })),
    [naoAplicavel, config, parametroId, pontos, agora]
  )

  const descricao = textoDoIndicador({
    parametroId,
    nome,
    unidade,
    valor,
    naoAplicavel,
    faixa: desenho?.faixa ?? null,
  })

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
      {naoAplicavel && <div className="parameter-indicator__sem-item">{TEXTO_SEM_ITEM}</div>}
      {desenho !== null && config !== null && (
        <GraficoDoPainel desenho={desenho} grupo={config.grupo} linhaCinza={linhaCinza} />
      )}
    </div>
  )
}

export const ParameterIndicator = React.memo(ParameterIndicatorBase)
