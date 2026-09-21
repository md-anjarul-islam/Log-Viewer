import type { Command } from '@shared/types'

interface CommandListProps {
  commands: Command[]
  serialConnected: boolean
  onToggleEnabled: (command: Command) => void
  onEdit: (command: Command) => void
  onDelete: (command: Command) => void
  onRunNow: (command: Command) => void
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
            <td className="py-2.5 pr-4 text-right">
              <button
                onClick={() => onRunNow(command)}
                disabled={!serialConnected}
                className="mr-3 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40"
                title={serialConnected ? undefined : 'Connect to a serial port first'}
              >
                Run now
              </button>
              <button
                onClick={() => onEdit(command)}
                className="mr-3 text-xs text-neutral-400 hover:text-neutral-100"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(command)}
                className="text-xs text-red-500/80 hover:text-red-400"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default CommandList
