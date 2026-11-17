import React, { useId } from 'react'
import {
  formatarHoraComSegundos,
  formatarSegundosHms,
  textoDoInstante,
} from '../../components/format-flight-time'
import { VELOCIDADES_DE_REPRODUCAO } from './reproducao'
import type { EstadoDaReproducao, VelocidadeDeReproducao } from './reproducao'

interface FlightPlayerProps {
  reproducao: EstadoDaReproducao
  /** Duração do voo em segundos inteiros. */
  duracao: number
  /** Hora de início do voo em ms UTC, para a hora local do instante. */
  inicioMs: number
  onAlternar: () => void
  onPosicionar: (posicao: number) => void
  onMudarVelocidade: (velocidade: VelocidadeDeReproducao) => void
  /** Fuso para a hora local; usado só nos testes. */
  timeZone?: string
}

/**
 * Reprodução do debriefing (UC-005): Reproduzir/Pausar, velocidades 1×, 4× e 16×, tempo
 * decorrido "h:mm:ss de h:mm:ss · HH:mm:ss" e a linha do tempo ("Instante do voo", passo
 * de 1 s pelas setas). O leitor de tela ouve o instante por extenso no `aria-valuetext`.
 */
export function FlightPlayer({
  reproducao,
  duracao,
  inicioMs,
  onAlternar,
  onPosicionar,
  onMudarVelocidade,
  timeZone,
}: FlightPlayerProps): React.ReactElement {
  const idDoControle = useId()
  const segundo = Math.floor(reproducao.posicao)
  const horaLocal = formatarHoraComSegundos(inicioMs + segundo * 1000, timeZone)

  return (
    <section className="flight-section flight-player" aria-label="Reprodução do voo">
      <div className="flight-player__controls">
        <div className="flight-player__buttons">
          <button
            type="button"
            className="flight-player__play"
            aria-label={reproducao.tocando ? 'Pausar' : 'Reproduzir o voo'}
            onClick={onAlternar}
          >
            {reproducao.tocando ? (
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <rect x="3" y="2" width="3.5" height="12" />
                <rect x="9.5" y="2" width="3.5" height="12" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M4 2 L14 8 L4 14 Z" />
              </svg>
            )}
          </button>
          <div role="group" aria-label="Velocidade de reprodução" className="flight-player__speeds">
            {VELOCIDADES_DE_REPRODUCAO.map((velocidade) => (
              <button
                key={velocidade}
                type="button"
                className="flight-player__speed"
                aria-pressed={reproducao.velocidade === velocidade}
                onClick={() => onMudarVelocidade(velocidade)}
              >
                {velocidade}×
              </button>
            ))}
          </div>
        </div>
        <span className="flight-player__time" aria-hidden="true">
          <span className="flight-player__elapsed">{formatarSegundosHms(segundo)}</span> de{' '}
          {formatarSegundosHms(duracao)} · {horaLocal}
        </span>
      </div>
      <label htmlFor={idDoControle} className="visualmente-oculto">
        Instante do voo
      </label>
      <input
        id={idDoControle}
        type="range"
        className="flight-player__timeline"
        min={0}
        max={duracao}
        step={1}
        value={segundo}
        aria-valuetext={textoDoInstante(segundo, duracao, horaLocal)}
        onChange={(evento) => onPosicionar(Number(evento.target.value))}
      />
    </section>
  )
}
