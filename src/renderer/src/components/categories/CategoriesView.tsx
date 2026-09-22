import { useMemo, useState } from 'react'
import type { Category } from '@shared/types'
import { useCategoriesStore } from '../../store/categoriesStore'
import { useCommandsStore } from '../../store/commandsStore'
import CategoryList from './CategoryList'
import CategoryEditorDialog from './CategoryEditorDialog'

function CategoriesView(): React.JSX.Element {
  const categories = useCategoriesStore((state) => state.categories)
  const create = useCategoriesStore((state) => state.create)
  const update = useCategoriesStore((state) => state.update)
  const remove = useCategoriesStore((state) => state.remove)
  const commands = useCommandsStore((state) => state.commands)

  const commandCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const command of commands) {
      if (command.categoryId == null) continue
      counts.set(command.categoryId, (counts.get(command.categoryId) ?? 0) + 1)
    }
    return counts
  }, [commands])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  function openCreate(): void {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(category: Category): void {
    setEditing(category)
    setDialogOpen(true)
  }

  async function handleDelete(category: Category): Promise<void> {
    const count = commandCounts.get(category.id) ?? 0
    const message =
      count > 0
        ? `Delete "${category.name}"? ${count} command(s) will become uncategorized.`
        : `Delete "${category.name}"?`
    if (window.confirm(message)) {
      await remove(category.id)
    }
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-100">Categories</h1>
        <button
          onClick={openCreate}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          New category
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <CategoryList
          categories={categories}
          commandCounts={commandCounts}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>

      <CategoryEditorDialog
        open={dialogOpen}
        initial={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={async (input) => {
          if (editing) {
            await update(editing.id, input)
          } else {
            await create(input)
          }
        }}
      />
    </div>
  )
}

export default CategoriesView
