import { useState, useEffect } from 'react'
import { getConnectionState, onConnectionStateChanged } from '../ipc/connection-ipc'
import type { EstadoConexao } from '../../shared/types'

export function useConnectionState(): EstadoConexao {
  const [conexao, setConexao] = useState<EstadoConexao>('desconectado')

  useEffect(() => {
    let ativo = true
    let recebeuEvento = false

    const removeListener = onConnectionStateChanged((estado) => {
      recebeuEvento = true
      setConexao(estado)
    })

    getConnectionState()
      .then((estado) => {
        // Um evento recebido durante a consulta é mais recente que a resposta.
        if (ativo && !recebeuEvento) {
          setConexao(estado)
        }
      })
      .catch((erro: unknown) => {
        // Mantém 'desconectado' até o próximo evento de conexão.
        console.error('[useConnectionState] Falha ao consultar o estado da conexão:', erro)
      })

    return () => {
      ativo = false
      removeListener()
    }
  }, [])

  return conexao
}
