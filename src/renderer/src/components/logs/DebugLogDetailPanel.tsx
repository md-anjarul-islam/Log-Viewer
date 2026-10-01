import type { DebugLogEntry } from '@shared/types'
import { useResizableWidth } from '../../hooks/useResizableWidth'
import ResizeHandle from '../layout/ResizeHandle'

interface DebugLogDetailPanelProps {
  entry: DebugLogEntry | null
  onClose: () => void
}

function DebugLogDetailPanel({ entry, onClose }: DebugLogDetailPanelProps): React.JSX.Element | null {
  const resize = useResizableWidth({
    storageKey: 'panelWidth.debugLogDetail',
    defaultWidth: 384,
    minWidth: 320,
    maxWidth: 900,
    handleSide: 'left'
  })

  if (!entry) return null

  return (
    <div
      style={{ width: resize.width }}
      className="absolute inset-y-0 right-0 z-40 flex max-w-full flex-col border-l border-neutral-800 bg-neutral-950 shadow-2xl"
    >
      <ResizeHandle side="left" active={resize.isDragging} handleProps={resize.handleProps} />
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
