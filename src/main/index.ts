import { app, BrowserWindow } from 'electron'
import path from 'path'
import { runMigrations } from './db/migrator'
import { CollectionService } from './simconnect/collection-service'
import { registerSessionHandlers, emitSessionStarted } from './ipc/session-handler'
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

  const collectionService = new CollectionService()

  registerSessionHandlers(getMainWindow)
  registerParameterHandlers()
  registerConnectionHandlers(() => collectionService.getEstadoConexao())

  collectionService.onSessaoCriada((sessao) => {
    emitSessionStarted(getMainWindow, sessao)
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
