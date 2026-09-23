import { useState } from 'react'
import type { Command } from '@shared/types'
import { useCommandsStore } from '../../store/commandsStore'
import { useCategoriesStore } from '../../store/categoriesStore'
import { useSerialStore } from '../../store/serialStore'
import CommandList from './CommandList'
import CommandEditorDialog from './CommandEditorDialog'

function CommandsView(): React.JSX.Element {
  const commands = useCommandsStore((state) => state.commands)
  const create = useCommandsStore((state) => state.create)
  const update = useCommandsStore((state) => state.update)
  const remove = useCommandsStore((state) => state.remove)
  const categories = useCategoriesStore((state) => state.categories)
  const serialConnected = useSerialStore((state) => state.status.connected)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Command | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<string | null>(null)

  async function handleExport(): Promise<void> {
    setExporting(true)
    setExportStatus(null)
    try {
      const result = await window.api.commands.export()
      if (!result.canceled) setExportStatus(`Exported ${result.count} command${result.count === 1 ? '' : 's'}`)
    } catch {
      setExportStatus('Export failed')
    } finally {
      setExporting(false)
      setTimeout(() => setExportStatus(null), 4000)
    }
  }

  async function handleImport(): Promise<void> {
    setImporting(true)
    setImportStatus(null)
    try {
      const result = await window.api.commands.import()
      if (!result.canceled) {
        const parts = [
          `Imported ${result.commandsImported ?? 0} command${result.commandsImported === 1 ? '' : 's'}`,
          `skipped ${result.commandsSkipped ?? 0}`
        ]
        if ((result.categoriesImported ?? 0) > 0) {
          parts.push(`added ${result.categoriesImported} categor${result.categoriesImported === 1 ? 'y' : 'ies'}`)
        }
        if (result.errors?.length) parts.push(`${result.errors.length} error${result.errors.length === 1 ? '' : 's'}`)
        setImportStatus(parts.join(', '))
      }
    } catch {
      setImportStatus('Import failed')
    } finally {
      setImporting(false)
      setTimeout(() => setImportStatus(null), 6000)
    }
  }

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
        <div className="flex items-center gap-3">
          {importStatus && <span className="text-xs text-neutral-500">{importStatus}</span>}
          {exportStatus && <span className="text-xs text-neutral-500">{exportStatus}</span>}
          <button
            onClick={handleImport}
            disabled={importing}
            className="rounded-md border border-neutral-700 px-2 py-1.5 text-sm text-neutral-300 hover:border-neutral-600 hover:text-neutral-100 disabled:opacity-50"
          >
            {importing ? 'Importing…' : 'Import…'}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="rounded-md border border-neutral-700 px-2 py-1.5 text-sm text-neutral-300 hover:border-neutral-600 hover:text-neutral-100 disabled:opacity-50"
          >
            {exporting ? 'Exporting…' : 'Export…'}
          </button>
          <button
            onClick={openCreate}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            New command
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <CommandList
          commands={commands}
          categories={categories}
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
