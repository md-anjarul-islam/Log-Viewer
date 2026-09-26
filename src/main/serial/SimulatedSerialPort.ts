import { Duplex } from 'stream'

const RESPONSE_DELAY_MS = 150
const DEFAULT_DELIMITER_HEX = '04'

function resolveDelimiterBuffer(delimiterHex: string | undefined): Buffer {
  if (delimiterHex && /^([0-9a-fA-F]{2})+$/.test(delimiterHex)) {
    return Buffer.from(delimiterHex, 'hex')
  }
  return Buffer.from(DEFAULT_DELIMITER_HEX, 'hex')
}

interface SimulatedSerialPortOptions {
  path: string
  delimiterHex?: string
}

// Stands in for a real `SerialPort` when the user selects the built-in
// simulator from the port picker. Implements just the surface SerialManager
// touches (open/close, isOpen, path, write, and the Readable side) so
// `.pipe(new ReadlineParser(...))` behaves exactly as it does against real
// hardware: raw bytes in, delimiter-framed, hex-encoded out by the parser.
export class SimulatedSerialPort extends Duplex {
  readonly path: string
  isOpen = false

  private delimiter: Buffer

  constructor(options: SimulatedSerialPortOptions) {
    super({ emitClose: false })
    this.path = options.path
    this.delimiter = resolveDelimiterBuffer(options.delimiterHex)
  }

  open(callback?: (error?: Error | null) => void): void {
    this.isOpen = true
    process.nextTick(() => callback?.(null))
  }

  close(callback?: (error?: Error | null) => void): void {
    this.isOpen = false
    process.nextTick(() => {
      callback?.(null)
      this.emit('close')
    })
  }

  _read(): void {
    // No-op: data is pushed asynchronously by the write-echo below, not
    // pulled on demand.
  }

  _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    callback()
    // Loop the exact bytes written back as a received line shortly after,
    // so sending a command and seeing it reflected in the log view confirms
    // the write path reaches the "device" and the read path decodes it back
    // correctly — a real end-to-end check rather than a canned ack.
    setTimeout(() => this.push(Buffer.concat([chunk, this.delimiter])), RESPONSE_DELAY_MS)
  }
}
