import { memo } from 'react'
import type { LogEntry } from '@shared/types'
import { highlightSegments, type CompiledSearch } from '../../lib/logSearch'
import { encodeForDisplay, type ByteEncodingMode } from '../../lib/byteEncoding'

interface LogRowProps {
  entry: LogEntry
  mode: ByteEncodingMode
  commandName?: string
  measureRef?: (el: HTMLDivElement | null) => void
  onSelect?: (entry: LogEntry) => void
  highlight?: CompiledSearch
}

const SOURCE_STYLES: Record<LogEntry['source'], string> = {
  manual: 'bg-indigo-900/50 text-indigo-300',
  scheduled: 'bg-sky-900/50 text-sky-300',
  unsolicited: 'bg-neutral-800 text-neutral-500'
}

function LogRowImpl({ entry, mode, commandName, measureRef, onSelect, highlight }: LogRowProps): React.JSX.Element {
  const time = new Date(entry.timestamp).toLocaleTimeString()
  const displayText = encodeForDisplay(entry.raw, mode)
  const segments = highlight?.regex ? highlightSegments(displayText, highlight) : null

  return (
    <div
      ref={measureRef}
      onClick={() => onSelect?.(entry)}
      className="cursor-pointer border-b border-neutral-900 px-3 py-1.5 hover:bg-neutral-800/50"
    >
      <div className="flex items-start gap-2 font-mono text-xs">
        <span className="shrink-0 pt-0.5 text-neutral-600">{time}</span>
        <span className={`shrink-0 rounded px-1 pt-0.5 text-[10px] uppercase ${SOURCE_STYLES[entry.source]}`}>
          {entry.source}
        </span>
        {commandName && (
          <span className="shrink-0 truncate pt-0.5 text-[11px] text-neutral-500">{commandName}</span>
        )}
        <span className="whitespace-pre-wrap text-neutral-300">
          {segments
            ? segments.map((seg, i) =>
                seg.matched ? (
                  <mark key={i} className="rounded-sm bg-amber-500/40 text-amber-100">
                    {seg.text}
                  </mark>
                ) : (
                  <span key={i}>{seg.text}</span>
                )
              )
            : displayText}
        </span>
      </div>
    </div>
  )
}

export default memo(LogRowImpl)
