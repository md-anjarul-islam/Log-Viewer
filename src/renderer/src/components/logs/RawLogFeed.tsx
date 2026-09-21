import { useEffect, useRef, useState } from 'react'
import type { RawSerialLine } from '@shared/types'

const MAX_LINES = 500

// Throwaway, unpersisted raw feed used only to prove bytes flow both ways
// against real hardware. Replaced by the persisted, virtualized log stream
// view once log persistence + LogIngestor land.
function RawLogFeed(): React.JSX.Element {
  const [lines, setLines] = useState<RawSerialLine[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = window.api.serial.onLine((line) => {
      setLines((prev) => {
        const next = [...prev, line]
        return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next
      })
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-100">Logs (raw feed)</h1>
        <span className="text-xs text-neutral-500">{lines.length} lines</span>
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-auto rounded-lg border border-neutral-800 bg-neutral-900 p-3 font-mono text-xs"
      >
        {lines.length === 0 ? (
          <div className="flex h-full items-center justify-center text-neutral-600">
            Connect to a serial device and run a command to see output here.
          </div>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap text-neutral-300">
              <span className="mr-2 text-neutral-600">
                {new Date(line.timestamp).toLocaleTimeString()}
              </span>
              {line.raw}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default RawLogFeed
