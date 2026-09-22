import { useState } from 'react'
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

  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const handleExport = async (): Promise<void> => {
    setExporting(true)
    setExportStatus(null)
    try {
      const result = await window.api.logs.export({
        commandId: filter.commandId ?? undefined,
        from: filter.from ?? undefined,
        to: filter.to ?? undefined
      })
      if (!result.canceled) setExportStatus(`Exported ${result.count} line${result.count === 1 ? '' : 's'}`)
    } catch {
      setExportStatus('Export failed')
    } finally {
      setExporting(false)
      setTimeout(() => setExportStatus(null), 4000)
    }
  }

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

      <div className="ml-auto flex items-center gap-3">
        {exportStatus && <span className="text-xs text-neutral-500">{exportStatus}</span>}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:border-neutral-600 hover:text-neutral-100 disabled:opacity-50"
        >
          {exporting ? 'Exporting…' : active ? 'Export filtered…' : 'Export…'}
        </button>
        <button onClick={onOpenClear} className="rounded-md px-2 py-1 text-xs text-red-400/80 hover:text-red-400">
          Clear logs…
        </button>
      </div>
    </div>
  )
}

export default LogFilterBar
