import type Database from 'better-sqlite3'
import type { LogEntry, LogFormat, LogQueryFilter, LogQueryResult, LogSource } from '@shared/types'

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

  // Keyset-paginated, most-recent-first: each page's `nextCursor` is the
  // oldest id in that page, so the next call (passing it as `cursor`) walks
  // further into the past without the drift/skip issues of offset paging.
  query(filter: LogQueryFilter): LogQueryResult {
    const conditions: string[] = []
    const params: Record<string, unknown> = { limit: filter.limit }

    if (filter.commandId != null) {
      conditions.push('command_id = @commandId')
      params.commandId = filter.commandId
    }
    if (filter.format) {
      conditions.push('format = @format')
      params.format = filter.format
    }
    if (filter.from) {
      conditions.push('timestamp >= @from')
      params.from = filter.from
    }
    if (filter.to) {
      conditions.push('timestamp <= @to')
      params.to = filter.to
    }
    if (filter.cursor) {
      conditions.push('id < @cursor')
      params.cursor = Number(filter.cursor)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const rows = this.db
      .prepare<
        Record<string, unknown>,
        LogRow
      >(`SELECT * FROM logs ${where} ORDER BY id DESC LIMIT @limit`)
      .all(params)

    const entries = rows.map(toLogEntry)
    const nextCursor = entries.length === filter.limit ? String(entries[entries.length - 1].id) : null

    // Reverse to chronological order for display (oldest first, like the live tail).
    return { entries: entries.reverse(), nextCursor }
  }

  clearAll(): number {
    return this.db.prepare('DELETE FROM logs').run().changes
  }

  clearOlderThan(days: number): number {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    return this.db.prepare('DELETE FROM logs WHERE timestamp < ?').run(cutoff).changes
  }
}
