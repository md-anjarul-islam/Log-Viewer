import type { BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { DebugLogsRepo } from '../db/debugLogsRepo'
import type { SerialManager } from '../serial/SerialManager'

// Passively records everything the debug connection emits — unlike the main
// LogIngestor, there's no command/run to correlate lines with, so every
// line is just stored with the timestamp it arrived at.
export class DebugLogIngestor {
  constructor(
    debugSerialManager: SerialManager,
    private debugLogsRepo: DebugLogsRepo,
    private getWindow: () => BrowserWindow | null
  ) {
    debugSerialManager.on('line', (raw: string) => this.handleLine(raw))
  }

  private handleLine(raw: string): void {
    const entry = this.debugLogsRepo.insert({ timestamp: new Date().toISOString(), raw })
    this.getWindow()?.webContents.send(IPC.DEBUG_LOGS_STREAM, entry)
  }
}
