import { dialog, ipcMain, type BrowserWindow } from 'electron'
import { readFile, writeFile } from 'node:fs/promises'
import { IPC } from '@shared/ipc-channels'
import type {
  Command,
  CommandExportResult,
  CommandImportResult,
  CommandInput,
  RunNowResult
} from '@shared/types'
import type { CategoriesRepo } from '../db/categoriesRepo'
import type { CommandsRepo } from '../db/commandsRepo'
import type { LogIngestor } from '../logging/LogIngestor'
import type { Scheduler } from '../scheduler/Scheduler'
import type { SerialManager } from '../serial/SerialManager'

function formatIntervalForExport(ms: number | null): string {
  if (ms == null) return ''
  return `${ms / 1000} s`
}

function parseIntervalFromImport(scheduleTime: unknown): number | null {
  if (typeof scheduleTime !== 'string') return null
  const trimmed = scheduleTime.trim()
  if (!trimmed) return null
  const match = trimmed.match(/^(\d+(?:\.\d+)?) ?s$/)
  if (!match) return null
  return Number(match[1]) * 1000
}

interface ImportedCommandEntry {
  name: string
  category: string
  command: string
  scheduleTime: unknown
}

function parseImportEntries(raw: unknown): { entries: ImportedCommandEntry[]; errors: string[] } {
  if (!Array.isArray(raw)) {
    throw new Error('Import file must contain a JSON array of commands')
  }
  const entries: ImportedCommandEntry[] = []
  const errors: string[] = []
  raw.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`Entry ${index + 1}: not a valid object`)
      return
    }
    const record = item as Record<string, unknown>
    const name = typeof record.name === 'string' ? record.name.trim() : ''
    const command = typeof record.command === 'string' ? record.command : ''
    if (!name) {
      errors.push(`Entry ${index + 1}: missing "name"`)
      return
    }
    if (!command) {
      errors.push(`Entry ${index + 1} ("${name}"): missing "command"`)
      return
    }
    const category = typeof record.category === 'string' ? record.category.trim() : ''
    entries.push({ name, category, command, scheduleTime: record.scheduleTime })
  })
  return { entries, errors }
}

function formatCommandsForExport(commands: Command[], categoryNames: Map<number, string>): string {
  const data = commands.map((c) => ({
    name: c.name,
    category: c.categoryId != null ? (categoryNames.get(c.categoryId) ?? '') : '',
    command: c.commandString,
    scheduleTime: formatIntervalForExport(c.scheduleIntervalMs)
  }))
  return JSON.stringify(data, null, 2) + '\n'
}

function defaultCommandsExportFileName(): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  const d = new Date()
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  return `commands-export-${stamp}.json`
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
  const broadcastCategoriesChanged = (): void => {
    getWindow()?.webContents.send(IPC.CATEGORIES_CHANGED, categoriesRepo.list())
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
      filters: [{ name: 'JSON files', extensions: ['json'] }]
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

  ipcMain.handle(IPC.COMMANDS_IMPORT, async (): Promise<CommandImportResult> => {
    const window = getWindow()
    const dialogOptions: Electron.OpenDialogOptions = {
      title: 'Import commands',
      filters: [{ name: 'JSON files', extensions: ['json'] }],
      properties: ['openFile']
    }
    const { canceled, filePaths } = window
      ? await dialog.showOpenDialog(window, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    const filePath = filePaths?.[0]
    if (canceled || !filePath) return { canceled: true }

    let parsed: unknown
    try {
      const raw = await readFile(filePath, 'utf-8')
      parsed = JSON.parse(raw)
    } catch (err) {
      return {
        canceled: false,
        filePath,
        errors: [err instanceof Error ? err.message : 'Failed to read or parse the file']
      }
    }

    let entries: ImportedCommandEntry[]
    const errors: string[] = []
    try {
      const result = parseImportEntries(parsed)
      entries = result.entries
      errors.push(...result.errors)
    } catch (err) {
      return {
        canceled: false,
        filePath,
        errors: [err instanceof Error ? err.message : 'Invalid import file']
      }
    }

    let categoriesImported = 0
    let categoriesSkipped = 0
    const categoryIdByName = new Map<string, number>()
    for (const c of categoriesRepo.list()) categoryIdByName.set(c.name, c.id)

    const wantedCategoryNames = new Set(entries.map((e) => e.category).filter((name) => name))
    for (const name of wantedCategoryNames) {
      if (categoryIdByName.has(name)) {
        categoriesSkipped++
        continue
      }
      const category = categoriesRepo.create({ name })
      categoryIdByName.set(category.name, category.id)
      categoriesImported++
    }

    let commandsImported = 0
    let commandsSkipped = 0
    for (const entry of entries) {
      if (commandsRepo.findByName(entry.name)) {
        commandsSkipped++
        continue
      }
      const input: CommandInput = {
        name: entry.name,
        commandString: entry.command,
        enabled: false,
        scheduleIntervalMs: parseIntervalFromImport(entry.scheduleTime),
        categoryId: entry.category ? (categoryIdByName.get(entry.category) ?? null) : null
      }
      const command = commandsRepo.create(input)
      scheduler.syncWithCommand(command)
      commandsImported++
    }

    if (categoriesImported > 0) broadcastCategoriesChanged()
    if (commandsImported > 0) broadcastChanged()

    return {
      canceled: false,
      filePath,
      commandsImported,
      commandsSkipped,
      categoriesImported,
      categoriesSkipped,
      errors: errors.length > 0 ? errors : undefined
    }
  })
}
