import { create } from 'zustand'
import type { SerialPortInfo, SerialStatus } from '@shared/types'

interface SerialState {
  ports: SerialPortInfo[]
  status: SerialStatus
  loadingPorts: boolean
  connecting: boolean
  lastError: string | null
  refreshPorts: () => Promise<void>
  connect: (path: string, baudRate: number) => Promise<void>
  disconnect: () => Promise<void>
}

export const useSerialStore = create<SerialState>((set) => ({
  ports: [],
  status: { connected: false },
  loadingPorts: false,
  connecting: false,
  lastError: null,

  refreshPorts: async () => {
    set({ loadingPorts: true })
    const ports = await window.api.serial.listPorts()
    set({ ports, loadingPorts: false })
  },

  connect: async (path, baudRate) => {
    set({ connecting: true, lastError: null })
    const result = await window.api.serial.connect(path, baudRate)
    set({ connecting: false, lastError: result.ok ? null : result.error })
  },

  disconnect: async () => {
    await window.api.serial.disconnect()
  }
}))
