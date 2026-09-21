import { create } from 'zustand'
import type { Command, CommandInput } from '@shared/types'

interface CommandsState {
  commands: Command[]
  loading: boolean
  load: () => Promise<void>
  create: (input: CommandInput) => Promise<void>
  update: (id: number, patch: Partial<CommandInput>) => Promise<void>
  remove: (id: number) => Promise<void>
}

export const useCommandsStore = create<CommandsState>((set) => ({
  commands: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const commands = await window.api.commands.list()
    set({ commands, loading: false })
  },

  create: async (input) => {
    await window.api.commands.create(input)
  },

  update: async (id, patch) => {
    await window.api.commands.update(id, patch)
  },

  remove: async (id) => {
    await window.api.commands.delete(id)
  }
}))
