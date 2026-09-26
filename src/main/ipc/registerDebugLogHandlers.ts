import { ipcMain, type BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type {
  ClearLogsResult,
  DebugLogEntry,
  DebugLogQueryFilter,
  DebugLogQueryResult,
  DebugLogWindowQuery,
  LogsClearedEvent
} from '@shared/types'
import type { DebugLogsRepo } from '../db/debugLogsRepo'

export function registerDebugLogHandlers(
  debugLogsRepo: DebugLogsRepo,
  getWindow: () => BrowserWindow | null
): void {
  ipcMain.handle(
    IPC.DEBUG_LOGS_QUERY,
    (_event, filter: DebugLogQueryFilter): DebugLogQueryResult => debugLogsRepo.query(filter)
  )

  ipcMain.handle(
    IPC.DEBUG_LOGS_QUERY_AROUND,
    (_event, query: DebugLogWindowQuery): DebugLogEntry[] =>
      debugLogsRepo.queryAroundTimestamp(query.centerTimestamp, query.windowMs)
  )

  ipcMain.handle(IPC.DEBUG_LOGS_CLEAR_ALL, (): ClearLogsResult => {
    const deletedCount = debugLogsRepo.clearAll()
    const event: LogsClearedEvent = { olderThanIso: null }
    getWindow()?.webContents.send(IPC.DEBUG_LOGS_CLEARED, event)
    return { deletedCount }
  })

  ipcMain.handle(IPC.DEBUG_LOGS_CLEAR_OLDER_THAN, (_event, days: number): ClearLogsResult => {
    const deletedCount = debugLogsRepo.clearOlderThan(days)
    const event: LogsClearedEvent = {
      olderThanIso: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    }
    getWindow()?.webContents.send(IPC.DEBUG_LOGS_CLEARED, event)
    return { deletedCount }
  })
}
