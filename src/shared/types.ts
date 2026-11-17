export interface Sessao {
  id: string
  iniciadaEm: string
  encerradaEm: string | null
  aeronave: string
  aerodromoOrigem: string | null
  aerodromoDestino: string | null
  status: 'ativa' | 'encerrada'
}

export interface ParametroDeVoo {
  id: string
  nome: string
  unidade: string
  ativo: boolean
}

export interface LeituraDeParametro {
  sessaoId: string
  parametroId: string
  timestamp: string
  valor: number
}

/** Estado da conexão do processo main com o SimConnect. */
export type EstadoConexao = 'conectado' | 'desconectado'

/** Valor lido de um parâmetro num ciclo de coleta, antes de ir para o banco. */
export interface LeituraDoPacote {
  parametroId: string
  valor: number
}

/** Leituras de um ciclo de coleta (1 s), enviadas ao renderer só com sessão ativa. */
export interface PacoteDeLeituras {
  sessaoId: string
  timestamp: string
  leituras: LeituraDoPacote[]
}
