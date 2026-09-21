import { app, ipcMain, type BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { CommandsRepo } from '../db/commandsRepo'
import type { LogsRepo } from '../db/logsRepo'
import type { LogIngestor } from '../logging/LogIngestor'
import type { Scheduler } from '../scheduler/Scheduler'
import type { SerialManager } from '../serial/SerialManager'
import { registerCommandHandlers } from './registerCommandHandlers'
import { registerSerialHandlers } from './registerSerialHandlers'
import { registerLogHandlers } from './registerLogHandlers'

interface IpcDeps {
  commandsRepo: CommandsRepo
  logsRepo: LogsRepo
  serialManager: SerialManager
  scheduler: Scheduler
  logIngestor: LogIngestor
  getWindow: () => BrowserWindow | null
}

export function registerIpcHandlers(deps: IpcDeps): void {
  ipcMain.handle(IPC.APP_GET_VERSION, () => app.getVersion())
  registerCommandHandlers(deps.commandsRepo, deps.serialManager, deps.scheduler, deps.logIngestor, deps.getWindow)
  registerSerialHandlers(deps.serialManager, deps.getWindow)
  registerLogHandlers(deps.logsRepo, deps.getWindow)
}
