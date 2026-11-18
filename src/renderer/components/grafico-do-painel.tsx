import React from 'react'
import type { GrupoDoGrafico } from './config-grafico-painel'
import { GRAFICO_ALTURA, GRAFICO_LARGURA } from './desenho-do-grafico'
import type { DesenhoDoGrafico } from './desenho-do-grafico'
import './grafico-do-painel.css'

interface GraficoDoPainelProps {
  desenho: DesenhoDoGrafico
  grupo: GrupoDoGrafico
  /** Linha cinza: sem sinal, ou sessão encerrada com os valores descartados (CA-002-4 e 5). */
  linhaCinza: boolean
}

/**
 * Gráfico de linha dos últimos 2 minutos de um card do painel (CA-002-7). O desenho e os
 * limites da escala ficam ocultos do leitor de tela; o rótulo do card diz a faixa (CA-002-19).
 */
export function GraficoDoPainel({ desenho, grupo, linhaCinza }: GraficoDoPainelProps): React.ReactElement {
  const classe = `grafico-do-painel grafico-do-painel--${grupo}${linhaCinza ? ' grafico-do-painel--sem-sinal' : ''}`
  return (
    <div className={classe} aria-hidden="true">
      <svg
        className="grafico-do-painel__desenho"
        viewBox={`0 0 ${GRAFICO_LARGURA} ${GRAFICO_ALTURA}`}
        preserveAspectRatio="none"
        focusable="false"
      >
        <line
          className="grafico-do-painel__meio"
          x1={0}
          y1={GRAFICO_ALTURA / 2}
          x2={GRAFICO_LARGURA}
          y2={GRAFICO_ALTURA / 2}
        />
        {desenho.area !== '' && <path className="grafico-do-painel__area" d={desenho.area} />}
        {desenho.linha !== '' && <path className="grafico-do-painel__linha" d={desenho.linha} />}
        {desenho.pontosIsolados !== '' && (
          <path className="grafico-do-painel__ponto" d={desenho.pontosIsolados} />
        )}
      </svg>
      <div className="grafico-do-painel__limites">
        <span>{desenho.limiteInferior ?? ''}</span>
        <span>{desenho.limiteSuperior ?? ''}</span>
      </div>
    </div>
  )
}
