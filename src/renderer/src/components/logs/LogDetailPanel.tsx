import { useState } from 'react'
import type { LogEntry } from '@shared/types'
import JsonPrettyView from './JsonPrettyView'

interface LogDetailPanelProps {
  entry: LogEntry | null
  onClose: () => void
}

function LogDetailPanel({ entry, onClose }: LogDetailPanelProps): React.JSX.Element | null {
  const [mode, setMode] = useState<'pretty' | 'raw'>('pretty')
  if (!entry) return null

  let parsedValue: unknown = null
  if (entry.format === 'json' && entry.parsed) {
    try {
      parsedValue = JSON.parse(entry.parsed)
    } catch {
      parsedValue = null
    }
  }

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

      {entry.format === 'json' && parsedValue !== null && (
        <div className="flex gap-1 border-b border-neutral-800 px-4 py-2">
          <button
            onClick={() => setMode('pretty')}
            className={`rounded px-2 py-0.5 text-xs ${mode === 'pretty' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500'}`}
          >
            Pretty
          </button>
          <button
            onClick={() => setMode('raw')}
            className={`rounded px-2 py-0.5 text-xs ${mode === 'raw' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500'}`}
          >
            Raw
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 font-mono text-xs">
        {mode === 'pretty' && parsedValue !== null ? (
          <JsonPrettyView value={parsedValue} />
        ) : (
          <pre className="whitespace-pre-wrap text-neutral-300">{entry.raw}</pre>
        )}
      </div>
    </div>
  )
}

export default LogDetailPanel
