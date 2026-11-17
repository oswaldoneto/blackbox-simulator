import { app, BrowserWindow } from 'electron'
import path from 'path'
import { runMigrations } from './db/migrator'
import { encerrarSessoesAtivasAnteriores } from './db/session-repository'
import { CollectionService } from './simconnect/collection-service'
import {
  registerSessionHandlers,
  emitSessionStarted,
  emitSessionEnded,
  emitSessionEndFailed,
} from './ipc/session-handler'
import { registerParameterHandlers, emitParameterReadings } from './ipc/parameter-handler'
import { registerConnectionHandlers, emitConnectionState } from './ipc/connection-handler'

let mainWindow: BrowserWindow | null = null

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.loadFile(path.join(__dirname, '../../renderer/index.html'))
  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null
    }
  })
  return win
}

function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

app.whenReady().then(() => {
  runMigrations()

  // Encerra as sessões ativas antigas, exceto a mais recente, que fica para a
  // verificação na abertura feita pelo CollectionService (UC-003). Uma falha aqui não
  // impede a abertura: as sessões continuam ativas e a rotina roda de novo na próxima.
  try {
    const encerradas = encerrarSessoesAtivasAnteriores()
    if (encerradas > 0) {
      console.log(`[Main] ${encerradas} sessão(ões) ativa(s) antiga(s) encerrada(s).`)
    }
  } catch (err) {
    console.error('[Main] Falha ao encerrar as sessões ativas antigas:', err)
  }

  const collectionService = new CollectionService()

  registerSessionHandlers(() => collectionService.getSessaoAtual())
  registerParameterHandlers()
  registerConnectionHandlers(() => collectionService.getEstadoConexao())

  collectionService.onSessaoCriada((sessao) => {
    emitSessionStarted(getMainWindow, sessao)
  })

  // Fechar o app não encerra a sessão: a próxima abertura a verifica (UC-003).
  collectionService.onSessaoEncerrada((sessao) => {
    emitSessionEnded(getMainWindow, sessao)
  })

  collectionService.onFalhaAoEncerrar((sessao) => {
    emitSessionEndFailed(getMainWindow, sessao)
  })

  collectionService.onLeituras((pacote) => {
    emitParameterReadings(getMainWindow, pacote)
  })

  collectionService.onConexaoAlterada((estado) => {
    emitConnectionState(getMainWindow, estado)
  })

  mainWindow = createWindow()
  collectionService.inicializar()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
