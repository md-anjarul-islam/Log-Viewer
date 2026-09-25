import { app, ipcMain, type BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { CategoriesRepo } from '../db/categoriesRepo'
import type { CommandsRepo } from '../db/commandsRepo'
import type { LogsRepo } from '../db/logsRepo'
import type { DebugLogsRepo } from '../db/debugLogsRepo'
import type { LogIngestor } from '../logging/LogIngestor'
import type { Scheduler } from '../scheduler/Scheduler'
import type { SerialManager } from '../serial/SerialManager'
import { registerCommandHandlers } from './registerCommandHandlers'
import { registerCategoryHandlers } from './registerCategoryHandlers'
import {
  registerSerialHandlers,
  registerListPortsHandler,
  MAIN_SERIAL_CHANNELS,
  DEBUG_SERIAL_CHANNELS
} from './registerSerialHandlers'
import { registerLogHandlers } from './registerLogHandlers'
import { registerDebugLogHandlers } from './registerDebugLogHandlers'

interface IpcDeps {
  commandsRepo: CommandsRepo
  categoriesRepo: CategoriesRepo
  logsRepo: LogsRepo
  debugLogsRepo: DebugLogsRepo
  serialManager: SerialManager
  debugSerialManager: SerialManager
  scheduler: Scheduler
  logIngestor: LogIngestor
  getWindow: () => BrowserWindow | null
}

export function registerIpcHandlers(deps: IpcDeps): void {
  ipcMain.handle(IPC.APP_GET_VERSION, () => app.getVersion())
  registerCommandHandlers(
    deps.commandsRepo,
    deps.categoriesRepo,
    deps.serialManager,
    deps.scheduler,
    deps.logIngestor,
    deps.getWindow
  )
  registerCategoryHandlers(deps.categoriesRepo, deps.commandsRepo, deps.getWindow)
  registerListPortsHandler(deps.serialManager)
  registerSerialHandlers(deps.serialManager, deps.getWindow, MAIN_SERIAL_CHANNELS)
  registerSerialHandlers(deps.debugSerialManager, deps.getWindow, DEBUG_SERIAL_CHANNELS)
  registerLogHandlers(deps.logsRepo, deps.getWindow)
  registerDebugLogHandlers(deps.debugLogsRepo, deps.getWindow)
}
