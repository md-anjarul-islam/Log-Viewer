import { chance, jitterMs, pick, pickWeighted, randomFloat, randomInt } from './random'
import type { Weighted } from './random'

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

interface LineSpec {
  level: LogLevel
  subsystem: string
  message: string
}

function formatUptime(ms: number): string {
  const total = Math.max(0, Math.floor(ms))
  const h = Math.floor(total / 3_600_000)
  const m = Math.floor((total % 3_600_000) / 60_000)
  const s = Math.floor((total % 60_000) / 1000)
  const millis = total % 1000
  const pad = (n: number, width = 2): string => String(n).padStart(width, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(millis, 3)}`
}

function formatLine(uptimeMs: number, spec: LineSpec): string {
  return `[${formatUptime(uptimeMs)}] ${spec.level.padEnd(5)} [${spec.subsystem}] ${spec.message}`
}

const WIFI_APS = ['HomeNet', 'HomeNet-5G', 'FactoryFloor-IoT', 'Lab-Bench-2G']
const DEVICE_ID = 'device-42AB'

function bootSequence(): LineSpec[] {
  const ap = pick(WIFI_APS)
  return [
    { level: 'INFO', subsystem: 'boot', message: '=== Bootloader v1.4.2 ===' },
    { level: 'INFO', subsystem: 'boot', message: 'Reset reason: power-on' },
    { level: 'DEBUG', subsystem: 'boot', message: 'Initializing clocks... OK (48MHz)' },
    { level: 'DEBUG', subsystem: 'boot', message: 'Initializing RAM... OK (512KB)' },
    { level: 'INFO', subsystem: 'boot', message: 'Loading firmware from flash partition 1' },
    { level: 'DEBUG', subsystem: 'boot', message: 'Firmware CRC OK' },
    { level: 'INFO', subsystem: 'boot', message: 'Jumping to application @0x08004000' },
    { level: 'INFO', subsystem: 'app', message: '=== FW v2.3.1-rc4 (build 2024-08-11T14:02Z) ===' },
    { level: 'DEBUG', subsystem: 'app', message: 'Subsystems: wifi, ble, sensors, power, flash' },
    { level: 'DEBUG', subsystem: 'app', message: `Heap: ${randomInt(110_000, 130_000)} bytes free` },
    { level: 'INFO', subsystem: 'wifi', message: 'Initializing radio...' },
    { level: 'DEBUG', subsystem: 'wifi', message: 'Scanning for known networks...' },
    { level: 'INFO', subsystem: 'wifi', message: `Associated with AP "${ap}" rssi=${randomInt(-70, -40)}dBm` },
    { level: 'INFO', subsystem: 'wifi', message: `DHCP lease acquired: 192.168.1.${randomInt(2, 250)}` },
    { level: 'INFO', subsystem: 'ble', message: `Advertising as "${DEVICE_ID}"` },
    { level: 'INFO', subsystem: 'sensors', message: 'Calibration complete' },
    { level: 'INFO', subsystem: 'power', message: `Battery: ${randomInt(70, 100)}% (${randomFloat(3.9, 4.2, 2)}V)` },
    { level: 'INFO', subsystem: 'app', message: 'Ready.' }
  ]
}

let loopTick = 0

const STEADY_TEMPLATES: Weighted<() => LineSpec>[] = [
  {
    weight: 18,
    value: () => ({
      level: 'DEBUG',
      subsystem: 'app',
      message: `Main loop tick #${++loopTick}, free heap=${randomInt(95_000, 128_000)}`
    })
  },
  {
    weight: 12,
    value: () => ({
      level: 'INFO',
      subsystem: 'sensors',
      message: `Reading temp=${randomFloat(19, 27)}C humidity=${randomInt(30, 65)}% pressure=${randomFloat(990, 1025, 1)}hPa`
    })
  },
  {
    weight: 10,
    value: () => ({
      level: 'DEBUG',
      subsystem: 'wifi',
      message: `rssi=${randomInt(-75, -38)}dBm tx=${randomInt(0, 4096)}B rx=${randomInt(0, 4096)}B`
    })
  },
  {
    weight: 8,
    value: () => ({
      level: 'INFO',
      subsystem: 'power',
      message: `Battery ${randomInt(35, 100)}% (${randomFloat(3.6, 4.2, 2)}V), charging=${chance(0.3) ? 'yes' : 'no'}`
    })
  },
  {
    weight: 6,
    value: () => ({
      level: 'DEBUG',
      subsystem: 'flash',
      message: `Wear-level stats: ${randomInt(1200, 4800)} erase cycles, ${randomInt(2, 40)}MB free`
    })
  },
  {
    weight: 6,
    value: () => ({
      level: 'INFO',
      subsystem: 'ble',
      message: chance(0.5) ? 'Central connected: mobile-app-ios' : 'Central disconnected'
    })
  },
  {
    weight: 6,
    value: () => ({ level: 'INFO', subsystem: 'wifi', message: 'Heartbeat sent to broker (ack in 1 packet)' })
  },
  {
    weight: 5,
    value: () => ({
      level: 'DEBUG',
      subsystem: 'sensors',
      message: `ADC sample batch complete: ${randomInt(8, 64)} samples in ${randomInt(2, 40)}ms`
    })
  },
  {
    weight: 4,
    value: () => ({
      level: 'WARN',
      subsystem: 'power',
      message: `Battery voltage low: ${randomFloat(3.3, 3.6, 2)}V`
    })
  },
  {
    weight: 3,
    value: () => ({
      level: 'WARN',
      subsystem: 'wifi',
      message: `Retransmit threshold exceeded on last ${randomInt(3, 9)} packets`
    })
  },
  {
    weight: 2,
    value: () => ({
      level: 'ERROR',
      subsystem: 'flash',
      message: `Write failed at 0x${randomInt(0, 0xfffff).toString(16).padStart(6, '0')}: CRC mismatch`
    })
  }
]

