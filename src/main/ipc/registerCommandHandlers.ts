import { dialog, ipcMain, type BrowserWindow } from 'electron'
import { writeFile } from 'node:fs/promises'
import { IPC } from '@shared/ipc-channels'
import type { Command, CommandExportResult, CommandInput, RunNowResult } from '@shared/types'
import type { CategoriesRepo } from '../db/categoriesRepo'
import type { CommandsRepo } from '../db/commandsRepo'
import type { LogIngestor } from '../logging/LogIngestor'
import type { Scheduler } from '../scheduler/Scheduler'
import type { SerialManager } from '../serial/SerialManager'

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function formatIntervalForExport(ms: number | null): string {
  if (ms == null) return 'Manual only'
  const seconds = ms / 1000
  return seconds % 60 === 0 ? `Every ${seconds / 60} min` : `Every ${seconds}s`
}

function formatCommandsForExport(commands: Command[], categoryNames: Map<number, string>): string {
  const header = ['Name', 'Command', 'Enabled', 'Schedule', 'Category', 'Created At', 'Updated At']
  const rows = commands.map((c) =>
    [
      c.name,
      c.commandString,
      c.enabled ? 'Yes' : 'No',
      formatIntervalForExport(c.scheduleIntervalMs),
      c.categoryId != null ? (categoryNames.get(c.categoryId) ?? '') : '',
      c.createdAt,
      c.updatedAt
    ]
      .map(csvEscape)
      .join(',')
  )
  return [header.join(','), ...rows].join('\n') + '\n'
}

function defaultCommandsExportFileName(): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  const d = new Date()
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  return `commands-export-${stamp}.csv`
}

export function registerCommandHandlers(
  commandsRepo: CommandsRepo,
  categoriesRepo: CategoriesRepo,
  serialManager: SerialManager,
  scheduler: Scheduler,
  logIngestor: LogIngestor,
  getWindow: () => BrowserWindow | null
): void {
  const broadcastChanged = (): void => {
    getWindow()?.webContents.send(IPC.COMMANDS_CHANGED, commandsRepo.list())
  }

  ipcMain.handle(IPC.COMMANDS_LIST, () => commandsRepo.list())

  ipcMain.handle(IPC.COMMANDS_CREATE, (_event, input: CommandInput) => {
    const command = commandsRepo.create(input)
    scheduler.syncWithCommand(command)
    broadcastChanged()
    return command
  })

  ipcMain.handle(IPC.COMMANDS_UPDATE, (_event, id: number, patch: Partial<CommandInput>) => {
    const command = commandsRepo.update(id, patch)
    scheduler.syncWithCommand(command)
    broadcastChanged()
    return command
  })

  ipcMain.handle(IPC.COMMANDS_DELETE, (_event, id: number) => {
    commandsRepo.delete(id)
    scheduler.removeCommand(id)
    broadcastChanged()
  })

  ipcMain.handle(IPC.COMMANDS_RUN_NOW, async (_event, id: number): Promise<RunNowResult> => {
    const command = commandsRepo.get(id)
    if (!command) {
      throw new Error(`Command ${id} not found`)
    }
    const runId = logIngestor.beginRun(command.id, 'manual')
    await serialManager.write(command.commandString)
    return { runId }
  })

  ipcMain.handle(IPC.COMMANDS_EXPORT, async (): Promise<CommandExportResult> => {
    const window = getWindow()
    const dialogOptions = {
      title: 'Export commands',
      defaultPath: defaultCommandsExportFileName(),
      filters: [{ name: 'CSV files', extensions: ['csv'] }]
    }
    const { canceled, filePath } = window
      ? await dialog.showSaveDialog(window, dialogOptions)
      : await dialog.showSaveDialog(dialogOptions)

    if (canceled || !filePath) return { canceled: true }

    const commands = commandsRepo.list()
    const categoryNames = new Map(categoriesRepo.list().map((c) => [c.id, c.name]))
    await writeFile(filePath, formatCommandsForExport(commands, categoryNames), 'utf-8')
    return { canceled: false, filePath, count: commands.length }
  })
}
