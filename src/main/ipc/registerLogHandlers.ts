import { dialog, ipcMain, type BrowserWindow } from 'electron'
import { writeFile } from 'node:fs/promises'
import { IPC } from '@shared/ipc-channels'
import type {
  ClearLogsResult,
  LogExportFilter,
  LogExportResult,
  LogQueryFilter,
  LogQueryResult,
  LogsClearedEvent
} from '@shared/types'
import type { LogsRepo } from '../db/logsRepo'

function formatEntriesForExport(entries: ReturnType<LogsRepo['queryAll']>): string {
  return entries.map((e) => `${e.timestamp} [${e.source.toUpperCase()}] ${e.raw}`).join('\n') + '\n'
}

function defaultExportFileName(): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  const d = new Date()
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  return `logs-export-${stamp}.txt`
}

export function registerLogHandlers(logsRepo: LogsRepo, getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IPC.LOGS_QUERY, (_event, filter: LogQueryFilter): LogQueryResult => logsRepo.query(filter))

  ipcMain.handle(IPC.LOGS_EXPORT, async (_event, filter: LogExportFilter): Promise<LogExportResult> => {
    const window = getWindow()
    const dialogOptions = {
      title: 'Export logs',
      defaultPath: defaultExportFileName(),
      filters: [{ name: 'Text files', extensions: ['txt'] }]
    }
    const { canceled, filePath } = window
      ? await dialog.showSaveDialog(window, dialogOptions)
      : await dialog.showSaveDialog(dialogOptions)

    if (canceled || !filePath) return { canceled: true }

    const entries = logsRepo.queryAll(filter)
    await writeFile(filePath, formatEntriesForExport(entries), 'utf-8')
    return { canceled: false, filePath, count: entries.length }
  })

  ipcMain.handle(IPC.LOGS_CLEAR_ALL, (): ClearLogsResult => {
    const deletedCount = logsRepo.clearAll()
    const event: LogsClearedEvent = { olderThanIso: null }
    getWindow()?.webContents.send(IPC.LOGS_CLEARED, event)
    return { deletedCount }
  })

  ipcMain.handle(IPC.LOGS_CLEAR_OLDER_THAN, (_event, days: number): ClearLogsResult => {
    const deletedCount = logsRepo.clearOlderThan(days)
    const event: LogsClearedEvent = { olderThanIso: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString() }
    getWindow()?.webContents.send(IPC.LOGS_CLEARED, event)
    return { deletedCount }
  })
}
