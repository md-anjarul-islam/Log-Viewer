import type { DebugLogEntry } from '@shared/types'
import { encodeForDisplay, type ByteEncodingMode } from '../../lib/byteEncoding'

interface DebugLogDetailPanelProps {
  entry: DebugLogEntry | null
  mode: ByteEncodingMode
  onClose: () => void
}

function DebugLogDetailPanel({ entry, mode, onClose }: DebugLogDetailPanelProps): React.JSX.Element | null {
  if (!entry) return null

  return (
    <div className="absolute inset-y-0 right-0 z-40 flex w-96 max-w-full flex-col border-l border-neutral-800 bg-neutral-950 shadow-2xl">
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
        <pre className="whitespace-pre-wrap text-neutral-300">{encodeForDisplay(entry.raw, mode)}</pre>
      </div>
    </div>
  )
}

export default DebugLogDetailPanel
