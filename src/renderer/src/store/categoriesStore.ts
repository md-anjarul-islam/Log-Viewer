import { create } from 'zustand'
import type { Category, CategoryInput } from '@shared/types'

interface CategoriesState {
  categories: Category[]
  loading: boolean
  load: () => Promise<void>
  create: (input: CategoryInput) => Promise<void>
  update: (id: number, patch: Partial<CategoryInput>) => Promise<void>
  remove: (id: number) => Promise<void>
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const categories = await window.api.categories.list()
    set({ categories, loading: false })
  },

  create: async (input) => {
    await window.api.categories.create(input)
  },

  update: async (id, patch) => {
    await window.api.categories.update(id, patch)
  },

  remove: async (id) => {
    await window.api.categories.delete(id)
  }
}))
