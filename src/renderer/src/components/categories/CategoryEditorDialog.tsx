import { useEffect, useState } from 'react'
import type { Category, CategoryInput } from '@shared/types'

interface CategoryEditorDialogProps {
  open: boolean
  initial?: Category | null
  onClose: () => void
  onSubmit: (input: CategoryInput) => Promise<void>
}

function CategoryEditorDialog({
  open,
  initial,
  onClose,
  onSubmit
}: CategoryEditorDialogProps): React.JSX.Element | null {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
  }, [open, initial])

  if (!open) return null

  const isEdit = Boolean(initial)

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit({ name: name.trim() })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-neutral-100">
          {isEdit ? 'Edit category' : 'New category'}
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400">Name</label>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              placeholder="e.g. Diagnostics"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CategoryEditorDialog
