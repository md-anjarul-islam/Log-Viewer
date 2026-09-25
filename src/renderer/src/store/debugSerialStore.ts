import { create } from 'zustand'
import type { LastSerialDevice, SerialStatus } from '@shared/types'

// Mirrors serialStore, for the optional debug connection. Port enumeration
// is shared with the main connection (see serialStore.ports) since it's a
// property of the host, not of either connection, so it isn't duplicated here.
interface DebugSerialState {
  status: SerialStatus
  connecting: boolean
  lastError: string | null
  autoReconnect: boolean
  lastDevice: LastSerialDevice | null
  connect: (path: string, baudRate: number, delimiterHex: string) => Promise<void>
  disconnect: () => Promise<void>
  loadAutoReconnect: () => Promise<void>
  setAutoReconnect: (enabled: boolean) => Promise<void>
}

export const useDebugSerialStore = create<DebugSerialState>((set) => ({
  status: { connected: false },
  connecting: false,
  lastError: null,
  autoReconnect: false,
  lastDevice: null,

  connect: async (path, baudRate, delimiterHex) => {
    set({ connecting: true, lastError: null })
    const result = await window.api.serialDebug.connect(path, baudRate, delimiterHex)
    set({ connecting: false, lastError: result.ok ? null : result.error })
  },

  disconnect: async () => {
    await window.api.serialDebug.disconnect()
  },

  loadAutoReconnect: async () => {
    const { enabled, lastDevice } = await window.api.serialDebug.getAutoReconnect()
    set({ autoReconnect: enabled, lastDevice })
  },

  setAutoReconnect: async (enabled) => {
    const result = await window.api.serialDebug.setAutoReconnect(enabled)
    set({ autoReconnect: result.enabled, lastDevice: result.lastDevice })
  }
}))
