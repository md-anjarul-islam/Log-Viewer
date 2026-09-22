import type Database from 'better-sqlite3'
import type { Command, CommandInput } from '@shared/types'

interface CommandRow {
  id: number
  name: string
  command_string: string
  enabled: number
  schedule_interval_ms: number | null
  category_id: number | null
  created_at: string
  updated_at: string
}

function toCommand(row: CommandRow): Command {
  return {
    id: row.id,
    name: row.name,
    commandString: row.command_string,
    enabled: row.enabled === 1,
    scheduleIntervalMs: row.schedule_interval_ms,
    categoryId: row.category_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export class CommandsRepo {
  constructor(private db: Database.Database) {}

  list(): Command[] {
    const rows = this.db
      .prepare<[], CommandRow>('SELECT * FROM commands ORDER BY created_at ASC')
      .all()
    return rows.map(toCommand)
  }

  get(id: number): Command | undefined {
    const row = this.db
      .prepare<[number], CommandRow>('SELECT * FROM commands WHERE id = ?')
      .get(id)
    return row ? toCommand(row) : undefined
  }

  create(input: CommandInput): Command {
    const result = this.db
      .prepare(
        `INSERT INTO commands (name, command_string, enabled, schedule_interval_ms, category_id)
         VALUES (@name, @commandString, @enabled, @scheduleIntervalMs, @categoryId)`
      )
      .run({
        name: input.name,
        commandString: input.commandString,
        enabled: input.enabled ? 1 : 0,
        scheduleIntervalMs: input.scheduleIntervalMs,
        categoryId: input.categoryId
      })
    return this.get(result.lastInsertRowid as number) as Command
  }

  update(id: number, patch: Partial<CommandInput>): Command {
    const existing = this.get(id)
    if (!existing) {
      throw new Error(`Command ${id} not found`)
    }
    const merged: CommandInput = {
      name: patch.name ?? existing.name,
      commandString: patch.commandString ?? existing.commandString,
      enabled: patch.enabled ?? existing.enabled,
      scheduleIntervalMs:
        patch.scheduleIntervalMs !== undefined ? patch.scheduleIntervalMs : existing.scheduleIntervalMs,
      categoryId: patch.categoryId !== undefined ? patch.categoryId : existing.categoryId
    }
    this.db
      .prepare(
        `UPDATE commands
         SET name = @name,
             command_string = @commandString,
             enabled = @enabled,
             schedule_interval_ms = @scheduleIntervalMs,
             category_id = @categoryId,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
         WHERE id = @id`
      )
      .run({
        id,
        name: merged.name,
        commandString: merged.commandString,
        enabled: merged.enabled ? 1 : 0,
        scheduleIntervalMs: merged.scheduleIntervalMs,
        categoryId: merged.categoryId
      })
    return this.get(id) as Command
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM commands WHERE id = ?').run(id)
  }
}
