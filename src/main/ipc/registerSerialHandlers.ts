import { ipcMain, type BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { RawSerialLine } from '@shared/types'
import type { SerialManager } from '../serial/SerialManager'

export function registerSerialHandlers(
  serialManager: SerialManager,
  getWindow: () => BrowserWindow | null
): void {
  serialManager.on('status-change', (status) => {
    getWindow()?.webContents.send(IPC.SERIAL_STATUS, status)
  })

  serialManager.on('line', (raw: string) => {
    const line: RawSerialLine = { raw, timestamp: new Date().toISOString() }
    getWindow()?.webContents.send(IPC.SERIAL_LINE, line)
  })

  ipcMain.handle(IPC.SERIAL_LIST_PORTS, () => serialManager.listPorts())

  ipcMain.handle(IPC.SERIAL_CONNECT, async (_event, path: string, baudRate: number) => {
    try {
      await serialManager.connect(path, baudRate)
      return { ok: true as const }
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle(IPC.SERIAL_DISCONNECT, () => serialManager.disconnect())
}
