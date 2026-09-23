import { ipcMain, type BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { SerialManager } from '../serial/SerialManager'

export function registerSerialHandlers(
  serialManager: SerialManager,
  getWindow: () => BrowserWindow | null
): void {
  serialManager.on('status-change', (status) => {
    getWindow()?.webContents.send(IPC.SERIAL_STATUS, status)
  })

  ipcMain.handle(IPC.SERIAL_LIST_PORTS, () => serialManager.listPorts())

  ipcMain.handle(
    IPC.SERIAL_CONNECT,
    async (_event, path: string, baudRate: number, delimiterHex: string) => {
      try {
        await serialManager.connect(path, baudRate, delimiterHex)
        return { ok: true as const }
      } catch (err) {
        return { ok: false as const, error: err instanceof Error ? err.message : String(err) }
      }
    }
  )

  ipcMain.handle(IPC.SERIAL_DISCONNECT, () => serialManager.disconnect())

  ipcMain.handle(IPC.SERIAL_GET_STATUS, () => serialManager.getStatus())

  ipcMain.handle(IPC.SERIAL_GET_AUTO_RECONNECT, () => serialManager.getAutoReconnect())

  ipcMain.handle(IPC.SERIAL_SET_AUTO_RECONNECT, (_event, enabled: boolean) =>
    serialManager.setAutoReconnect(enabled)
  )
}
