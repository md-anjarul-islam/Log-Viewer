import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export interface LastSerialDevice {
  path: string
  baudRate: number
  delimiterHex: string
}

export interface SerialSettings {
  autoReconnect: boolean
  lastDevice: LastSerialDevice | null
  // How long an incoming line can still be attributed to the run that
  // triggered it (see LogIngestor). Only meaningful for the 'main' channel,
  // which is the command/response link LogIngestor watches, but lives here
  // alongside the other per-channel connection settings.
  correlationWindowMs: number
}

// 'main' is the primary command/response link; 'debug' is an optional,
// independent secondary link to the same hardware (e.g. a debug UART) whose
// unsolicited lines are stored separately. Each is a fully separate
// connection with its own remembered device and auto-reconnect preference.
export type SerialChannel = 'main' | 'debug'

interface StoredSettings {
  main: SerialSettings
  debug: SerialSettings
}

const DEFAULT_CORRELATION_WINDOW_MS = 2000
export const MIN_CORRELATION_WINDOW_MS = 100
export const MAX_CORRELATION_WINDOW_MS = 60000

const DEFAULT_SERIAL_SETTINGS: SerialSettings = {
  autoReconnect: false,
  lastDevice: null,
  correlationWindowMs: DEFAULT_CORRELATION_WINDOW_MS
}

function clampCorrelationWindowMs(ms: number): number {
  if (!Number.isFinite(ms)) return DEFAULT_CORRELATION_WINDOW_MS
  return Math.min(MAX_CORRELATION_WINDOW_MS, Math.max(MIN_CORRELATION_WINDOW_MS, Math.round(ms)))
}

// Small JSON-file-backed store for app preferences that aren't really "data"
// (nothing here needs querying or relations), so it stays separate from the
// SQLite database. File path resolution is deferred to first use since
// app.getPath() requires the app to be ready, while this class may be
// constructed earlier at module load time.
export class SettingsStore {
  private filePath: string | null = null
  private settings: StoredSettings | null = null

  private load(): StoredSettings {
    if (this.filePath === null) {
      this.filePath = join(app.getPath('userData'), 'settings.json')
    }
    try {
      if (existsSync(this.filePath)) {
        const raw = JSON.parse(readFileSync(this.filePath, 'utf-8'))
        // Pre-debug-connection settings files stored the main channel's
        // fields flat at the top level; treat that shape as 'main'.
        const legacyMain = raw.main == null && raw.debug == null ? raw : null
        return {
          main: { ...DEFAULT_SERIAL_SETTINGS, ...(legacyMain ?? raw.main) },
          debug: { ...DEFAULT_SERIAL_SETTINGS, ...raw.debug }
        }
      }
    } catch {
      // Corrupt or unreadable settings file; fall back to defaults.
    }
    return { main: { ...DEFAULT_SERIAL_SETTINGS }, debug: { ...DEFAULT_SERIAL_SETTINGS } }
  }

  private ensureLoaded(): StoredSettings {
    if (this.settings === null) {
      this.settings = this.load()
    }
    return this.settings
  }

  private persist(): void {
    writeFileSync(this.filePath!, JSON.stringify(this.settings, null, 2))
  }

  getSerialSettings(channel: SerialChannel): SerialSettings {
    return this.ensureLoaded()[channel]
  }

  setAutoReconnect(channel: SerialChannel, enabled: boolean): void {
    this.ensureLoaded()[channel].autoReconnect = enabled
    this.persist()
  }

  setLastDevice(channel: SerialChannel, device: LastSerialDevice | null): void {
    this.ensureLoaded()[channel].lastDevice = device
    this.persist()
  }

  getCorrelationWindowMs(channel: SerialChannel): number {
    return this.ensureLoaded()[channel].correlationWindowMs
  }

  setCorrelationWindowMs(channel: SerialChannel, windowMs: number): number {
    const clamped = clampCorrelationWindowMs(windowMs)
    this.ensureLoaded()[channel].correlationWindowMs = clamped
    this.persist()
    return clamped
  }
}
