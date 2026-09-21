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

// Temporary: a raw, unpersisted line received from the serial port, used only
// for the milestone-3 proof-of-connectivity feed. Superseded by the real
// persisted LogEntry stream once LogIngestor lands.
export interface RawSerialLine {
  raw: string
  timestamp: string
}
