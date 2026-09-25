import { useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { DebugLogEntry } from '@shared/types'
import { isDebugFilterActive, useDebugLogsStore } from '../../store/debugLogsStore'
import { compileSearch, isSearchActive, matchesSearch } from '../../lib/logSearch'
import {
  BYTE_ENCODING_MODES,
  DEFAULT_BYTE_ENCODING_MODE,
  encodeForDisplay,
  type ByteEncodingMode
} from '../../lib/byteEncoding'
import { useAutoScroll } from '../../hooks/useAutoScroll'
import DebugLogRow from './DebugLogRow'
import DebugLogFilterBar from './DebugLogFilterBar'
import DebugLogDetailPanel from './DebugLogDetailPanel'
import ClearLogsDialog from './ClearLogsDialog'

function DebugLogStreamView(): React.JSX.Element {
  const liveEntries = useDebugLogsStore((s) => s.entries)
  const filter = useDebugLogsStore((s) => s.filter)
  const historicalResults = useDebugLogsStore((s) => s.historicalResults)
  const historicalCursor = useDebugLogsStore((s) => s.historicalCursor)
  const historicalLoading = useDebugLogsStore((s) => s.historicalLoading)
  const runQuery = useDebugLogsStore((s) => s.runQuery)
  const search = useDebugLogsStore((s) => s.search)

  const filtered = isDebugFilterActive(filter)
  const baseEntries = filtered ? historicalResults : liveEntries

  const [mode, setMode] = useState<ByteEncodingMode>(DEFAULT_BYTE_ENCODING_MODE)

  const compiledSearch = useMemo(
    () => compileSearch(search),
    [search.term, search.mode, search.caseSensitive]
  )
  const searching = isSearchActive(search)
  const entries = useMemo(
    () =>
      searching
        ? baseEntries.filter((e) => matchesSearch(encodeForDisplay(e.raw, mode), compiledSearch))
        : baseEntries,
    [baseEntries, searching, compiledSearch, mode]
  )

  const parentRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<DebugLogEntry | null>(null)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 20
  })

  const { isAtBottom, newCount, jumpToBottom } = useAutoScroll(parentRef, virtualizer, entries.length, !filtered)

  return (
    <div className="relative flex h-full flex-col p-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-neutral-100">Debug Logs</h1>
          <div className="flex items-center rounded-md border border-neutral-700 p-0.5">
            {BYTE_ENCODING_MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`rounded px-2 py-0.5 text-[11px] font-medium uppercase ${
                  mode === m ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs text-neutral-500">{entries.length} lines</span>
      </div>

      <DebugLogFilterBar onOpenClear={() => setClearDialogOpen(true)} />

      <div ref={parentRef} className="flex-1 overflow-auto rounded-lg border border-neutral-800 bg-neutral-900">
        {entries.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-600">
            {baseEntries.length > 0
              ? 'No debug logs match the current search.'
              : filtered
                ? 'No debug logs match the current filters.'
                : 'Open a debug connection to see its output here.'}
          </div>
        ) : (
          <>
            {filtered && historicalCursor && (
              <div className="flex justify-center border-b border-neutral-800 py-2">
                <button
                  onClick={() => runQuery(true)}
                  disabled={historicalLoading}
                  className="text-xs text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
                >
                  {historicalLoading ? 'Loading…' : 'Load older'}
                </button>
              </div>
            )}
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualRow) => (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                >
                  <DebugLogRow
                    entry={entries[virtualRow.index]}
                    mode={mode}
                    onSelect={setSelected}
                    highlight={compiledSearch}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {!filtered && !isAtBottom && newCount > 0 && (
        <button
          onClick={jumpToBottom}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-indigo-500"
        >
          New logs ↓ ({newCount})
        </button>
      )}

      <DebugLogDetailPanel entry={selected} mode={mode} onClose={() => setSelected(null)} />

      <ClearLogsDialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onClearAll={() => window.api.debugLogs.clearAll()}
        onClearOlderThan={(days) => window.api.debugLogs.clearOlderThan(days)}
      />
    </div>
  )
}

export default DebugLogStreamView
