import type { DebugLogEntry } from '@shared/types'

interface DebugLogDetailPanelProps {
  entry: DebugLogEntry | null
  onClose: () => void
}

function DebugLogDetailPanel({ entry, onClose }: DebugLogDetailPanelProps): React.JSX.Element | null {
  if (!entry) return null

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-neutral-100">Debug log detail</h2>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200" aria-label="Close">
          ✕
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-2 text-xs">
        <span className="text-neutral-500">{new Date(entry.timestamp).toLocaleString()}</span>
      </div>

      <div className="flex-1 overflow-auto p-4 font-mono text-xs">
        <pre className="whitespace-pre-wrap text-neutral-300">{entry.raw}</pre>
      </div>
    </div>
  )
}

export default DebugLogDetailPanel
