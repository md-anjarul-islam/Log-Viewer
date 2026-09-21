import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useLogsStore } from '../../store/logsStore'
import { useLogStream } from '../../hooks/useLogStream'
import { useAutoScroll } from '../../hooks/useAutoScroll'
import LogRow from './LogRow'

function LogStreamView(): React.JSX.Element {
  useLogStream()
  const entries = useLogsStore((s) => s.entries)
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 20
  })

  const { isAtBottom, newCount, jumpToBottom } = useAutoScroll(parentRef, virtualizer, entries.length)

  return (
    <div className="relative flex h-full flex-col p-6">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-100">Logs</h1>
        <span className="text-xs text-neutral-500">{entries.length} lines</span>
      </div>

      <div ref={parentRef} className="flex-1 overflow-auto rounded-lg border border-neutral-800 bg-neutral-900">
        {entries.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-600">
            Connect to a serial device and run a command to see logs here.
          </div>
        ) : (
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
                <LogRow entry={entries[virtualRow.index]} />
              </div>
            ))}
          </div>
        )}
      </div>

      {!isAtBottom && newCount > 0 && (
        <button
          onClick={jumpToBottom}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-indigo-500"
        >
          New logs ↓ ({newCount})
        </button>
      )}
    </div>
  )
}

export default LogStreamView
