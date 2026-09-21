import type { Command } from '@shared/types'

type TriggerFn = (command: Command, source: 'scheduled') => void

// Map<commandId, Timeout> kept in sync with the DB via syncWithCommand, which
// every commands create/update/delete/toggle must call — this is the single
// choke point that keeps live timers matching DB state, so a disabled or
// deleted command can never leave a stale interval running.
export class Scheduler {
  private timers = new Map<number, NodeJS.Timeout>()

  constructor(private onTrigger: TriggerFn) {}

  syncWithCommand(command: Command): void {
    this.clearTimer(command.id)
    if (command.enabled && command.scheduleIntervalMs != null) {
      const timer = setInterval(() => this.onTrigger(command, 'scheduled'), command.scheduleIntervalMs)
      this.timers.set(command.id, timer)
    }
  }

  removeCommand(commandId: number): void {
    this.clearTimer(commandId)
  }

  stopAll(): void {
    for (const timer of this.timers.values()) clearInterval(timer)
    this.timers.clear()
  }

  private clearTimer(commandId: number): void {
    const existing = this.timers.get(commandId)
    if (existing) {
      clearInterval(existing)
      this.timers.delete(commandId)
    }
  }
}
