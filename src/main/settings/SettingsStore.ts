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
}

const DEFAULT_SETTINGS: SerialSettings = {
  autoReconnect: false,
  lastDevice: null
}

// Small JSON-file-backed store for app preferences that aren't really "data"
// (nothing here needs querying or relations), so it stays separate from the
// SQLite database. File path resolution is deferred to first use since
// app.getPath() requires the app to be ready, while this class may be
// constructed earlier at module load time.
export class SettingsStore {
  private filePath: string | null = null
  private settings: SerialSettings | null = null

  private load(): SerialSettings {
    if (this.filePath === null) {
      this.filePath = join(app.getPath('userData'), 'settings.json')
    }
    try {
      if (existsSync(this.filePath)) {
        const raw = JSON.parse(readFileSync(this.filePath, 'utf-8'))
        return { ...DEFAULT_SETTINGS, ...raw }
      }
    } catch {
      // Corrupt or unreadable settings file; fall back to defaults.
    }
    return { ...DEFAULT_SETTINGS }
  }

  private ensureLoaded(): SerialSettings {
    if (this.settings === null) {
      this.settings = this.load()
    }
    return this.settings
  }

  private persist(): void {
    writeFileSync(this.filePath!, JSON.stringify(this.settings, null, 2))
  }

  getSerialSettings(): SerialSettings {
    return this.ensureLoaded()
  }

  setAutoReconnect(enabled: boolean): void {
    this.ensureLoaded().autoReconnect = enabled
    this.persist()
  }

  setLastDevice(device: LastSerialDevice | null): void {
    this.ensureLoaded().lastDevice = device
    this.persist()
  }
}
