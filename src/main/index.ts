import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { getDb } from './db/connection'
import { runMigrations } from './db/migrations'
import { CommandsRepo } from './db/commandsRepo'
import { SerialManager } from './serial/SerialManager'
import { Scheduler } from './scheduler/Scheduler'
import { registerIpcHandlers } from './ipc'

let mainWindow: BrowserWindow | null = null
const serialManager = new SerialManager()
const scheduler = new Scheduler((command) => {
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
  for (const command of commandsRepo.list()) {
    scheduler.syncWithCommand(command)
  }

  mainWindow = createWindow()
  registerIpcHandlers({ commandsRepo, serialManager, scheduler, getWindow: () => mainWindow })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow()
  })
})

app.on('before-quit', () => {
  scheduler.stopAll()
  serialManager.disconnect()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
