import { Duplex } from 'stream'
import type { SerialChannel } from '../settings/SettingsStore'
import { buildCommandResponse, shouldDropResponse } from './simulation/commandResponses'
import { DebugLogGenerator } from './simulation/debugLogGenerator'
import { jitterMs } from './simulation/random'

const RESPONSE_DELAY_MS = 150
const RESPONSE_LINE_STAGGER_MS = 60
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
  // Which connection this stands in for. 'main' answers writes with
  // realistic canned command responses (see ./simulation/commandResponses);
  // 'debug' ignores writes entirely and instead free-runs a plausible
  // firmware debug log (see ./simulation/debugLogGenerator), since a real
  // debug UART is unsolicited output, not a command/response link.
  channel?: SerialChannel
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
  private channel: SerialChannel
  private debugLog: DebugLogGenerator | null = null

  constructor(options: SimulatedSerialPortOptions) {
    super({ emitClose: false })
    this.path = options.path
    this.delimiter = resolveDelimiterBuffer(options.delimiterHex)
    this.channel = options.channel ?? 'main'
  }

  open(callback?: (error?: Error | null) => void): void {
    this.isOpen = true
    if (this.channel === 'debug') {
      this.debugLog = new DebugLogGenerator((line) => this.pushRecord(line))
      this.debugLog.start()
    }
    process.nextTick(() => callback?.(null))
  }

  close(callback?: (error?: Error | null) => void): void {
    this.isOpen = false
    this.debugLog?.stop()
    this.debugLog = null
    process.nextTick(() => {
      callback?.(null)
      this.emit('close')
    })
  }

  _read(): void {
    // No-op: data is pushed asynchronously (debug log ticks, or a command
    // response), not pulled on demand.
  }

  _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    callback()
    if (this.channel === 'debug') {
      // The debug UART is passive from the app's side; nothing is ever
      // written to it in practice (see DebugLogIngestor), but ignore
      // writes rather than answering them, to match real hardware.
      return
    }
    this.respondToCommand(chunk)
  }

  private pushRecord(text: string): void {
    this.push(Buffer.concat([Buffer.from(text, 'utf8'), this.delimiter]))
  }

  private respondToCommand(chunk: Buffer): void {
    if (shouldDropResponse()) return

    const response = buildCommandResponse(chunk.toString('utf8'))
    if (!response) {
      // Unrecognized command: loop the exact bytes back as a received line,
      // so sending a command and seeing it reflected in the log view still
      // confirms the write and read paths reach the "device" and back.
      setTimeout(() => this.push(Buffer.concat([chunk, this.delimiter])), RESPONSE_DELAY_MS)
      return
    }

    let cumulativeDelay = response.delayMs
    for (const line of response.lines) {
      setTimeout(() => this.pushRecord(line), cumulativeDelay)
      cumulativeDelay += jitterMs(RESPONSE_LINE_STAGGER_MS / 2, RESPONSE_LINE_STAGGER_MS * 1.5)
    }
  }
}
