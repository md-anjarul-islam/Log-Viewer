export interface Command {
  id: number
  name: string
  commandString: string
  enabled: boolean
  scheduleIntervalMs: number | null
  createdAt: string
  updatedAt: string
}

export interface CommandInput {
  name: string
  commandString: string
  enabled: boolean
  scheduleIntervalMs: number | null
}

export interface SerialPortInfo {
  path: string
  manufacturer?: string
  vendorId?: string
  productId?: string
}

export interface SerialStatus {
  connected: boolean
  path?: string
  error?: string
}

export interface RunNowResult {
  runId: string
}

export type LogFormat = 'text' | 'json'
export type LogSource = 'manual' | 'scheduled' | 'unsolicited'

export interface LogEntry {
  id: number
  commandId: number | null
  runId: string | null
  timestamp: string
  format: LogFormat
  raw: string
  parsed: string | null
  source: LogSource
}

export interface LogQueryFilter {
  commandId?: number
  format?: LogFormat
  from?: string
  to?: string
  cursor?: string
  limit: number
}

export interface LogQueryResult {
  entries: LogEntry[]
  nextCursor: string | null
}

export interface ClearLogsResult {
  deletedCount: number
}

export interface LogsClearedEvent {
  olderThanIso: string | null
}
