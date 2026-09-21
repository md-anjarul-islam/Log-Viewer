import { useState } from 'react'

interface ClearLogsDialogProps {
  open: boolean
  onClose: () => void
  onClearAll: () => void
  onClearOlderThan: (days: number) => void
}

function ClearLogsDialog({ open, onClose, onClearAll, onClearOlderThan }: ClearLogsDialogProps): React.JSX.Element | null {
  const [days, setDays] = useState('7')
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-neutral-100">Clear logs</h2>

        <div className="mt-4 space-y-3">
          <button
            onClick={() => {
              onClearAll()
              onClose()
            }}
            className="w-full rounded-md bg-red-900/60 px-3 py-2 text-left text-sm text-red-200 hover:bg-red-900"
          >
            Clear all logs
          </button>

          <div className="flex items-center gap-2 rounded-md border border-neutral-800 px-3 py-2">
            <span className="text-sm text-neutral-300">Older than</span>
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-16 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-100"
            />
            <span className="text-sm text-neutral-300">days</span>
            <button
              onClick={() => {
                onClearOlderThan(Number(days))
                onClose()
              }}
              className="ml-auto rounded-md bg-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="text-sm text-neutral-400 hover:text-neutral-200">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClearLogsDialog
