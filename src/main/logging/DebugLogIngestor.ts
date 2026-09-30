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
    // The parser strips the LF delimiter, but CRLF firmware still leaves a
    // trailing CR that would otherwise be stored and displayed with the line.
    const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw
    const entry = this.debugLogsRepo.insert({ timestamp: new Date().toISOString(), raw: line })
    this.getWindow()?.webContents.send(IPC.DEBUG_LOGS_STREAM, entry)
  }
}
