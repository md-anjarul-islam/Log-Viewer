import { EventEmitter } from 'events'
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import type { SerialPortInfo, SerialStatus } from '@shared/types'

// Emits 'line' (string) and 'status-change' (SerialStatus).
// Owns a single serial connection at a time. Never auto-reconnects on an
// unexpected close/error — surfaces the status change and leaves reconnection
// to an explicit user action, since silently retrying against half-connected
// hardware can spam the device.
export class SerialManager extends EventEmitter {
  private port: SerialPort | null = null

  async listPorts(): Promise<SerialPortInfo[]> {
    const ports = await SerialPort.list()
    return ports.map((p) => ({
      path: p.path,
      manufacturer: p.manufacturer,
      vendorId: p.vendorId,
      productId: p.productId
    }))
  }

  connect(path: string, baudRate: number): Promise<void> {
    if (this.port?.isOpen) {
      throw new Error('Already connected; disconnect first')
    }

    return new Promise((resolve, reject) => {
      const port = new SerialPort({ path, baudRate, autoOpen: false })

      port.open((err) => {
        if (err) {
          reject(err)
          return
        }

        this.port = port
        const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))
        parser.on('data', (line: string) => this.emit('line', line))

        port.on('close', () => {
          this.port = null
          this.emit('status-change', { connected: false })
        })
        port.on('error', (portErr: Error) => {
          this.emit('status-change', { connected: false, path, error: portErr.message })
        })

        this.emit('status-change', { connected: true, path })
        resolve()
      })
    })
  }

  disconnect(): Promise<void> {
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
      this.port!.write(`${data}\n`, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  getStatus(): SerialStatus {
    return this.port?.isOpen ? { connected: true, path: this.port.path } : { connected: false }
  }
}
