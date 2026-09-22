import { useState } from 'react'
import type { Category, Command } from '@shared/types'

interface CommandListProps {
  commands: Command[]
  categories: Category[]
  serialConnected: boolean
  onToggleEnabled: (command: Command) => void
  onEdit: (command: Command) => void
  onDelete: (command: Command) => void
  onRunNow: (command: Command) => unknown
}

function PlayIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M6 4.5v11l9-5.5-9-5.5z" />
    </svg>
  )
}

function RunningIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 animate-spin">
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
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M14.69 2.86a1.5 1.5 0 0 1 2.12 0l.33.33a1.5 1.5 0 0 1 0 2.12L8.4 14.05l-3.02.67a.5.5 0 0 1-.6-.6l.67-3.02 9.24-9.24z" />
    </svg>
  )
}

function TrashIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2.5a1 1 0 0 0-1 1V4H4.5a.5.5 0 0 0 0 1H5v10.5A1.5 1.5 0 0 0 6.5 17h7a1.5 1.5 0 0 0 1.5-1.5V5h.5a.5.5 0 0 0 0-1H13v-.5a1 1 0 0 0-1-1H8zM7.5 7a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5z"
      />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
    >
      <path d="M7 4.5l6 5.5-6 5.5V4.5z" />
    </svg>
  )
}

function formatInterval(ms: number | null): string {
  if (ms == null) return 'Manual only'
  const seconds = ms / 1000
  if (seconds % 60 === 0) return `Every ${seconds / 60} min`
  return `Every ${seconds}s`
}

const CATEGORY_ACCENTS = [
  { dot: 'bg-indigo-400', text: 'text-indigo-300', ring: 'group-hover:border-indigo-500/50' },
  { dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'group-hover:border-emerald-500/50' },
  { dot: 'bg-amber-400', text: 'text-amber-300', ring: 'group-hover:border-amber-500/50' },
  { dot: 'bg-sky-400', text: 'text-sky-300', ring: 'group-hover:border-sky-500/50' },
  { dot: 'bg-rose-400', text: 'text-rose-300', ring: 'group-hover:border-rose-500/50' },
  { dot: 'bg-violet-400', text: 'text-violet-300', ring: 'group-hover:border-violet-500/50' },
  { dot: 'bg-teal-400', text: 'text-teal-300', ring: 'group-hover:border-teal-500/50' },
  { dot: 'bg-orange-400', text: 'text-orange-300', ring: 'group-hover:border-orange-500/50' }
]
const UNCATEGORIZED_ACCENT = {
  dot: 'bg-neutral-500',
  text: 'text-neutral-400',
  ring: 'group-hover:border-neutral-600'
}

function accentFor(key: string | null): (typeof CATEGORY_ACCENTS)[number] {
  if (key == null) return UNCATEGORIZED_ACCENT
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0
  return CATEGORY_ACCENTS[Math.abs(hash) % CATEGORY_ACCENTS.length]
}

function CommandList({
  commands,
  categories,
  serialConnected,
  onToggleEnabled,
  onEdit,
  onDelete,
  onRunNow
}: CommandListProps): React.JSX.Element {
  const [runningIds, setRunningIds] = useState<Set<number>>(new Set())
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

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

  const toggleCollapsed = (key: string): void => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (commands.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
        No commands yet. Create one to get started.
      </div>
    )
  }

  const byCreatedAt = (a: { createdAt: string }, b: { createdAt: string }): number =>
    a.createdAt.localeCompare(b.createdAt)

  const sortedCategories = [...categories].sort(byCreatedAt)
  const groups: { key: string; label: string; commands: Command[] }[] = []
  for (const category of sortedCategories) {
    const inCategory = commands.filter((c) => c.categoryId === category.id).sort(byCreatedAt)
    if (inCategory.length > 0) {
      groups.push({ key: String(category.id), label: category.name, commands: inCategory })
    }
  }
  const uncategorized = commands.filter((c) => c.categoryId == null).sort(byCreatedAt)
  if (uncategorized.length > 0) {
    groups.push({ key: 'uncategorized', label: 'Uncategorized', commands: uncategorized })
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const accent = accentFor(group.key === 'uncategorized' ? null : group.key)
        const isCollapsed = collapsed.has(group.key)
        return (
          <div key={group.key}>
            <button
              onClick={() => toggleCollapsed(group.key)}
              className="mb-3 flex w-full items-center gap-2"
            >
              <ChevronIcon open={!isCollapsed} />
              <span className={`h-2 w-2 rounded-full ${accent.dot}`} />
              <span className={`text-sm font-semibold ${accent.text}`}>{group.label}</span>
              <span className="rounded-full bg-neutral-800 px-1.5 py-0.5 text-[11px] font-medium text-neutral-400">
                {group.commands.length}
              </span>
              <span className="h-px flex-1 bg-neutral-800" />
            </button>

            {!isCollapsed && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                {group.commands.map((command) => (
                  <div
                    key={command.id}
                    className={`group flex flex-col rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 transition-colors ${accent.ring}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-medium text-neutral-100" title={command.name}>
                        {command.name}
                      </span>
                      <button
                        onClick={() => onToggleEnabled(command)}
                        className={`h-4.5 w-8 shrink-0 rounded-full transition-colors ${
                          command.enabled ? 'bg-indigo-600' : 'bg-neutral-700'
                        }`}
                        aria-label={command.enabled ? 'Disable command' : 'Enable command'}
                      >
                        <span
                          className={`block h-3.5 w-3.5 translate-y-0.5 rounded-full bg-white transition-transform ${
                            command.enabled ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <div
                      className="mt-1.5 truncate rounded bg-black/30 px-1.5 py-1 font-mono text-xs text-neutral-400"
                      title={command.commandString}
                    >
                      {command.commandString}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-neutral-500">
                        {formatInterval(command.scheduleIntervalMs)}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleRunNow(command)}
                          disabled={!serialConnected || runningIds.has(command.id)}
                          className={`rounded-md p-1.5 text-indigo-400 hover:bg-neutral-800 hover:text-indigo-300 disabled:pointer-events-none ${
                            !serialConnected ? 'disabled:opacity-40' : ''
                          }`}
                          title={serialConnected ? 'Run now' : 'Connect to a serial port first'}
                          aria-label="Run now"
                        >
                          {runningIds.has(command.id) ? <RunningIcon /> : <PlayIcon />}
                        </button>
                        <button
                          onClick={() => onEdit(command)}
                          className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
                          title="Edit"
                          aria-label="Edit"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          onClick={() => onDelete(command)}
                          className="rounded-md p-1.5 text-red-500/80 hover:bg-neutral-800 hover:text-red-400"
                          title="Delete"
                          aria-label="Delete"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default CommandList
