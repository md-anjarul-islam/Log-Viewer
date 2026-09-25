import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { getDb } from './db/connection'
import { runMigrations } from './db/migrations'
import { CommandsRepo } from './db/commandsRepo'
import { CategoriesRepo } from './db/categoriesRepo'
import { LogsRepo } from './db/logsRepo'
import { DebugLogsRepo } from './db/debugLogsRepo'
import { SerialManager } from './serial/SerialManager'
import { SettingsStore } from './settings/SettingsStore'
import { Scheduler } from './scheduler/Scheduler'
import { LogIngestor } from './logging/LogIngestor'
import { DebugLogIngestor } from './logging/DebugLogIngestor'
import { registerIpcHandlers } from './ipc'

let mainWindow: BrowserWindow | null = null
let logIngestor: LogIngestor | null = null
const settingsStore = new SettingsStore()
const serialManager = new SerialManager(settingsStore, 'main')
const debugSerialManager = new SerialManager(settingsStore, 'debug')
const scheduler = new Scheduler((command) => {
  logIngestor?.beginRun(command.id, 'scheduled')
  serialManager.write(command.commandString).catch((err) => {
    console.error(`Scheduled run of "${command.name}" failed:`, err instanceof Error ? err.message : err)
  })
})

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  window.on('ready-to-show', () => {
    window.show()
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

app.whenReady().then(() => {
  const db = getDb()
  runMigrations(db)
  const commandsRepo = new CommandsRepo(db)
  const categoriesRepo = new CategoriesRepo(db)
  const logsRepo = new LogsRepo(db)
  const debugLogsRepo = new DebugLogsRepo(db)
  logIngestor = new LogIngestor(serialManager, logsRepo, () => mainWindow)
  new DebugLogIngestor(debugSerialManager, debugLogsRepo, () => mainWindow)

  for (const command of commandsRepo.list()) {
    scheduler.syncWithCommand(command)
  }

  mainWindow = createWindow()
  registerIpcHandlers({
    commandsRepo,
    categoriesRepo,
    logsRepo,
    debugLogsRepo,
    serialManager,
    debugSerialManager,
    scheduler,
    logIngestor,
    getWindow: () => mainWindow
  })

  serialManager.tryStartReconnectIfEligible()
  debugSerialManager.tryStartReconnectIfEligible()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow()
  })
})

app.on('before-quit', () => {
  scheduler.stopAll()
  serialManager.disconnect()
  debugSerialManager.disconnect()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
