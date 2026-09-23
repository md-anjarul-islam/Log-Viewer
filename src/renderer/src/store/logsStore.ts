import { create } from 'zustand'
import type { LogEntry, LogQueryFilter } from '@shared/types'
import { DEFAULT_SEARCH, type SearchState } from '../lib/logSearch'

// In-memory ring buffer for the live tail.
const MAX_ENTRIES = 50000
const PAGE_SIZE = 200

export interface LogFilterState {
  commandId: number | null
  from: string | null
  to: string | null
}

export const DEFAULT_FILTER: LogFilterState = { commandId: null, from: null, to: null }

export function isFilterActive(filter: LogFilterState): boolean {
  return filter.commandId != null || filter.from != null || filter.to != null
}

interface LogsState {
  // Live tail (no filter applied).
  entries: LogEntry[]
  appendBatch: (batch: LogEntry[]) => void
  removeOlderThan: (cutoffIso: string) => void
  clearEntries: () => void

  // Filtered/historical browsing (a filter is active).
  filter: LogFilterState
  historicalResults: LogEntry[]
  historicalCursor: string | null
  historicalLoading: boolean
  setFilter: (patch: Partial<LogFilterState>) => void
  clearFilter: () => void
  runQuery: (loadMore?: boolean) => Promise<void>

  // Text/regex search — applied client-side on top of whatever is currently
  // loaded (live tail or historical results), so it never touches the DB.
  search: SearchState
  setSearch: (patch: Partial<SearchState>) => void
  clearSearch: () => void
}

function toQueryFilter(filter: LogFilterState, cursor: string | null): LogQueryFilter {
  return {
    commandId: filter.commandId ?? undefined,
    from: filter.from ?? undefined,
    to: filter.to ?? undefined,
    cursor: cursor ?? undefined,
    limit: PAGE_SIZE
  }
}

export const useLogsStore = create<LogsState>((set, get) => ({
  entries: [],
  appendBatch: (batch) =>
    set((state) => {
      const next = state.entries.length > 0 ? state.entries.concat(batch) : batch
      return { entries: next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next }
    }),
  removeOlderThan: (cutoffIso) =>
    set((state) => ({ entries: state.entries.filter((e) => e.timestamp >= cutoffIso) })),
  clearEntries: () => set({ entries: [] }),

  filter: DEFAULT_FILTER,
  historicalResults: [],
  historicalCursor: null,
  historicalLoading: false,

  setFilter: (patch) => {
    const filter = { ...get().filter, ...patch }
    set({ filter, historicalResults: [], historicalCursor: null })
    if (isFilterActive(filter)) get().runQuery()
  },

  clearFilter: () =>
    set({ filter: DEFAULT_FILTER, historicalResults: [], historicalCursor: null, search: DEFAULT_SEARCH }),

  runQuery: async (loadMore = false) => {
    const { filter, historicalCursor, historicalResults } = get()
    set({ historicalLoading: true })
    const result = await window.api.logs.query(toQueryFilter(filter, loadMore ? historicalCursor : null))
    set({
      historicalResults: loadMore ? result.entries.concat(historicalResults) : result.entries,
      historicalCursor: result.nextCursor,
      historicalLoading: false
    })
  },

  search: DEFAULT_SEARCH,
  setSearch: (patch) => set((state) => ({ search: { ...state.search, ...patch } })),
  clearSearch: () => set({ search: DEFAULT_SEARCH })
}))
