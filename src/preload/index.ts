import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type {
  Command,
  CommandInput,
  LogEntry,
  RunNowResult,
  SerialPortInfo,
  SerialStatus
} from '@shared/types'

const api = {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke(IPC.APP_GET_VERSION),

  commands: {
    list: (): Promise<Command[]> => ipcRenderer.invoke(IPC.COMMANDS_LIST),
    create: (input: CommandInput): Promise<Command> => ipcRenderer.invoke(IPC.COMMANDS_CREATE, input),
    update: (id: number, patch: Partial<CommandInput>): Promise<Command> =>
      ipcRenderer.invoke(IPC.COMMANDS_UPDATE, id, patch),
    delete: (id: number): Promise<void> => ipcRenderer.invoke(IPC.COMMANDS_DELETE, id),
    runNow: (id: number): Promise<RunNowResult> => ipcRenderer.invoke(IPC.COMMANDS_RUN_NOW, id),
    onChanged: (callback: (commands: Command[]) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, commands: Command[]): void => callback(commands)
      ipcRenderer.on(IPC.COMMANDS_CHANGED, listener)
      return () => ipcRenderer.removeListener(IPC.COMMANDS_CHANGED, listener)
    }
  },

  serial: {
    listPorts: (): Promise<SerialPortInfo[]> => ipcRenderer.invoke(IPC.SERIAL_LIST_PORTS),
    connect: (path: string, baudRate: number): Promise<{ ok: true } | { ok: false; error: string }> =>
      ipcRenderer.invoke(IPC.SERIAL_CONNECT, path, baudRate),
    disconnect: (): Promise<void> => ipcRenderer.invoke(IPC.SERIAL_DISCONNECT),
    onStatus: (callback: (status: SerialStatus) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: SerialStatus): void => callback(status)
      ipcRenderer.on(IPC.SERIAL_STATUS, listener)
      return () => ipcRenderer.removeListener(IPC.SERIAL_STATUS, listener)
    }
  },

  logs: {
    onEntry: (callback: (entry: LogEntry) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, entry: LogEntry): void => callback(entry)
      ipcRenderer.on(IPC.LOGS_STREAM, listener)
      return () => ipcRenderer.removeListener(IPC.LOGS_STREAM, listener)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
