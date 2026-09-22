import { useEffect, useState } from 'react'
import type { Command, CommandInput } from '@shared/types'
import { useCategoriesStore } from '../../store/categoriesStore'

interface CommandEditorDialogProps {
  open: boolean
  initial?: Command | null
  onClose: () => void
  onSubmit: (input: CommandInput) => Promise<void>
}

function CommandEditorDialog({ open, initial, onClose, onSubmit }: CommandEditorDialogProps): React.JSX.Element | null {
  const categories = useCategoriesStore((state) => state.categories)
  const [name, setName] = useState('')
  const [commandString, setCommandString] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [intervalSeconds, setIntervalSeconds] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setCommandString(initial?.commandString ?? '')
    setEnabled(initial?.enabled ?? false)
    setIntervalSeconds(
      initial?.scheduleIntervalMs != null ? String(Math.round(initial.scheduleIntervalMs / 1000)) : ''
    )
    setCategoryId(initial?.categoryId ?? null)
  }, [open, initial])

  if (!open) return null

  const isEdit = Boolean(initial)

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setSaving(true)
    try {
      const trimmedInterval = intervalSeconds.trim()
      await onSubmit({
        name: name.trim(),
        commandString: commandString.trim(),
        enabled,
        scheduleIntervalMs: trimmedInterval ? Math.round(Number(trimmedInterval) * 1000) : null,
        categoryId
      })
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
          {isEdit ? 'Edit command' : 'New command'}
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              placeholder="e.g. Get status"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400">Command</label>
            <input
              required
              value={commandString}
              onChange={(e) => setCommandString(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm text-neutral-100 outline-none focus:border-neutral-500"
              placeholder="e.g. AT+STATUS?"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400">Category</label>
            <select
              value={categoryId ?? ''}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400">
              Schedule interval (seconds, optional)
            </label>
            <input
              type="number"
              min={1}
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              placeholder="Leave empty for manual-only"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-950"
            />
            Enabled
          </label>
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

export default CommandEditorDialog
