import { chance, jitterMs, randomFloat, randomInt, pick } from './random'

export interface SimulatedCommandResponse {
  // Each entry is pushed as its own delimiter-framed record, staggered a
  // little after the previous one — mirrors a real device streaming a
  // multi-line reply rather than delivering it in one burst.
  lines: string[]
  // Delay before the first line, from write to first byte back.
  delayMs: number
}

const FIRMWARE_VERSION = 'v2.3.1-rc4'
const BUILD_STAMP = '2024-08-11T14:02:00Z'
const DEVICE_ID = 'device-42AB'
const SERIAL_NUMBER = 'SN-88213-XJ'
const BOOT_TIME_MS = Date.now()

function uptimeSeconds(): number {
  return Math.floor((Date.now() - BOOT_TIME_MS) / 1000)
}

const HELP_LINES = [
  'Supported commands:',
  '  PING              - liveness check',
  '  STATUS            - device status as JSON',
  '  VERSION           - firmware version',
  '  WHOAMI            - device identity',
  '  SENSORS           - latest sensor readings as JSON',
  '  LOG LEVEL <level>  - set debug log verbosity',
  '  REBOOT            - restart the device',
  '  HELP              - this message'
]

interface Matcher {
  test: (cmd: string) => boolean
  respond: (cmd: string) => SimulatedCommandResponse
}

const MATCHERS: Matcher[] = [
  {
    test: (cmd) => cmd === 'PING',
    respond: () => ({ lines: ['PONG'], delayMs: jitterMs(40, 120) })
  },
  {
    test: (cmd) => cmd === 'STATUS' || cmd === 'GET_STATUS' || cmd === 'AT+STATUS?',
    respond: () => ({
      lines: [
        JSON.stringify({
          status: 'ok',
          uptime_s: uptimeSeconds(),
          battery_pct: randomInt(35, 100),
          rssi_dbm: randomInt(-75, -38),
          heap_free: randomInt(95_000, 128_000),
          temp_c: randomFloat(19, 27)
        })
      ],
      delayMs: jitterMs(100, 320)
    })
  },
  {
    test: (cmd) => cmd === 'VERSION' || cmd === 'GET_VERSION' || cmd === 'FW_VERSION',
    respond: () => ({ lines: [`FW ${FIRMWARE_VERSION} build ${BUILD_STAMP}`], delayMs: jitterMs(60, 180) })
  },
  {
    test: (cmd) => cmd === 'WHOAMI' || cmd === 'ID' || cmd === 'GET_ID',
    respond: () => ({ lines: [`${DEVICE_ID} (serial: ${SERIAL_NUMBER})`], delayMs: jitterMs(60, 180) })
  },
  {
    test: (cmd) => cmd === 'SENSORS' || cmd === 'READ_SENSORS' || cmd === 'GET_SENSORS',
    respond: () => ({
      lines: [
        JSON.stringify({
          temp_c: randomFloat(19, 27),
          humidity_pct: randomInt(30, 65),
          pressure_hpa: randomFloat(990, 1025, 1),
          light_lux: randomInt(0, 800)
        })
      ],
      delayMs: jitterMs(120, 350)
    })
  },
  {
    test: (cmd) => cmd === 'HELP' || cmd === '?',
    respond: () => ({ lines: HELP_LINES, delayMs: jitterMs(60, 150) })
  },
  {
    test: (cmd) => /^(LOG LEVEL|SET_LOG_LEVEL)\s+\S+/.test(cmd),
    respond: (cmd) => {
      const level = cmd.split(/\s+/).pop() ?? 'INFO'
      return { lines: [`OK log level set to ${level.toUpperCase()}`], delayMs: jitterMs(50, 150) }
    }
  },
  {
    test: (cmd) => cmd === 'REBOOT' || cmd === 'RESET' || cmd === 'RESTART',
    respond: () => ({ lines: ['Rebooting...', 'OK'], delayMs: jitterMs(600, 1400) })
  },
  {
    test: (cmd) => cmd === 'CRASH' || cmd === 'FAULT' || cmd === 'PANIC',
    respond: () => ({
      lines: [
        '!!! HARD FAULT !!!',
        `PC=0x${randomInt(0, 0xffffff).toString(16).padStart(8, '0')} LR=0x${randomInt(0, 0xffffff)
          .toString(16)
          .padStart(8, '0')}`,
        'CFSR=0x00008200 (precise data bus error)',
        'Rebooting in 1s...'
      ],
      delayMs: jitterMs(80, 200)
    })
  }
]

const GENERIC_ERRORS = [
  'ERR 408 timeout waiting for peripheral',
  'ERR 500 internal fault',
  'ERR 12 sensor bus busy, try again'
]

// Looks up a canned reply for a decoded command. Returns null for anything
// unrecognized so the caller can fall back to its own default behavior
// (looping the bytes back), same as a device that doesn't understand a
// command but still round-trips it.
export function buildCommandResponse(rawText: string): SimulatedCommandResponse | null {
  const cmd = rawText.trim().toUpperCase()
  if (!cmd) return null

  const matcher = MATCHERS.find((m) => m.test(cmd))
  if (!matcher) return null

  // A little unreliability even for commands the device understands, so
  // the log viewer's handling of unexpected/error responses gets exercised
  // without needing a dedicated test command for it every time.
  if (chance(0.04)) {
    return { lines: [pick(GENERIC_ERRORS)], delayMs: jitterMs(200, 600) }
  }

  return matcher.respond(cmd)
}

// A small, separate chance that a recognized *or* unrecognized command gets
// no reply at all — simulates a dropped/missed command on a noisy link, and
// exercises what the log viewer shows for a run that produced zero log
// entries.
export function shouldDropResponse(): boolean {
  return chance(0.03)
}
