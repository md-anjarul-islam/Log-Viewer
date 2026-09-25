import { useMemo } from 'react'
import { isDebugFilterActive, useDebugLogsStore } from '../../store/debugLogsStore'
import { compileSearch, isSearchActive } from '../../lib/logSearch'

interface DebugLogFilterBarProps {
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

function DebugLogFilterBar({ onOpenClear }: DebugLogFilterBarProps): React.JSX.Element {
  const filter = useDebugLogsStore((s) => s.filter)
  const setFilter = useDebugLogsStore((s) => s.setFilter)
  const clearFilter = useDebugLogsStore((s) => s.clearFilter)
  const search = useDebugLogsStore((s) => s.search)
  const setSearch = useDebugLogsStore((s) => s.setSearch)
  const active = isDebugFilterActive(filter) || isSearchActive(search)

  const compiledSearch = useMemo(
    () => compileSearch(search),
    [search.term, search.mode, search.caseSensitive]
  )

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <div className="relative">
          <input
            type="text"
            value={search.term}
            onChange={(e) => setSearch({ term: e.target.value })}
            placeholder={search.mode === 'regex' ? 'Filter by regex…' : 'Filter by text…'}
            spellCheck={false}
            className={`w-56 rounded-md border bg-neutral-900 px-2 py-1 pr-6 text-xs text-neutral-200 placeholder:text-neutral-600 ${
              compiledSearch.error ? 'border-red-700' : 'border-neutral-700'
            }`}
          />
          {search.term && (
            <button
              type="button"
              onClick={() => setSearch({ term: '' })}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSearch({ mode: search.mode === 'regex' ? 'text' : 'regex' })}
          aria-pressed={search.mode === 'regex'}
          title="Toggle regex mode"
          className={`rounded-md border px-1.5 py-1 font-mono text-[10px] ${
            search.mode === 'regex'
              ? 'border-indigo-500 bg-indigo-900/50 text-indigo-300'
              : 'border-neutral-700 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          .*
        </button>
        <button
          type="button"
          onClick={() => setSearch({ caseSensitive: !search.caseSensitive })}
          aria-pressed={search.caseSensitive}
          title="Toggle case sensitivity"
          className={`rounded-md border px-1.5 py-1 text-[10px] font-semibold ${
            search.caseSensitive
              ? 'border-indigo-500 bg-indigo-900/50 text-indigo-300'
              : 'border-neutral-700 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Aa
        </button>
      </div>
      {compiledSearch.error && <span className="text-xs text-red-400">Invalid regex: {compiledSearch.error}</span>}

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
        <button onClick={onOpenClear} className="rounded-md px-2 py-1 text-xs text-red-400/80 hover:text-red-400">
          Clear logs…
        </button>
      </div>
    </div>
  )
}

export default DebugLogFilterBar
