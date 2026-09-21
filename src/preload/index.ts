import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { Command, CommandInput } from '@shared/types'

const api = {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke(IPC.APP_GET_VERSION),

  commands: {
    list: (): Promise<Command[]> => ipcRenderer.invoke(IPC.COMMANDS_LIST),
    create: (input: CommandInput): Promise<Command> => ipcRenderer.invoke(IPC.COMMANDS_CREATE, input),
    update: (id: number, patch: Partial<CommandInput>): Promise<Command> =>
      ipcRenderer.invoke(IPC.COMMANDS_UPDATE, id, patch),
    delete: (id: number): Promise<void> => ipcRenderer.invoke(IPC.COMMANDS_DELETE, id),
    onChanged: (callback: (commands: Command[]) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, commands: Command[]): void => callback(commands)
      ipcRenderer.on(IPC.COMMANDS_CHANGED, listener)
      return () => ipcRenderer.removeListener(IPC.COMMANDS_CHANGED, listener)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
