import { create } from 'zustand'
import type { LogEntry } from '@shared/types'

// In-memory ring buffer for the live tail. Historical/filtered queries (once
// logs:query lands) are separate state, not this buffer.
const MAX_ENTRIES = 50000

interface LogsState {
  entries: LogEntry[]
  appendBatch: (batch: LogEntry[]) => void
}

export const useLogsStore = create<LogsState>((set) => ({
  entries: [],
  appendBatch: (batch) =>
    set((state) => {
      const next = state.entries.length > 0 ? state.entries.concat(batch) : batch
      return { entries: next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next }
    })
}))
