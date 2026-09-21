import type { LogFormat } from '@shared/types'
import { useCommandsStore } from '../../store/commandsStore'
import { isFilterActive, useLogsStore } from '../../store/logsStore'

interface LogFilterBarProps {
  onOpenClear: () => void
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function LogFilterBar({ onOpenClear }: LogFilterBarProps): React.JSX.Element {
  const commands = useCommandsStore((s) => s.commands)
  const filter = useLogsStore((s) => s.filter)
  const setFilter = useLogsStore((s) => s.setFilter)
  const clearFilter = useLogsStore((s) => s.clearFilter)
  const active = isFilterActive(filter)

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <select
        value={filter.commandId ?? ''}
        onChange={(e) => setFilter({ commandId: e.target.value ? Number(e.target.value) : null })}
        className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200"
      >
        <option value="">All commands</option>
        {commands.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={filter.format ?? ''}
        onChange={(e) => setFilter({ format: (e.target.value || null) as LogFormat | null })}
        className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200"
      >
        <option value="">All formats</option>
        <option value="text">Text</option>
        <option value="json">JSON</option>
      </select>

      <input
        type="datetime-local"
        value={toDatetimeLocalValue(filter.from)}
        onChange={(e) => setFilter({ from: fromDatetimeLocalValue(e.target.value) })}
        className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200"
      />
      <span className="text-xs text-neutral-600">to</span>
      <input
        type="datetime-local"
        value={toDatetimeLocalValue(filter.to)}
        onChange={(e) => setFilter({ to: fromDatetimeLocalValue(e.target.value) })}
        className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200"
      />

      {active && (
        <button onClick={clearFilter} className="text-xs text-neutral-400 hover:text-neutral-200">
          Clear filters
        </button>
      )}

      <button
        onClick={onOpenClear}
        className="ml-auto rounded-md px-2 py-1 text-xs text-red-400/80 hover:text-red-400"
      >
        Clear logs…
      </button>
    </div>
  )
}

export default LogFilterBar
