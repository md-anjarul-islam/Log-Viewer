import type Database from 'better-sqlite3'
import type { LogEntry, LogFormat, LogSource } from '@shared/types'

interface LogRow {
  id: number
  command_id: number | null
  run_id: string | null
  timestamp: string
  format: string
  raw: string
  parsed: string | null
  source: string
}

function toLogEntry(row: LogRow): LogEntry {
  return {
    id: row.id,
    commandId: row.command_id,
    runId: row.run_id,
    timestamp: row.timestamp,
    format: row.format as LogFormat,
    raw: row.raw,
    parsed: row.parsed,
    source: row.source as LogSource
  }
}

export interface InsertLogInput {
  commandId: number | null
  runId: string | null
  timestamp: string
  format: LogFormat
  raw: string
  parsed: string | null
  source: LogSource
}

export class LogsRepo {
  constructor(private db: Database.Database) {}

  insert(input: InsertLogInput): LogEntry {
    const result = this.db
      .prepare(
        `INSERT INTO logs (command_id, run_id, timestamp, format, raw, parsed, source)
         VALUES (@commandId, @runId, @timestamp, @format, @raw, @parsed, @source)`
      )
      .run(input)
    const row = this.db
      .prepare<[number], LogRow>('SELECT * FROM logs WHERE id = ?')
      .get(result.lastInsertRowid as number)
    return toLogEntry(row as LogRow)
  }
}
