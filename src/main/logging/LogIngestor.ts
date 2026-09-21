import { randomUUID } from 'crypto'
import type { BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { LogSource } from '@shared/types'
import type { LogsRepo } from '../db/logsRepo'
import type { SerialManager } from '../serial/SerialManager'

// How long an incoming line can still be attributed to the run that
// triggered it. A v1 simplification: hardware without a clear
// request/response boundary (or with responses slower than this window)
// will need a per-command correlation rule down the line.
const CORRELATION_WINDOW_MS = 2000

interface PendingRun {
  runId: string
  commandId: number
  source: LogSource
}

export class LogIngestor {
  private pendingRun: PendingRun | null = null
  private pendingRunTimer: NodeJS.Timeout | null = null

  constructor(
    serialManager: SerialManager,
    private logsRepo: LogsRepo,
    private getWindow: () => BrowserWindow | null
  ) {
    serialManager.on('line', (raw: string) => this.handleLine(raw))
  }

  // Called right before a command is written to the serial port (manual or
  // scheduled) so subsequent lines can be attributed to this run.
  beginRun(commandId: number, source: 'manual' | 'scheduled'): string {
    const runId = randomUUID()
    this.pendingRun = { runId, commandId, source }
    if (this.pendingRunTimer) clearTimeout(this.pendingRunTimer)
    this.pendingRunTimer = setTimeout(() => {
      this.pendingRun = null
    }, CORRELATION_WINDOW_MS)
    return runId
  }

  private handleLine(raw: string): void {
    let format: 'text' | 'json' = 'text'
    let parsed: string | null = null
    try {
      parsed = JSON.stringify(JSON.parse(raw))
      format = 'json'
    } catch {
      // Not JSON; keep as plain text.
    }

    const run = this.pendingRun
    const entry = this.logsRepo.insert({
      commandId: run?.commandId ?? null,
      runId: run?.runId ?? null,
      timestamp: new Date().toISOString(),
      format,
      raw,
      parsed,
      source: run?.source ?? 'unsolicited'
    })

    this.getWindow()?.webContents.send(IPC.LOGS_STREAM, entry)
  }
}
