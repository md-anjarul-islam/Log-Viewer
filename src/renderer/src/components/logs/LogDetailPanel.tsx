import { useEffect, useMemo, useState } from 'react'
import type { DebugLogEntry, LogEntry } from '@shared/types'
import { encodeForDisplay, type ByteEncodingMode } from '../../lib/byteEncoding'
import { useDebugLogsStore } from '../../store/debugLogsStore'

interface LogDetailPanelProps {
  entry: LogEntry | null
  mode: ByteEncodingMode
  commandName?: string
  onClose: () => void
  onJumpToDebugLogs: (centerTimestamp: string, windowMs: number) => void
}

interface CorrelationWindowOption {
  label: string
  ms: number
}

const CORRELATION_WINDOWS: CorrelationWindowOption[] = [
  { label: '±1s', ms: 1000 },
  { label: '±5s', ms: 5000 },
  { label: '±30s', ms: 30000 }
]

const DEFAULT_CORRELATION_WINDOW_MS = 5000

const NO_ENTRIES: DebugLogEntry[] = []

interface WindowSnapshot {
  entries: DebugLogEntry[]
  truncated: boolean
  // Last live-tail id already in the store when the query was sent. Anything
  // at or below it was in the DB by then (lines are stored before they're
  // streamed), so only newer live lines can be missing from `entries`.
  liveAfterId: number
}

// Live-tail lines newer than afterId whose timestamp falls in [from, to].
// The live tail is in id order (= arrival order), so binary-search the start
// and stop at the first line past the window.
function liveEntriesInWindow(live: DebugLogEntry[], afterId: number, from: string, to: string): DebugLogEntry[] {
  let lo = 0
  let hi = live.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (live[mid].id <= afterId) lo = mid + 1
    else hi = mid
  }
  const result: DebugLogEntry[] = []
  for (let i = lo; i < live.length && live[i].timestamp <= to; i++) {
    if (live[i].timestamp >= from) result.push(live[i])
  }
  return result
}

function LogDetailPanel({
  entry,
  mode,
  commandName,
  onClose,
  onJumpToDebugLogs
}: LogDetailPanelProps): React.JSX.Element | null {
  const [windowMs, setWindowMs] = useState(DEFAULT_CORRELATION_WINDOW_MS)
  const [snapshot, setSnapshot] = useState<WindowSnapshot | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!entry) {
      setSnapshot(null)
      return
    }
    let cancelled = false
    const live = useDebugLogsStore.getState().entries
    const liveAfterId = live.length > 0 ? live[live.length - 1].id : -1
    setLoading(true)
    window.api.debugLogs
      .queryAroundTimestamp({ centerTimestamp: entry.timestamp, windowMs })
      .then(({ entries, truncated }) => {
        if (!cancelled) setSnapshot({ entries, truncated, liveAfterId })
      })
      .catch(() => {
        if (!cancelled) setSnapshot(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [entry?.id, entry?.timestamp, windowMs])

  // The DB query is a one-off snapshot, but the window can extend into the
  // future (e.g. a log that just arrived), so debug lines streamed in after
  // it are merged in live. Skipped when truncated: the snapshot's newer side
  // was cut short, so appending live lines would leave a gap before them.
  const mergeLive = entry != null && snapshot != null && !snapshot.truncated
  const liveEntries = useDebugLogsStore((s) => (mergeLive ? s.entries : NO_ENTRIES))
  const correlated = useMemo(() => {
    if (!entry || !snapshot) return NO_ENTRIES
    if (!mergeLive) return snapshot.entries
    const centerMs = new Date(entry.timestamp).getTime()
    const from = new Date(centerMs - windowMs).toISOString()
    const to = new Date(centerMs + windowMs).toISOString()
    const seen = new Set(snapshot.entries.map((d) => d.id))
    const arrived = liveEntriesInWindow(liveEntries, snapshot.liveAfterId, from, to).filter((d) => !seen.has(d.id))
    if (arrived.length === 0) return snapshot.entries
    return snapshot.entries.concat(arrived).sort((a, b) => a.id - b.id)
  }, [entry?.timestamp, windowMs, snapshot, mergeLive, liveEntries])

  if (!entry) return null

  return (
    <div className="absolute inset-y-0 right-0 z-40 flex w-96 max-w-full flex-col border-l border-neutral-800 bg-neutral-950 shadow-2xl">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-neutral-100">Log detail</h2>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200" aria-label="Close">
          ✕
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-2 text-xs">
        <span className="text-neutral-500">{new Date(entry.timestamp).toLocaleString()}</span>
        <span className="rounded bg-neutral-800 px-1.5 py-0.5 uppercase text-neutral-400">{entry.source}</span>
        {commandName && <span className="text-neutral-400">{commandName}</span>}
      </div>

      <div className="max-h-40 overflow-auto border-b border-neutral-800 p-4 font-mono text-xs">
        <pre className="whitespace-pre-wrap text-neutral-300">{encodeForDisplay(entry.raw, mode)}</pre>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-neutral-800 px-4 py-2">
        <span className="text-xs font-semibold text-neutral-300">Nearby debug logs</span>
        <div className="flex items-center rounded-md border border-neutral-700 p-0.5">
          {CORRELATION_WINDOWS.map((w) => (
            <button
              key={w.ms}
              type="button"
              onClick={() => setWindowMs(w.ms)}
              aria-pressed={windowMs === w.ms}
              className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                windowMs === w.ms ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 font-mono text-xs">
        {loading ? (
          <div className="p-2 text-neutral-600">Loading…</div>
        ) : correlated.length === 0 ? (
          <div className="p-2 text-neutral-600">No debug logs in this window.</div>
        ) : (
          <ul className="space-y-1">
            {snapshot?.truncated && (
              <li className="px-2 py-1 text-[11px] text-amber-400/80">
                Too many debug lines in this window — showing the ones nearest this log on each side.
              </li>
            )}
            {correlated.map((d) => (
              <li key={d.id} className="rounded bg-neutral-900 px-2 py-1">
                <div className="text-[10px] text-neutral-500">{new Date(d.timestamp).toLocaleTimeString()}</div>
                <div className="whitespace-pre-wrap break-all text-neutral-300">{d.raw}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-neutral-800 p-3">
        <button
          onClick={() => {
            onJumpToDebugLogs(entry.timestamp, windowMs)
            onClose()
          }}
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500"
        >
          Jump to debug view at this time
        </button>
      </div>
    </div>
  )
}

export default LogDetailPanel
