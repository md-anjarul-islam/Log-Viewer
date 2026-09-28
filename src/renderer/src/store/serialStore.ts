import { create } from 'zustand'
import type { LastSerialDevice, SerialPortInfo, SerialStatus } from '@shared/types'

interface SerialState {
  ports: SerialPortInfo[]
  status: SerialStatus
  loadingPorts: boolean
  connecting: boolean
  lastError: string | null
  autoReconnect: boolean
  lastDevice: LastSerialDevice | null
  correlationWindowMs: number
  refreshPorts: () => Promise<void>
  connect: (path: string, baudRate: number, delimiterHex: string) => Promise<void>
  disconnect: () => Promise<void>
  loadAutoReconnect: () => Promise<void>
  setAutoReconnect: (enabled: boolean) => Promise<void>
  loadCorrelationWindowMs: () => Promise<void>
  setCorrelationWindowMs: (windowMs: number) => Promise<{ ok: true } | { ok: false; error: string }>
}

export const useSerialStore = create<SerialState>((set) => ({
  ports: [],
  status: { connected: false },
  loadingPorts: false,
  connecting: false,
  lastError: null,
  autoReconnect: false,
  lastDevice: null,
  correlationWindowMs: 2000,

  refreshPorts: async () => {
    set({ loadingPorts: true })
    const ports = await window.api.serial.listPorts()
    set({ ports, loadingPorts: false })
  },

  connect: async (path, baudRate, delimiterHex) => {
    set({ connecting: true, lastError: null })
    const result = await window.api.serial.connect(path, baudRate, delimiterHex)
    set({ connecting: false, lastError: result.ok ? null : result.error })
  },

  disconnect: async () => {
    await window.api.serial.disconnect()
  },

  loadAutoReconnect: async () => {
    const { enabled, lastDevice } = await window.api.serial.getAutoReconnect()
    set({ autoReconnect: enabled, lastDevice })
  },

  setAutoReconnect: async (enabled) => {
    const result = await window.api.serial.setAutoReconnect(enabled)
    set({ autoReconnect: result.enabled, lastDevice: result.lastDevice })
  },

  loadCorrelationWindowMs: async () => {
    const correlationWindowMs = await window.api.serial.getCorrelationWindowMs()
    set({ correlationWindowMs })
  },

  setCorrelationWindowMs: async (windowMs) => {
    const result = await window.api.serial.setCorrelationWindowMs(windowMs)
    if (result.ok) {
      set({ correlationWindowMs: result.windowMs })
      return { ok: true }
    }
    return { ok: false, error: result.error }
  }
}))
