import { memo } from 'react'
import type { LogEntry } from '@shared/types'

interface LogRowProps {
  entry: LogEntry
  measureRef?: (el: HTMLDivElement | null) => void
  onSelect?: (entry: LogEntry) => void
}

const SOURCE_STYLES: Record<LogEntry['source'], string> = {
  manual: 'bg-indigo-900/50 text-indigo-300',
  scheduled: 'bg-sky-900/50 text-sky-300',
  unsolicited: 'bg-neutral-800 text-neutral-500'
}

function LogRowImpl({ entry, measureRef, onSelect }: LogRowProps): React.JSX.Element {
  const time = new Date(entry.timestamp).toLocaleTimeString()
  const prettyJson = entry.format === 'json' && entry.parsed ? formatJson(entry.parsed) : null

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
        {prettyJson ? (
          <pre className="whitespace-pre-wrap text-emerald-300">{prettyJson}</pre>
        ) : (
          <span className="whitespace-pre-wrap text-neutral-300">{entry.raw}</span>
        )}
      </div>
    </div>
  )
}

function formatJson(parsed: string): string {
  try {
    return JSON.stringify(JSON.parse(parsed), null, 2)
  } catch {
    return parsed
  }
}

export default memo(LogRowImpl)
