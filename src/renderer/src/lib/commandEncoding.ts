// Commands are stored and sent as hex (see SerialManager.write). ASCII mode is
// only a convenience for typing / reading them: it converts to and from the
// canonical hex string. In ASCII text, \r \n \t \\ and \xHH escapes express
// bytes that aren't printable (e.g. the CR/LF that most AT-style commands end with).

export type CommandEncodingMode = 'hex' | 'ascii'

export const COMMAND_ENCODING_MODES: CommandEncodingMode[] = ['hex', 'ascii']

export const DEFAULT_COMMAND_ENCODING_MODE: CommandEncodingMode = 'hex'

export type ParseResult = { ok: true; hex: string } | { ok: false; error: string }

// "48 65 6C" / "48656c" -> "48656c". Whitespace is ignored.
export function parseHexInput(text: string): ParseResult {
  const hex = text.replace(/\s+/g, '').toLowerCase()
  if (!/^[0-9a-f]*$/.test(hex)) return { ok: false, error: 'Hex may only contain 0-9 and A-F.' }
  if (hex.length % 2 !== 0) return { ok: false, error: 'Hex must have an even number of digits.' }
  return { ok: true, hex }
}

const SIMPLE_ESCAPES: Record<string, number> = { r: 0x0d, n: 0x0a, t: 0x09, '\\': 0x5c }

export function asciiToHex(text: string): ParseResult {
  const bytes: number[] = []
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\\') {
      const next = text[i + 1]
      if (next !== undefined && next in SIMPLE_ESCAPES) {
        bytes.push(SIMPLE_ESCAPES[next])
        i++
        continue
      }
      const hex = text.substring(i + 2, i + 4)
      if (next === 'x' && /^[0-9a-fA-F]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16))
        i += 3
        continue
      }
      return { ok: false, error: 'Unknown escape. Use \\r, \\n, \\t, \\\\ or \\xHH.' }
    }
    const code = ch.charCodeAt(0)
    if (code > 0xff) return { ok: false, error: `"${ch}" is not an ASCII/Latin-1 character.` }
    bytes.push(code)
  }
  return { ok: true, hex: bytes.map((b) => b.toString(16).padStart(2, '0')).join('') }
}

// Inverse of asciiToHex: printable bytes as themselves, the rest escaped.
export function hexToAscii(hex: string): string {
  let out = ''
  for (let i = 0; i + 1 < hex.length; i += 2) {
    const b = parseInt(hex.substring(i, i + 2), 16)
    if (b === 0x0d) out += '\\r'
    else if (b === 0x0a) out += '\\n'
    else if (b === 0x09) out += '\\t'
    else if (b === 0x5c) out += '\\\\'
    else if (b >= 0x20 && b <= 0x7e) out += String.fromCharCode(b)
    else out += `\\x${b.toString(16).padStart(2, '0')}`
  }
  return out
}

// Hex as stored -> text shown in the given mode (hex is grouped by byte).
export function formatCommand(hex: string, mode: CommandEncodingMode): string {
  return mode === 'ascii' ? hexToAscii(hex) : hex.replace(/(.{2})(?=.)/g, '$1 ')
}

export function parseCommandInput(text: string, mode: CommandEncodingMode): ParseResult {
  return mode === 'ascii' ? asciiToHex(text) : parseHexInput(text)
}
