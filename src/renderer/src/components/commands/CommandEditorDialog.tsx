import { useEffect, useState } from 'react'
import type { Command, CommandInput } from '@shared/types'
import { IDLE_GAP_MS_MAX, IDLE_GAP_MS_MIN, CORRELATION_WINDOW_MS_MAX, CORRELATION_WINDOW_MS_MIN } from '@shared/constants'
import { useCategoriesStore } from '../../store/categoriesStore'

interface CommandEditorDialogProps {
  open: boolean
  initial?: Command | null
  onClose: () => void
  onSubmit: (input: CommandInput) => Promise<void>
}

// Empty = use the default (null); undefined = invalid.
function parseOptionalMs(raw: string, min: number, max: number): number | null | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined
}

function CommandEditorDialog({ open, initial, onClose, onSubmit }: CommandEditorDialogProps): React.JSX.Element | null {
  const categories = useCategoriesStore((state) => state.categories)
  const [name, setName] = useState('')
  const [commandString, setCommandString] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [intervalSeconds, setIntervalSeconds] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [timeoutMs, setTimeoutMs] = useState('')
  const [idleGapMs, setIdleGapMs] = useState('')
  const [terminatorPattern, setTerminatorPattern] = useState('')
  const [error, setError] = useState<string | null>(null)
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
    setTimeoutMs(initial?.timeoutMs != null ? String(initial.timeoutMs) : '')
    setIdleGapMs(initial?.idleGapMs != null ? String(initial.idleGapMs) : '')
    setTerminatorPattern(initial?.terminatorPattern ?? '')
    setError(null)
  }, [open, initial])

  if (!open) return null

  const isEdit = Boolean(initial)

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    const timeout = parseOptionalMs(timeoutMs, CORRELATION_WINDOW_MS_MIN, CORRELATION_WINDOW_MS_MAX)
    const idleGap = parseOptionalMs(idleGapMs, IDLE_GAP_MS_MIN, IDLE_GAP_MS_MAX)
    if (timeout === undefined) {
      setError(`Timeout must be a whole number of ms between ${CORRELATION_WINDOW_MS_MIN} and ${CORRELATION_WINDOW_MS_MAX}.`)
      return
    }
    if (idleGap === undefined) {
      setError(`Idle gap must be a whole number of ms between ${IDLE_GAP_MS_MIN} and ${IDLE_GAP_MS_MAX}.`)
      return
    }
    const terminator = terminatorPattern.trim()
    if (terminator) {
      try {
        new RegExp(terminator)
      } catch {
        setError('Terminator pattern is not a valid regular expression.')
        return
      }
    }
    setError(null)
    setSaving(true)
    try {
      const trimmedInterval = intervalSeconds.trim()
      await onSubmit({
        name: name.trim(),
        commandString: commandString.trim(),
        enabled,
        scheduleIntervalMs: trimmedInterval ? Math.round(Number(trimmedInterval) * 1000) : null,
        categoryId,
        timeoutMs: timeout,
        idleGapMs: idleGap,
        terminatorPattern: terminator || null
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
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-xl"
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

          <div>
            <label className="block text-xs font-medium text-neutral-400">
              Reply timeout (ms, optional)
            </label>
            <input
              type="number"
              min={CORRELATION_WINDOW_MS_MIN}
              value={timeoutMs}
              onChange={(e) => setTimeoutMs(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
              placeholder="Empty = default from connection settings"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400">Idle gap (ms, optional)</label>
              <input
                type="number"
                min={IDLE_GAP_MS_MIN}
                value={idleGapMs}
                onChange={(e) => setIdleGapMs(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                placeholder="Empty = 300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400">End-of-reply pattern (regex)</label>
              <input
                value={terminatorPattern}
                onChange={(e) => setTerminatorPattern(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm text-neutral-100 outline-none focus:border-neutral-500"
                placeholder="e.g. OK|ERROR"
              />
            </div>
          </div>
          <p className="text-[11px] text-neutral-500">
            A reply ends when the pattern matches a line, when no new line arrives within the idle gap, or at the
            timeout. The next queued command is sent after that.
          </p>

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

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

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
