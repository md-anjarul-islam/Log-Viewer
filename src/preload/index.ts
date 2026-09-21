import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc-channels'

const api = {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke(IPC.APP_GET_VERSION)
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