function i2cTimeoutBurst(): LineSpec[] {
  const addr = pick(['0x44', '0x68', '0x76', '0x1d'])
  return [
    { level: 'ERROR', subsystem: 'sensors', message: `I2C bus timeout on address ${addr}` },
    { level: 'ERROR', subsystem: 'sensors', message: 'Retry 1/3...' },
    { level: 'ERROR', subsystem: 'sensors', message: 'Retry 2/3...' },
    { level: 'ERROR', subsystem: 'sensors', message: 'Retry 3/3 failed — marking sensor offline' },
    { level: 'WARN', subsystem: 'health', message: 'Subsystem degraded: sensors' }
  ]
}

function wifiDropBurst(): LineSpec[] {
  return [
    { level: 'WARN', subsystem: 'wifi', message: 'Beacon loss detected, link quality degrading' },
    { level: 'ERROR', subsystem: 'wifi', message: 'Disassociated from AP: reason=4 (inactivity)' },
    { level: 'INFO', subsystem: 'wifi', message: 'Reconnecting...' },
    { level: 'INFO', subsystem: 'wifi', message: `Associated with AP rssi=${randomInt(-70, -45)}dBm` },
    { level: 'INFO', subsystem: 'wifi', message: `DHCP lease acquired: 192.168.1.${randomInt(2, 250)}` }
  ]
}

const BURSTS: (() => LineSpec[])[] = [i2cTimeoutBurst, wifiDropBurst]

const WATCHDOG_LINES: LineSpec[] = [
  { level: 'ERROR', subsystem: 'app', message: 'Watchdog timeout — main loop unresponsive for 4000ms' },
  { level: 'ERROR', subsystem: 'app', message: 'Forcing reset...' }
]

type Emit = (line: string) => void

// Free-runs a plausible firmware debug UART: a boot banner, then a steady
// trickle of heartbeat/telemetry lines, with occasional multi-line error
// bursts and a rare full simulated reset (device "uptime" resets with it).
// This is what stands in for the debug channel — unlike the main channel,
// real debug UARTs push data unprompted, so nothing here reacts to writes.
export class DebugLogGenerator {
  private timer: ReturnType<typeof setTimeout> | null = null
  private stopped = true
  private startedAt = Date.now()

  constructor(private readonly emit: Emit) {}

  start(): void {
    this.stopped = false
    this.startedAt = Date.now()
    this.playSequence(bootSequence(), () => this.scheduleNext())
  }

  stop(): void {
    this.stopped = true
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  private uptimeMs(): number {
    return Date.now() - this.startedAt
  }

  private emitSpec(spec: LineSpec): void {
    if (this.stopped) return
    this.emit(formatLine(this.uptimeMs(), spec))
  }

  private playSequence(specs: LineSpec[], onDone?: () => void): void {
    let delay = 0
    for (const spec of specs) {
      delay += jitterMs(30, 130)
      this.timer = setTimeout(() => this.emitSpec(spec), delay)
    }
    if (onDone) {
      this.timer = setTimeout(() => {
        if (!this.stopped) onDone()
      }, delay + jitterMs(300, 900))
    }
  }

  private scheduleNext(): void {
    if (this.stopped) return
    this.timer = setTimeout(() => {
      if (this.stopped) return
      this.emitNext()
      this.scheduleNext()
    }, jitterMs(400, 2000))
  }

  private emitNext(): void {
    if (chance(0.006)) {
      this.emitSpec(WATCHDOG_LINES[0])
      this.timer = setTimeout(() => {
        if (this.stopped) return
        this.emitSpec(WATCHDOG_LINES[1])
        this.timer = setTimeout(() => {
          if (this.stopped) return
          this.startedAt = Date.now()
          this.playSequence(bootSequence())
        }, jitterMs(400, 900))
      }, jitterMs(150, 400))
      return
    }
    if (chance(0.035)) {
      this.playSequence(pick(BURSTS)())
      return
    }
    this.emitSpec(pickWeighted(STEADY_TEMPLATES)())
  }
}
