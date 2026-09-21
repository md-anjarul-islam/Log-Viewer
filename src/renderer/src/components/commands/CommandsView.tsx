import { useState } from 'react'
import type { Command } from '@shared/types'
import { useCommandsStore } from '../../store/commandsStore'
import { useSerialStore } from '../../store/serialStore'
import CommandList from './CommandList'
import CommandEditorDialog from './CommandEditorDialog'

function CommandsView(): React.JSX.Element {
  const commands = useCommandsStore((state) => state.commands)
  const create = useCommandsStore((state) => state.create)
  const update = useCommandsStore((state) => state.update)
  const remove = useCommandsStore((state) => state.remove)
  const serialConnected = useSerialStore((state) => state.status.connected)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Command | null>(null)

  function openCreate(): void {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(command: Command): void {
    setEditing(command)
    setDialogOpen(true)
  }

  async function handleDelete(command: Command): Promise<void> {
    if (window.confirm(`Delete "${command.name}"?`)) {
      await remove(command.id)
    }
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-100">Commands</h1>
        <button
          onClick={openCreate}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          New command
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <CommandList
          commands={commands}
          serialConnected={serialConnected}
          onToggleEnabled={(command) => update(command.id, { enabled: !command.enabled })}
          onEdit={openEdit}
          onDelete={handleDelete}
          onRunNow={(command) => window.api.commands.runNow(command.id)}
        />
      </div>

      <CommandEditorDialog
        open={dialogOpen}
        initial={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={async (input) => {
          if (editing) {
            await update(editing.id, input)
          } else {
            await create(input)
          }
        }}
      />
    </div>
  )
}

export default CommandsView
