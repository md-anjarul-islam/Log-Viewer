import { memo } from 'react'
import type { DebugLogEntry } from '@shared/types'
import { highlightSegments, type CompiledSearch } from '../../lib/logSearch'

interface DebugLogRowProps {
  entry: DebugLogEntry
  measureRef?: (el: HTMLDivElement | null) => void
  onSelect?: (entry: DebugLogEntry) => void
  highlight?: CompiledSearch
  isSelected?: boolean
}

function DebugLogRowImpl({ entry, measureRef, onSelect, highlight, isSelected }: DebugLogRowProps): React.JSX.Element {
  const time = new Date(entry.timestamp).toLocaleTimeString()
  const displayText = entry.raw
  const segments = highlight?.regex ? highlightSegments(displayText, highlight) : null

  return (
    <div
      ref={measureRef}
      onClick={() => onSelect?.(entry)}
      className={`cursor-pointer border-b border-neutral-900 border-l-2 px-3 py-1.5 ${
        isSelected
          ? 'border-l-indigo-500 bg-indigo-500/15 hover:bg-indigo-500/20'
          : 'border-l-transparent hover:bg-neutral-800/50'
      }`}
    >
      <div className="flex items-start gap-2 font-mono text-xs">
        <span className="shrink-0 pt-0.5 text-neutral-600">{time}</span>
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

export default memo(DebugLogRowImpl)
