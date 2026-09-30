import type Database from 'better-sqlite3'
import type {
  DebugLogEntry,
  DebugLogQueryFilter,
  DebugLogQueryResult,
  DebugLogWindowResult
} from '@shared/types'

// Cap on how many rows a single correlation window can return, so a
// pathologically large windowMs (or a busy debug stream) can't pull the
// whole table into memory in one query.
const MAX_WINDOW_ENTRIES = 2000

interface DebugLogRow {
  id: number
  timestamp: string
  raw: string
}

function toDebugLogEntry(row: DebugLogRow): DebugLogEntry {
  return { id: row.id, timestamp: row.timestamp, raw: row.raw }
}

export interface InsertDebugLogInput {
  timestamp: string
  raw: string
}

// Mirrors LogsRepo's shape but for the debug connection's stream: no
// command/run correlation exists there, so rows are just timestamped bytes.
export class DebugLogsRepo {
  constructor(private db: Database.Database) {}

  insert(input: InsertDebugLogInput): DebugLogEntry {
    const result = this.db
      .prepare('INSERT INTO debug_logs (timestamp, raw) VALUES (@timestamp, @raw)')
      .run(input)
    const row = this.db
      .prepare<[number], DebugLogRow>('SELECT * FROM debug_logs WHERE id = ?')
      .get(result.lastInsertRowid as number)
    return toDebugLogEntry(row as DebugLogRow)
  }

  // Keyset-paginated, most-recent-first — see LogsRepo.query for the same scheme.
  query(filter: DebugLogQueryFilter): DebugLogQueryResult {
    const conditions: string[] = []
    const params: Record<string, unknown> = { limit: filter.limit }

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
        DebugLogRow
      >(`SELECT * FROM debug_logs ${where} ORDER BY id DESC LIMIT @limit`)
      .all(params)

    const entries = rows.map(toDebugLogEntry)
    const nextCursor = entries.length === filter.limit ? String(entries[entries.length - 1].id) : null

    return { entries: entries.reverse(), nextCursor }
  }

  // Debug-log entries within windowMs of centerTimestamp, on either side,
  // in chronological order. Both streams are timestamped with the same
  // process's `Date.toISOString()` (UTC), so we go through Date rather than
  // comparing strings directly — that stays correct even if a caller passes
  // a timestamp in a different but Date-parseable format/offset.
  //
  // Each side is capped separately and read outward from the center, so when
  // the window holds more than MAX_WINDOW_ENTRIES rows it's the ones farthest
  // from centerTimestamp that get dropped, never the ones right around it.
  queryAroundTimestamp(centerTimestamp: string, windowMs: number): DebugLogWindowResult {
    const centerMs = new Date(centerTimestamp).getTime()
    const from = new Date(centerMs - windowMs).toISOString()
    const center = new Date(centerMs).toISOString()
    const to = new Date(centerMs + windowMs).toISOString()
    const perSide = MAX_WINDOW_ENTRIES / 2

    // One extra row per side tells us whether that side was cut off.
    const before = this.db
      .prepare<
        [string, string, number],
        DebugLogRow
      >('SELECT * FROM debug_logs WHERE timestamp >= ? AND timestamp < ? ORDER BY timestamp DESC, id DESC LIMIT ?')
      .all(from, center, perSide + 1)
    const after = this.db
      .prepare<
        [string, string, number],
        DebugLogRow
      >('SELECT * FROM debug_logs WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC, id ASC LIMIT ?')
      .all(center, to, perSide + 1)

    const truncated = before.length > perSide || after.length > perSide
    const rows = before.slice(0, perSide).reverse().concat(after.slice(0, perSide))
    return { entries: rows.map(toDebugLogEntry), truncated }
  }

  clearAll(): number {
    return this.db.prepare('DELETE FROM debug_logs').run().changes
  }

  clearOlderThan(days: number): number {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    return this.db.prepare('DELETE FROM debug_logs WHERE timestamp < ?').run(cutoff).changes
  }
}
