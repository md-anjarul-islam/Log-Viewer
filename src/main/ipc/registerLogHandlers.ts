import { ipcMain, type BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { ClearLogsResult, LogQueryFilter, LogQueryResult, LogsClearedEvent } from '@shared/types'
import type { LogsRepo } from '../db/logsRepo'

export function registerLogHandlers(logsRepo: LogsRepo, getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IPC.LOGS_QUERY, (_event, filter: LogQueryFilter): LogQueryResult => logsRepo.query(filter))

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
