import { useState } from 'react'
import type { Command } from '@shared/types'

interface CommandListProps {
  commands: Command[]
  serialConnected: boolean
  onToggleEnabled: (command: Command) => void
  onEdit: (command: Command) => void
  onDelete: (command: Command) => void
  onRunNow: (command: Command) => unknown
}

function PlayIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M6 4.5v11l9-5.5-9-5.5z" />
    </svg>
  )
}

function RunningIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 animate-spin">
      <circle
        cx="10"
        cy="10"
        r="7.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity="0.25"
      />
      <path
        d="M17.5 10a7.5 7.5 0 0 0-7.5-7.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PencilIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M14.69 2.86a1.5 1.5 0 0 1 2.12 0l.33.33a1.5 1.5 0 0 1 0 2.12L8.4 14.05l-3.02.67a.5.5 0 0 1-.6-.6l.67-3.02 9.24-9.24z" />
    </svg>
  )
}

function TrashIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2.5a1 1 0 0 0-1 1V4H4.5a.5.5 0 0 0 0 1H5v10.5A1.5 1.5 0 0 0 6.5 17h7a1.5 1.5 0 0 0 1.5-1.5V5h.5a.5.5 0 0 0 0-1H13v-.5a1 1 0 0 0-1-1H8zM7.5 7a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5z"
      />
    </svg>
  )
}

function formatInterval(ms: number | null): string {
  if (ms == null) return 'Manual only'
  const seconds = ms / 1000
  if (seconds % 60 === 0) return `Every ${seconds / 60} min`
  return `Every ${seconds}s`
}

function CommandList({
  commands,
  serialConnected,
  onToggleEnabled,
  onEdit,
  onDelete,
  onRunNow
}: CommandListProps): React.JSX.Element {
  const [runningIds, setRunningIds] = useState<Set<number>>(new Set())

  const handleRunNow = (command: Command): void => {
    if (runningIds.has(command.id)) return
    setRunningIds((prev) => new Set(prev).add(command.id))
    Promise.resolve(onRunNow(command)).finally(() => {
      setRunningIds((prev) => {
        const next = new Set(prev)
        next.delete(command.id)
        return next
      })
    })
  }

  if (commands.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
        No commands yet. Create one to get started.
      </div>
    )
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-neutral-800 text-xs uppercase tracking-wide text-neutral-500">
          <th className="py-2 pr-4 font-medium">Name</th>
          <th className="py-2 pr-4 font-medium">Command</th>
          <th className="py-2 pr-4 font-medium">Schedule</th>
          <th className="py-2 pr-4 font-medium">Enabled</th>
          <th className="py-2 pr-4 font-medium" />
        </tr>
      </thead>
      <tbody>
        {commands.map((command) => (
          <tr key={command.id} className="border-b border-neutral-900 last:border-0">
            <td className="py-2.5 pr-4 text-neutral-100">{command.name}</td>
            <td className="py-2.5 pr-4 font-mono text-xs text-neutral-400">{command.commandString}</td>
            <td className="py-2.5 pr-4 text-neutral-400">{formatInterval(command.scheduleIntervalMs)}</td>
            <td className="py-2.5 pr-4">
              <button
                onClick={() => onToggleEnabled(command)}
                className={`h-5 w-9 rounded-full transition-colors ${
                  command.enabled ? 'bg-indigo-600' : 'bg-neutral-700'
                }`}
                aria-label={command.enabled ? 'Disable command' : 'Enable command'}
              >
                <span
                  className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition-transform ${
                    command.enabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </td>
            <td className="py-2.5 pr-4">
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => handleRunNow(command)}
                  disabled={!serialConnected || runningIds.has(command.id)}
                  className={`rounded-md p-2 text-indigo-400 hover:bg-neutral-800 hover:text-indigo-300 disabled:pointer-events-none ${
                    !serialConnected ? 'disabled:opacity-40' : ''
                  }`}
                  title={serialConnected ? 'Run now' : 'Connect to a serial port first'}
                  aria-label="Run now"
                >
                  {runningIds.has(command.id) ? <RunningIcon /> : <PlayIcon />}
                </button>
                <button
                  onClick={() => onEdit(command)}
                  className="rounded-md p-2 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
                  title="Edit"
                  aria-label="Edit"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => onDelete(command)}
                  className="rounded-md p-2 text-red-500/80 hover:bg-neutral-800 hover:text-red-400"
                  title="Delete"
                  aria-label="Delete"
                >
                  <TrashIcon />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default CommandList
