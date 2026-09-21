import { randomUUID } from 'crypto'
import { ipcMain, type BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { CommandInput, RunNowResult } from '@shared/types'
import type { CommandsRepo } from '../db/commandsRepo'
import type { SerialManager } from '../serial/SerialManager'

export function registerCommandHandlers(
  commandsRepo: CommandsRepo,
  serialManager: SerialManager,
  getWindow: () => BrowserWindow | null
): void {
  const broadcastChanged = (): void => {
    getWindow()?.webContents.send(IPC.COMMANDS_CHANGED, commandsRepo.list())
  }

  ipcMain.handle(IPC.COMMANDS_LIST, () => commandsRepo.list())

  ipcMain.handle(IPC.COMMANDS_CREATE, (_event, input: CommandInput) => {
    const command = commandsRepo.create(input)
    broadcastChanged()
    return command
  })

  ipcMain.handle(IPC.COMMANDS_UPDATE, (_event, id: number, patch: Partial<CommandInput>) => {
    const command = commandsRepo.update(id, patch)
    broadcastChanged()
    return command
  })

  ipcMain.handle(IPC.COMMANDS_DELETE, (_event, id: number) => {
    commandsRepo.delete(id)
    broadcastChanged()
  })

  ipcMain.handle(IPC.COMMANDS_RUN_NOW, async (_event, id: number): Promise<RunNowResult> => {
    const command = commandsRepo.get(id)
    if (!command) {
      throw new Error(`Command ${id} not found`)
    }
    await serialManager.write(command.commandString)
    return { runId: randomUUID() }
  })
}
