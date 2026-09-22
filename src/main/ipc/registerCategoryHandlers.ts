import { ipcMain, type BrowserWindow } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { CategoryInput } from '@shared/types'
import type { CategoriesRepo } from '../db/categoriesRepo'
import type { CommandsRepo } from '../db/commandsRepo'

export function registerCategoryHandlers(
  categoriesRepo: CategoriesRepo,
  commandsRepo: CommandsRepo,
  getWindow: () => BrowserWindow | null
): void {
  const broadcastChanged = (): void => {
    getWindow()?.webContents.send(IPC.CATEGORIES_CHANGED, categoriesRepo.list())
  }
  const broadcastCommandsChanged = (): void => {
    getWindow()?.webContents.send(IPC.COMMANDS_CHANGED, commandsRepo.list())
  }

  ipcMain.handle(IPC.CATEGORIES_LIST, () => categoriesRepo.list())

  ipcMain.handle(IPC.CATEGORIES_CREATE, (_event, input: CategoryInput) => {
    const category = categoriesRepo.create(input)
    broadcastChanged()
    return category
  })

  ipcMain.handle(IPC.CATEGORIES_UPDATE, (_event, id: number, patch: Partial<CategoryInput>) => {
    const category = categoriesRepo.update(id, patch)
    broadcastChanged()
    return category
  })

  ipcMain.handle(IPC.CATEGORIES_DELETE, (_event, id: number) => {
    categoriesRepo.delete(id)
    broadcastChanged()
    // Commands referencing this category fall back to uncategorized via the
    // FK's ON DELETE SET NULL — let the renderer know their category_id changed.
    broadcastCommandsChanged()
  })
}
