import { EventEmitter } from 'events'
import { randomUUID } from 'crypto'
import type { BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { LogSource } from '@shared/types'
import type { LogsRepo } from '../db/logsRepo'
import type { SerialManager } from '../serial/SerialManager'

interface PendingRun {
  runId: string
  commandId: number
  source: LogSource
  frameCount: number
}

export type RunEndReason = 'reply' | 'timeout' | 'disconnect'

// Attributes incoming frames to the command run currently in flight. Runs
// are driven by CommandQueue, which sends one command at a time: every frame
// received between beginRun() and endRun()/cancelRun() belongs to that run
// (a reply may span several delimiter-separated frames), and frames outside
// of a run are stored as 'unsolicited'. Emits 'frame' (runId | null, raw)
// after each frame has been stored so the queue can detect the end of a
// reply.
export class LogIngestor extends EventEmitter {
  private pendingRun: PendingRun | null = null

  constructor(
    serialManager: SerialManager,
    private logsRepo: LogsRepo,
    private getWindow: () => BrowserWindow | null
  ) {
    super()
    serialManager.on('line', (raw: string) => this.handleLine(raw))
  }

  // Arms attribution for a run, right before its command is written.
  beginRun(commandId: number, source: 'manual' | 'scheduled', runId: string = randomUUID()): string {
    this.pendingRun = { runId, commandId, source, frameCount: 0 }
    return runId
  }

  // Closes a run. A run that ended without a single frame gets an empty-raw
  // marker entry (real frames always contain at least the delimiter, so
  // raw === '' unambiguously means "no response") so the gap is visible in
  // the log. Frames that arrive afterwards are 'unsolicited', never
  // attributed to the next command.
  endRun(runId: string, reason: RunEndReason): void {
    const run = this.pendingRun
    if (!run || run.runId !== runId) return
    this.pendingRun = null
    if (run.frameCount === 0 && reason !== 'disconnect') {
      this.store(run, '')
    }
  }

  // Drops a run without recording anything (the command was never sent).
  cancelRun(runId: string): void {
    if (this.pendingRun?.runId === runId) this.pendingRun = null
  }

  private handleLine(raw: string): void {
    const run = this.pendingRun
    if (run) run.frameCount++
    this.store(run, raw)
    this.emit('frame', run?.runId ?? null, raw)
  }

  private store(run: PendingRun | null, raw: string): void {
    const entry = this.logsRepo.insert({
      commandId: run?.commandId ?? null,
      runId: run?.runId ?? null,
      timestamp: new Date().toISOString(),
      raw,
      source: run?.source ?? 'unsolicited'
    })

    this.getWindow()?.webContents.send(IPC.LOGS_STREAM, entry)
  }
}
