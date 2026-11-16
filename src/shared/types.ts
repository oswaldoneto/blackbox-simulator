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
