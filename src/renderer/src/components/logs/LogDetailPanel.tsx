import { useEffect, useState } from 'react'
import type { DebugLogEntry, LogEntry } from '@shared/types'
import { encodeForDisplay, type ByteEncodingMode } from '../../lib/byteEncoding'

interface LogDetailPanelProps {
  entry: LogEntry | null
  mode: ByteEncodingMode
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

function LogDetailPanel({ entry, mode, onClose, onJumpToDebugLogs }: LogDetailPanelProps): React.JSX.Element | null {
  const [windowMs, setWindowMs] = useState(DEFAULT_CORRELATION_WINDOW_MS)
  const [correlated, setCorrelated] = useState<DebugLogEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!entry) {
      setCorrelated([])
      return
    }
    let cancelled = false
    setLoading(true)
    window.api.debugLogs
      .queryAroundTimestamp({ centerTimestamp: entry.timestamp, windowMs })
      .then((entries) => {
        if (!cancelled) setCorrelated(entries)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [entry?.id, entry?.timestamp, windowMs])

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
            {correlated.map((d) => (
              <li key={d.id} className="rounded bg-neutral-900 px-2 py-1">
                <div className="text-[10px] text-neutral-500">{new Date(d.timestamp).toLocaleTimeString()}</div>
                <div className="whitespace-pre-wrap break-all text-neutral-300">{encodeForDisplay(d.raw, mode)}</div>
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
