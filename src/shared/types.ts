export interface Command {
  id: number
  name: string
  commandString: string
  enabled: boolean
  scheduleIntervalMs: number | null
  categoryId: number | null
  createdAt: string
  updatedAt: string
}

export interface CommandInput {
  name: string
  commandString: string
  enabled: boolean
  scheduleIntervalMs: number | null
  categoryId: number | null
}

export interface Category {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

export interface CategoryInput {
  name: string
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
  reconnecting?: boolean
}

export interface LastSerialDevice {
  path: string
  baudRate: number
  delimiterHex: string
}

export interface AutoReconnectSettings {
  enabled: boolean
  lastDevice: LastSerialDevice | null
}

export interface RunNowResult {
  runId: string
}

export interface CommandExportResult {
  canceled: boolean
  filePath?: string
  count?: number
}

export interface CommandImportResult {
  canceled: boolean
  filePath?: string
  commandsImported?: number
  commandsSkipped?: number
  categoriesImported?: number
  categoriesSkipped?: number
  errors?: string[]
}

export type LogSource = 'manual' | 'scheduled' | 'unsolicited'

export interface LogEntry {
  id: number
  commandId: number | null
  runId: string | null
  timestamp: string
  // Hex string of the raw bytes received (e.g. "48656c6c6f"), not decoded
  // text — hardware payloads aren't assumed to be valid text in any encoding.
  raw: string
  source: LogSource
}

export interface LogQueryFilter {
  commandId?: number
  from?: string
  to?: string
  cursor?: string
  limit: number
}

export interface LogQueryResult {
  entries: LogEntry[]
  nextCursor: string | null
}

export interface LogExportFilter {
  commandId?: number
  from?: string
  to?: string
}

export interface LogExportResult {
  canceled: boolean
  filePath?: string
  count?: number
}

export interface ClearLogsResult {
  deletedCount: number
}

export interface LogsClearedEvent {
  olderThanIso: string | null
}

// Debug logs are a second, independent stream: raw bytes read off an
// optional secondary serial connection to the same hardware (e.g. a
// dedicated debug/logging UART), unrelated to command runs.
export interface DebugLogEntry {
  id: number
  timestamp: string
  raw: string
}

export interface DebugLogQueryFilter {
  from?: string
  to?: string
  cursor?: string
  limit: number
}

export interface DebugLogQueryResult {
  entries: DebugLogEntry[]
  nextCursor: string | null
}
