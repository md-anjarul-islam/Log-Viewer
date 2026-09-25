import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type {
  AutoReconnectSettings,
  Category,
  CategoryInput,
  ClearLogsResult,
  Command,
  CommandExportResult,
  CommandImportResult,
  CommandInput,
  DebugLogEntry,
  DebugLogQueryFilter,
  DebugLogQueryResult,
  LogEntry,
  LogExportFilter,
  LogExportResult,
  LogQueryFilter,
  LogQueryResult,
  LogsClearedEvent,
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
    export: (): Promise<CommandExportResult> => ipcRenderer.invoke(IPC.COMMANDS_EXPORT),
    import: (): Promise<CommandImportResult> => ipcRenderer.invoke(IPC.COMMANDS_IMPORT),
    onChanged: (callback: (commands: Command[]) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, commands: Command[]): void => callback(commands)
      ipcRenderer.on(IPC.COMMANDS_CHANGED, listener)
      return () => ipcRenderer.removeListener(IPC.COMMANDS_CHANGED, listener)
    }
  },

  categories: {
    list: (): Promise<Category[]> => ipcRenderer.invoke(IPC.CATEGORIES_LIST),
    create: (input: CategoryInput): Promise<Category> => ipcRenderer.invoke(IPC.CATEGORIES_CREATE, input),
    update: (id: number, patch: Partial<CategoryInput>): Promise<Category> =>
      ipcRenderer.invoke(IPC.CATEGORIES_UPDATE, id, patch),
    delete: (id: number): Promise<void> => ipcRenderer.invoke(IPC.CATEGORIES_DELETE, id),
    onChanged: (callback: (categories: Category[]) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, categories: Category[]): void => callback(categories)
      ipcRenderer.on(IPC.CATEGORIES_CHANGED, listener)
      return () => ipcRenderer.removeListener(IPC.CATEGORIES_CHANGED, listener)
    }
  },

  serial: {
    listPorts: (): Promise<SerialPortInfo[]> => ipcRenderer.invoke(IPC.SERIAL_LIST_PORTS),
    connect: (
      path: string,
      baudRate: number,
      delimiterHex: string
    ): Promise<{ ok: true } | { ok: false; error: string }> =>
      ipcRenderer.invoke(IPC.SERIAL_CONNECT, path, baudRate, delimiterHex),
    disconnect: (): Promise<void> => ipcRenderer.invoke(IPC.SERIAL_DISCONNECT),
    getStatus: (): Promise<SerialStatus> => ipcRenderer.invoke(IPC.SERIAL_GET_STATUS),
    onStatus: (callback: (status: SerialStatus) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: SerialStatus): void => callback(status)
      ipcRenderer.on(IPC.SERIAL_STATUS, listener)
      return () => ipcRenderer.removeListener(IPC.SERIAL_STATUS, listener)
    },
    getAutoReconnect: (): Promise<AutoReconnectSettings> =>
      ipcRenderer.invoke(IPC.SERIAL_GET_AUTO_RECONNECT),
    setAutoReconnect: (enabled: boolean): Promise<AutoReconnectSettings> =>
      ipcRenderer.invoke(IPC.SERIAL_SET_AUTO_RECONNECT, enabled)
  },

  // Optional secondary connection to the same hardware (e.g. a debug UART).
  // Port enumeration is shared with `serial.listPorts` above.
  serialDebug: {
    connect: (
      path: string,
      baudRate: number,
      delimiterHex: string
    ): Promise<{ ok: true } | { ok: false; error: string }> =>
      ipcRenderer.invoke(IPC.SERIAL_DEBUG_CONNECT, path, baudRate, delimiterHex),
    disconnect: (): Promise<void> => ipcRenderer.invoke(IPC.SERIAL_DEBUG_DISCONNECT),
    getStatus: (): Promise<SerialStatus> => ipcRenderer.invoke(IPC.SERIAL_DEBUG_GET_STATUS),
    onStatus: (callback: (status: SerialStatus) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: SerialStatus): void => callback(status)
      ipcRenderer.on(IPC.SERIAL_DEBUG_STATUS, listener)
      return () => ipcRenderer.removeListener(IPC.SERIAL_DEBUG_STATUS, listener)
    },
    getAutoReconnect: (): Promise<AutoReconnectSettings> =>
      ipcRenderer.invoke(IPC.SERIAL_DEBUG_GET_AUTO_RECONNECT),
    setAutoReconnect: (enabled: boolean): Promise<AutoReconnectSettings> =>
      ipcRenderer.invoke(IPC.SERIAL_DEBUG_SET_AUTO_RECONNECT, enabled)
  },

  logs: {
    onEntry: (callback: (entry: LogEntry) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, entry: LogEntry): void => callback(entry)
      ipcRenderer.on(IPC.LOGS_STREAM, listener)
      return () => ipcRenderer.removeListener(IPC.LOGS_STREAM, listener)
    },
    query: (filter: LogQueryFilter): Promise<LogQueryResult> => ipcRenderer.invoke(IPC.LOGS_QUERY, filter),
    export: (filter: LogExportFilter): Promise<LogExportResult> => ipcRenderer.invoke(IPC.LOGS_EXPORT, filter),
    clearAll: (): Promise<ClearLogsResult> => ipcRenderer.invoke(IPC.LOGS_CLEAR_ALL),
    clearOlderThan: (days: number): Promise<ClearLogsResult> =>
      ipcRenderer.invoke(IPC.LOGS_CLEAR_OLDER_THAN, days),
    onCleared: (callback: (event: LogsClearedEvent) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: LogsClearedEvent): void => callback(payload)
      ipcRenderer.on(IPC.LOGS_CLEARED, listener)
      return () => ipcRenderer.removeListener(IPC.LOGS_CLEARED, listener)
    }
  },

  debugLogs: {
    onEntry: (callback: (entry: DebugLogEntry) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, entry: DebugLogEntry): void => callback(entry)
      ipcRenderer.on(IPC.DEBUG_LOGS_STREAM, listener)
      return () => ipcRenderer.removeListener(IPC.DEBUG_LOGS_STREAM, listener)
    },
    query: (filter: DebugLogQueryFilter): Promise<DebugLogQueryResult> =>
      ipcRenderer.invoke(IPC.DEBUG_LOGS_QUERY, filter),
    clearAll: (): Promise<ClearLogsResult> => ipcRenderer.invoke(IPC.DEBUG_LOGS_CLEAR_ALL),
    clearOlderThan: (days: number): Promise<ClearLogsResult> =>
      ipcRenderer.invoke(IPC.DEBUG_LOGS_CLEAR_OLDER_THAN, days),
    onCleared: (callback: (event: LogsClearedEvent) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: LogsClearedEvent): void => callback(payload)
      ipcRenderer.on(IPC.DEBUG_LOGS_CLEARED, listener)
      return () => ipcRenderer.removeListener(IPC.DEBUG_LOGS_CLEARED, listener)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
