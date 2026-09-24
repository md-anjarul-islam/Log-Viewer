export type ByteEncodingMode = 'hex' | 'ascii' | 'utf8'

export const BYTE_ENCODING_MODES: ByteEncodingMode[] = ['hex', 'ascii', 'utf8']

export const DEFAULT_BYTE_ENCODING_MODE: ByteEncodingMode = 'hex'

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

// "48656c6c6f" -> "48 65 6c 6c 6f"
function formatHex(hex: string): string {
  return hex.replace(/(.{2})(?=.)/g, '$1 ')
}

// Each byte mapped straight to its character code (0-255) — classic
// ASCII/Latin-1 hex-dump text column, no placeholder for control bytes.
function decodeAscii(hex: string): string {
  return Array.from(hexToBytes(hex), (b) => String.fromCharCode(b)).join('')
}

// TextDecoder replaces invalid sequences with U+FFFD; never throws.
function decodeUtf8(hex: string): string {
  return new TextDecoder('utf-8').decode(hexToBytes(hex))
}

export function encodeForDisplay(hex: string, mode: ByteEncodingMode): string {
  switch (mode) {
    case 'hex':
      return formatHex(hex)
    case 'ascii':
      return decodeAscii(hex)
    case 'utf8':
      return decodeUtf8(hex)
  }
}
