import { randomUUID } from 'crypto'
import type { Command } from '@shared/types'
import { IDLE_GAP_MS_DEFAULT } from '@shared/constants'
import type { LogIngestor, RunEndReason } from '../logging/LogIngestor'
import type { SerialManager } from './SerialManager'

const MAX_QUEUE_LENGTH = 50

interface QueuedRun {
  command: Command
  source: 'manual' | 'scheduled'
  runId: string
}

interface ActiveRun extends QueuedRun {
  frameCount: number
  terminator: RegExp | null
  timeoutTimer: NodeJS.Timeout
  idleTimer: NodeJS.Timeout | null
  idleGapMs: number
}

function compileTerminator(pattern: string | null): RegExp | null {
  if (!pattern) return null
  try {
    return new RegExp(pattern)
  } catch {
    return null
  }
}

// Sends commands strictly one at a time. A run starts when its command is
// written and ends on the first of: the command's terminator pattern
// matching a received frame, no further frame arriving within the idle gap
// (once at least one frame has arrived), or the hard timeout. Only then is
// the next queued command sent, so every frame received while a run is in
// flight belongs to it, however many delimiter-separated lines the reply has.
export class CommandQueue {
  private queue: QueuedRun[] = []
  private active: ActiveRun | null = null

  constructor(
    private serialManager: SerialManager,
    private logIngestor: LogIngestor,
    // Default per-run hard timeout, read fresh for every run.
    private getDefaultTimeoutMs: () => number
  ) {
    logIngestor.on('frame', (runId: string | null, raw: string) => this.onFrame(runId, raw))
    serialManager.on('status-change', (status: { connected: boolean }) => {
      if (!status.connected) this.clear('disconnect')
    })
  }

  // Returns the run id, or null when a scheduled tick was skipped because
  // that command already has a queued or in-flight run (no stacking).
  enqueue(command: Command, source: 'manual' | 'scheduled'): string | null {
    if (source === 'scheduled' && this.isPending(command.id)) return null
    if (this.queue.length >= MAX_QUEUE_LENGTH) {
      const dropIndex = this.queue.findIndex((r) => r.source === 'scheduled')
      if (dropIndex === -1) throw new Error('Command queue is full')
      const [dropped] = this.queue.splice(dropIndex, 1)
      console.warn(`Command queue full: dropped scheduled run of "${dropped.command.name}"`)
    }
    const runId = randomUUID()
    this.queue.push({ command, source, runId })
    this.pump()
    return runId
  }

  // Drops everything queued and abandons the in-flight run (disconnect,
  // manual disconnect, shutdown) so no stale attribution survives.
  clear(reason: RunEndReason = 'disconnect'): void {
    this.queue = []
    if (this.active) this.finish(reason)
  }

  private isPending(commandId: number): boolean {
    return this.active?.command.id === commandId || this.queue.some((r) => r.command.id === commandId)
  }

  private pump(): void {
    if (this.active) return
    const next = this.queue.shift()
    if (!next) return
    if (!this.serialManager.getStatus().connected) {
      console.warn(`Skipping run of "${next.command.name}": device not connected`)
      this.pump()
      return
    }

    const timeoutMs = next.command.timeoutMs ?? this.getDefaultTimeoutMs()
    const active: ActiveRun = {
      ...next,
      frameCount: 0,
      terminator: compileTerminator(next.command.terminatorPattern),
      idleGapMs: Math.min(next.command.idleGapMs ?? IDLE_GAP_MS_DEFAULT, timeoutMs),
      timeoutTimer: setTimeout(() => this.finish('timeout'), timeoutMs),
      idleTimer: null
    }
    this.active = active
    // Armed before the write so a reply that beats the write callback is still
    // attributed; cancelled below if the write fails.
    this.logIngestor.beginRun(next.command.id, next.source, next.runId)
    this.serialManager.write(next.command.commandString).catch((err) => {
      console.error(
        `Run of "${next.command.name}" failed:`,
        err instanceof Error ? err.message : err
      )
      if (this.active === active) {
        this.logIngestor.cancelRun(active.runId)
        this.finish(null)
      }
    })
  }

  private onFrame(runId: string | null, raw: string): void {
    const active = this.active
    if (!active || runId !== active.runId) return
    active.frameCount++
    if (active.terminator && active.terminator.test(Buffer.from(raw, 'hex').toString('latin1'))) {
      this.finish('reply')
      return
    }
    if (active.idleTimer) clearTimeout(active.idleTimer)
    active.idleTimer = setTimeout(() => this.finish('reply'), active.idleGapMs)
  }

  // `reason` null = the run was already cancelled in the ingestor (write failed).
  private finish(reason: RunEndReason | null): void {
    const active = this.active
    if (!active) return
    clearTimeout(active.timeoutTimer)
    if (active.idleTimer) clearTimeout(active.idleTimer)
    this.active = null
    if (reason) this.logIngestor.endRun(active.runId, reason)
    this.pump()
  }
}
