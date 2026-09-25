import { useState } from 'react'

export const COMMON_BAUD_RATES = [9600, 19200, 38400, 57600, 115200]

export const DELIMITER_PRESETS = [
  { label: 'EOT (0x04)', hex: '04' },
  { label: 'LF (\\n)', hex: '0a' },
  { label: 'CRLF (\\r\\n)', hex: '0d0a' },
  { label: 'Custom…', hex: 'custom' }
] as const

const HEX_BYTES_RE = /^([0-9a-fA-F]{2})+$/

export interface SerialConnectionForm {
  selectedPath: string
  setSelectedPath: (path: string) => void
  baudRate: number
  setBaudRate: (rate: number) => void
  delimiterPreset: string
  setDelimiterPreset: (preset: string) => void
  customDelimiterHex: string
  setCustomDelimiterHex: (hex: string) => void
  isCustomDelimiter: boolean
  delimiterHex: string
  delimiterValid: boolean
}

// Local form state for one serial connection's settings (port/baud/delimiter).
// Shared by the main and debug connection sections of the connection
// settings modal so the derived delimiter fields aren't computed twice.
export function useSerialConnectionForm(): SerialConnectionForm {
  const [selectedPath, setSelectedPath] = useState('')
  const [baudRate, setBaudRate] = useState(9600)
  const [delimiterPreset, setDelimiterPreset] = useState<string>(DELIMITER_PRESETS[0].hex)
  const [customDelimiterHex, setCustomDelimiterHex] = useState('')

  const isCustomDelimiter = delimiterPreset === 'custom'
  const delimiterHex = isCustomDelimiter ? customDelimiterHex : delimiterPreset
  const delimiterValid = HEX_BYTES_RE.test(delimiterHex)

  return {
    selectedPath,
    setSelectedPath,
    baudRate,
    setBaudRate,
    delimiterPreset,
    setDelimiterPreset,
    customDelimiterHex,
    setCustomDelimiterHex,
    isCustomDelimiter,
    delimiterHex,
    delimiterValid
  }
}
