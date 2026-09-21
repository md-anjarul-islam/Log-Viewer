import { app, ipcMain, type BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { CommandsRepo } from '../db/commandsRepo'
import type { Scheduler } from '../scheduler/Scheduler'
import type { SerialManager } from '../serial/SerialManager'
import { registerCommandHandlers } from './registerCommandHandlers'
import { registerSerialHandlers } from './registerSerialHandlers'

interface IpcDeps {
  commandsRepo: CommandsRepo
  serialManager: SerialManager
  scheduler: Scheduler
  getWindow: () => BrowserWindow | null
}

export function registerIpcHandlers(deps: IpcDeps): void {
  ipcMain.handle(IPC.APP_GET_VERSION, () => app.getVersion())
  registerCommandHandlers(deps.commandsRepo, deps.serialManager, deps.scheduler, deps.getWindow)
  registerSerialHandlers(deps.serialManager, deps.getWindow)
}
