import React, { useEffect, useMemo, useRef } from 'react'
import {
  DURACAO_INDISPONIVEL,
  formatarDataDoVoo,
  formatarDuracaoDoVoo,
  formatarDuracaoPorExtenso,
  formatarHoraDoVoo,
} from '../../components/format-flight-time'
import { medirPrimeiroDesenho, useDadosDoVoo } from '../../hooks/use-dados-do-voo'
import { useReproducao } from './use-reproducao'
import { FlightPlayer } from './flight-player'
import { TrajectoryMap } from './trajectory-map'
import { InstrumentPanel } from './instrument-panel'
import { VerticalProfile } from './vertical-profile'
import type { ContextoDoInstante } from './catalogo'
import type { ParametroDeVoo, Sessao, SerieDeLeituras } from '../../../shared/types'
import './flight-detail-page.css'

/** Textos dos estados da tela do voo (UC-005). */
export const CARREGANDO_DADOS_DO_VOO = 'Carregando dados do voo...'
export const ERRO_DADOS_DO_VOO =
  'Não foi possível carregar os dados do voo. Volte à lista e abra o voo de novo.'
export const VOO_SEM_LEITURAS = 'Nenhuma leitura gravada neste voo.'

interface FlightDetailPageProps {
  sessao: Sessao
  onVoltar: () => void
  /** Fuso para data e hora; usado só nos testes. */
  timeZone?: string
}

/** Duração em segundos inteiros entre o início e o fim; 0 se não puder ser calculada. */
function duracaoEmSegundos(sessao: Sessao): number {
  if (sessao.encerradaEm === null) {
    return 0
  }
  const totalMs = Date.parse(sessao.encerradaEm) - Date.parse(sessao.iniciadaEm)
  return Number.isFinite(totalMs) && totalMs > 0 ? Math.floor(totalMs / 1000) : 0
}

/**
 * Tela do voo, debriefing (UC-005): cabeçalho com "Voltar à lista" (também Esc) e, com os
 * dados carregados, reprodução, trajetória, painel de instrumentos e perfil vertical no
 * instante selecionado. Abre pausada em 0:00:00, a 1×.
 */
export function FlightDetailPage({
  sessao,
  onVoltar,
  timeZone,
}: FlightDetailPageProps): React.ReactElement {
  const voltar = useRef<HTMLButtonElement>(null)
  const dados = useDadosDoVoo(sessao.id)
  const duracao = duracaoEmSegundos(sessao)
  const inicioMs = Date.parse(sessao.iniciadaEm)
  const { reproducao, alternar, posicionar, mudarVelocidade } = useReproducao(duracao)

  const data = formatarDataDoVoo(sessao.iniciadaEm, timeZone)
  const hora = formatarHoraDoVoo(sessao.iniciadaEm, timeZone)
  const duracaoHms = formatarDuracaoDoVoo(sessao.iniciadaEm, sessao.encerradaEm)
  const duracaoExtenso = formatarDuracaoPorExtenso(sessao.iniciadaEm, sessao.encerradaEm)

  const parametros: ParametroDeVoo[] | null = dados.estado === 'pronto' ? dados.parametros : null
  const listaDeSeries: SerieDeLeituras[] | null =
    dados.estado === 'pronto' ? dados.leituras.series : null

  const catalogo = useMemo(
    () => new Map<string, ParametroDeVoo>((parametros ?? []).map((p) => [p.id, p])),
    [parametros]
  )
  const series = useMemo(
    () => new Map<string, SerieDeLeituras>((listaDeSeries ?? []).map((s) => [s.parametroId, s])),
    [listaDeSeries]
  )

  useEffect(() => {
    voltar.current?.focus()
  }, [])

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') {
        onVoltar()
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [onVoltar])

  useEffect(() => {
    if (dados.estado === 'pronto') {
      medirPrimeiroDesenho()
    }
  }, [dados.estado])

  const semLeituras = dados.estado === 'pronto' && dados.leituras.series.length === 0

  const contexto: ContextoDoInstante = {
    catalogo,
    series,
    parametrosNaoAplicaveis: sessao.parametrosNaoAplicaveis,
    instanteMs: inicioMs + Math.floor(reproducao.posicao) * 1000,
  }

  return (
    <section className="flight-detail" aria-labelledby="flight-detail-title">
      <header className="flight-detail__header">
        <div>
          <h1 id="flight-detail-title" className="flight-detail__title">
            Voo de {data}
          </h1>
          <p id="flight-detail-meta" className="flight-detail__meta">
            Início {hora} · Duração <span className="flight-detail__mono" aria-hidden="true">{duracaoHms}</span>
            <span className="visualmente-oculto">
              {duracaoExtenso === DURACAO_INDISPONIVEL ? 'indisponível' : duracaoExtenso}
            </span>
          </p>
        </div>
        <button
          ref={voltar}
          type="button"
          className="flight-detail__back-button"
          aria-describedby={
            semLeituras
              ? 'flight-detail-title flight-detail-meta flight-detail-sem-leituras'
              : 'flight-detail-title flight-detail-meta'
          }
          onClick={onVoltar}
        >
          Voltar à lista
        </button>
      </header>

      {dados.estado === 'carregando' && dados.mostrarCarregando && (
        <p role="status" className="flight-detail__message">
          {CARREGANDO_DADOS_DO_VOO}
        </p>
      )}
      {dados.estado === 'erro' && (
        <p role="alert" className="flight-detail__message">
          {ERRO_DADOS_DO_VOO}
        </p>
      )}
      {/* role="status": o foco já está em "Voltar à lista" desde a montagem, então a entrada
          tardia no aria-describedby pode não ser lida; a região viva garante o anúncio. */}
      {semLeituras && (
        <p id="flight-detail-sem-leituras" role="status" className="flight-detail__message">
          {VOO_SEM_LEITURAS}
        </p>
      )}
      {dados.estado === 'pronto' && dados.leituras.series.length > 0 && (
        <>
          <FlightPlayer
            reproducao={reproducao}
            duracao={duracao}
            inicioMs={inicioMs}
            onAlternar={alternar}
            onPosicionar={posicionar}
            onMudarVelocidade={mudarVelocidade}
            timeZone={timeZone}
          />
          <div className="flight-detail__row">
            <TrajectoryMap contexto={contexto} duracaoMs={duracao * 1000} />
            <InstrumentPanel {...contexto} />
          </div>
          <VerticalProfile contexto={contexto} inicioMs={inicioMs} duracaoMs={duracao * 1000} />
        </>
      )}
    </section>
  )
}
