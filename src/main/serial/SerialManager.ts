import { EventEmitter } from 'events'
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import type { AutoReconnectSettings, SerialPortInfo, SerialStatus } from '@shared/types'
import type { SettingsStore } from '../settings/SettingsStore'

const RECONNECT_POLL_INTERVAL_MS = 3000

// Falls back to EOT (0x04) — the delimiter our supported hardware actually
// frames records with — whenever a caller omits it or supplies invalid hex.
const DEFAULT_DELIMITER_HEX = '04'

function resolveDelimiter(delimiterHex: string | undefined): Buffer {
  if (delimiterHex && /^([0-9a-fA-F]{2})+$/.test(delimiterHex)) {
    return Buffer.from(delimiterHex, 'hex')
  }
  return Buffer.from(DEFAULT_DELIMITER_HEX, 'hex')
}

// Emits 'line' (string) and 'status-change' (SerialStatus).
// Owns a single serial connection at a time. A close/error from the port
// itself never retries on its own; it only starts polling for the
// remembered device to reappear when auto-reconnect is enabled AND the
// disconnect wasn't user-initiated, so silently retrying against
// half-connected hardware after an explicit user disconnect never happens.
export class SerialManager extends EventEmitter {
  private port: SerialPort | null = null
  private manualDisconnect = false
  private reconnecting = false
  private reconnectTimer: ReturnType<typeof setInterval> | null = null

  constructor(private settings: SettingsStore) {
    super()
  }

  async listPorts(): Promise<SerialPortInfo[]> {
    const ports = await SerialPort.list()
    return ports.map((p) => ({
      path: p.path,
      manufacturer: p.manufacturer,
      vendorId: p.vendorId,
      productId: p.productId
    }))
  }

  connect(path: string, baudRate: number, delimiterHex: string): Promise<void> {
    if (this.port?.isOpen) {
      throw new Error('Already connected; disconnect first')
    }
    this.manualDisconnect = false
    this.stopReconnectLoop()
    return this.open(path, baudRate, delimiterHex)
  }

  private open(path: string, baudRate: number, delimiterHex: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const port = new SerialPort({ path, baudRate, autoOpen: false })

      port.open((err) => {
        if (err) {
          reject(err)
          return
        }

        this.port = port
        this.settings.setLastDevice({ path, baudRate, delimiterHex })
        const parser = port.pipe(new ReadlineParser({ delimiter: resolveDelimiter(delimiterHex) }))
        parser.on('data', (line: string) => this.emit('line', line))

        port.on('close', () => {
          this.port = null
          this.emit('status-change', this.buildStatus(false))
          if (!this.manualDisconnect && this.settings.getSerialSettings().autoReconnect) {
            this.startReconnectLoop(path, baudRate, delimiterHex)
          }
        })
        port.on('error', (portErr: Error) => {
          this.emit('status-change', this.buildStatus(false, path, portErr.message))
        })

        this.emit('status-change', this.buildStatus(true, path))
        resolve()
      })
    })
  }

  disconnect(): Promise<void> {
    this.manualDisconnect = true
    this.stopReconnectLoop()
    if (!this.port?.isOpen) {
      this.port = null
      return Promise.resolve()
    }
    return new Promise((resolve, reject) => {
      this.port!.close((err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  write(data: string): Promise<void> {
    if (!this.port?.isOpen) {
      return Promise.reject(new Error('Serial port not connected'))
    }
    return new Promise((resolve, reject) => {
      const buffer = Buffer.from(data, 'hex')
      this.port!.write(buffer, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  getStatus(): SerialStatus {
    if (this.port?.isOpen) {
      return { connected: true, path: this.port.path }
    }
    return this.buildStatus(false)
  }

  getAutoReconnect(): AutoReconnectSettings {
    const s = this.settings.getSerialSettings()
    return { enabled: s.autoReconnect, lastDevice: s.lastDevice }
  }

  setAutoReconnect(enabled: boolean): AutoReconnectSettings {
    this.settings.setAutoReconnect(enabled)
    if (!enabled) {
      this.stopReconnectLoop()
    } else {
      this.tryStartReconnectIfEligible()
    }
    return this.getAutoReconnect()
  }

  // Called once at app startup so a remembered device is picked back up
  // without needing a live disconnect event to trigger the loop first.
  tryStartReconnectIfEligible(): void {
    if (this.port?.isOpen || this.reconnecting) return
    const { autoReconnect, lastDevice } = this.settings.getSerialSettings()
    if (!autoReconnect || !lastDevice) return
    this.manualDisconnect = false
    this.startReconnectLoop(lastDevice.path, lastDevice.baudRate, lastDevice.delimiterHex)
  }

  private startReconnectLoop(path: string, baudRate: number, delimiterHex: string): void {
    if (this.reconnecting) return
    this.reconnecting = true
    this.emit('status-change', this.buildStatus(false))

    const attempt = async (): Promise<void> => {
      if (!this.reconnecting) return
      const available = await this.listPorts()
      if (!available.some((p) => p.path === path)) return
      try {
        await this.open(path, baudRate, delimiterHex)
        this.clearReconnectState()
      } catch {
        // Port is enumerated but not yet openable (still settling after
        // being plugged in); keep polling on the next tick.
      }
    }

    this.reconnectTimer = setInterval(() => attempt(), RECONNECT_POLL_INTERVAL_MS)
    attempt()
  }

  // Resets the loop's own bookkeeping without emitting a status-change.
  // Used when the reconnect attempt just succeeded, so the 'connected: true'
  // status already emitted by open() isn't immediately clobbered by a
  // trailing 'connected: false' from here.
  private clearReconnectState(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.reconnecting = false
  }

  // Cancels an in-progress reconnect loop (auto-reconnect disabled, or the
  // user cancelled it) and notifies listeners that it's no longer trying.
  private stopReconnectLoop(): void {
    const wasReconnecting = this.reconnecting
    this.clearReconnectState()
    if (wasReconnecting) {
      this.emit('status-change', this.buildStatus(false))
    }
  }

  private buildStatus(connected: true, path?: string): SerialStatus
  private buildStatus(connected: false, path?: string, error?: string): SerialStatus
  private buildStatus(connected: boolean, path?: string, error?: string): SerialStatus {
    if (connected) return { connected: true, path }
    return { connected: false, path, error, reconnecting: this.reconnecting }
  }
}
