import { ipcMain, type BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { SerialManager } from '../serial/SerialManager'

interface SerialIpcChannels {
  connect: string
  disconnect: string
  status: string
  getStatus: string
  getAutoReconnect: string
  setAutoReconnect: string
}

export const MAIN_SERIAL_CHANNELS: SerialIpcChannels = {
  connect: IPC.SERIAL_CONNECT,
  disconnect: IPC.SERIAL_DISCONNECT,
  status: IPC.SERIAL_STATUS,
  getStatus: IPC.SERIAL_GET_STATUS,
  getAutoReconnect: IPC.SERIAL_GET_AUTO_RECONNECT,
  setAutoReconnect: IPC.SERIAL_SET_AUTO_RECONNECT
}

export const DEBUG_SERIAL_CHANNELS: SerialIpcChannels = {
  connect: IPC.SERIAL_DEBUG_CONNECT,
  disconnect: IPC.SERIAL_DEBUG_DISCONNECT,
  status: IPC.SERIAL_DEBUG_STATUS,
  getStatus: IPC.SERIAL_DEBUG_GET_STATUS,
  getAutoReconnect: IPC.SERIAL_DEBUG_GET_AUTO_RECONNECT,
  setAutoReconnect: IPC.SERIAL_DEBUG_SET_AUTO_RECONNECT
}

// Registered once per SerialManager instance (main, and optionally debug),
// each against its own set of IPC channel names — port enumeration
// (SERIAL_LIST_PORTS) is registered separately since it's shared, not
// per-connection.
export function registerSerialHandlers(
  serialManager: SerialManager,
  getWindow: () => BrowserWindow | null,
  channels: SerialIpcChannels
): void {
  serialManager.on('status-change', (status) => {
    getWindow()?.webContents.send(channels.status, status)
  })

  ipcMain.handle(
    channels.connect,
    async (_event, path: string, baudRate: number, delimiterHex: string) => {
      try {
        await serialManager.connect(path, baudRate, delimiterHex)
        return { ok: true as const }
      } catch (err) {
        return { ok: false as const, error: err instanceof Error ? err.message : String(err) }
      }
    }
  )

  ipcMain.handle(channels.disconnect, () => serialManager.disconnect())

  ipcMain.handle(channels.getStatus, () => serialManager.getStatus())

  ipcMain.handle(channels.getAutoReconnect, () => serialManager.getAutoReconnect())

  ipcMain.handle(channels.setAutoReconnect, (_event, enabled: boolean) =>
    serialManager.setAutoReconnect(enabled)
  )
}

export function registerListPortsHandler(serialManager: SerialManager): void {
  ipcMain.handle(IPC.SERIAL_LIST_PORTS, () => serialManager.listPorts())
}
