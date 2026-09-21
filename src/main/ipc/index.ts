import { app, ipcMain, type BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { CommandsRepo } from '../db/commandsRepo'
import { registerCommandHandlers } from './registerCommandHandlers'

interface IpcDeps {
  commandsRepo: CommandsRepo
  getWindow: () => BrowserWindow | null
}

export function registerIpcHandlers(deps: IpcDeps): void {
  ipcMain.handle(IPC.APP_GET_VERSION, () => app.getVersion())
  registerCommandHandlers(deps.commandsRepo, deps.getWindow)
}
