import { create } from 'zustand'
import type { DebugLogEntry, DebugLogQueryFilter } from '@shared/types'
import { DEFAULT_SEARCH, type SearchState } from '../lib/logSearch'

// Mirrors logsStore, for the debug connection's stream. There's no command
// to filter by here, so the filter is just a time range.
const MAX_ENTRIES = 50000
const PAGE_SIZE = 200

export interface DebugLogFilterState {
  from: string | null
  to: string | null
}

export const DEFAULT_DEBUG_FILTER: DebugLogFilterState = { from: null, to: null }

export function isDebugFilterActive(filter: DebugLogFilterState): boolean {
  return filter.from != null || filter.to != null
}

interface DebugLogsState {
  entries: DebugLogEntry[]
  appendBatch: (batch: DebugLogEntry[]) => void
  removeOlderThan: (cutoffIso: string) => void
  clearEntries: () => void

  filter: DebugLogFilterState
  historicalResults: DebugLogEntry[]
  historicalCursor: string | null
  historicalLoading: boolean
  setFilter: (patch: Partial<DebugLogFilterState>) => void
  clearFilter: () => void
  runQuery: (loadMore?: boolean) => Promise<void>

  search: SearchState
  setSearch: (patch: Partial<SearchState>) => void
  clearSearch: () => void
}

function toQueryFilter(filter: DebugLogFilterState, cursor: string | null): DebugLogQueryFilter {
  return {
    from: filter.from ?? undefined,
    to: filter.to ?? undefined,
    cursor: cursor ?? undefined,
    limit: PAGE_SIZE
  }
}

export const useDebugLogsStore = create<DebugLogsState>((set, get) => ({
  entries: [],
  appendBatch: (batch) =>
    set((state) => {
      const next = state.entries.length > 0 ? state.entries.concat(batch) : batch
      return { entries: next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next }
    }),
  removeOlderThan: (cutoffIso) =>
    set((state) => ({ entries: state.entries.filter((e) => e.timestamp >= cutoffIso) })),
  clearEntries: () => set({ entries: [] }),

  filter: DEFAULT_DEBUG_FILTER,
  historicalResults: [],
  historicalCursor: null,
  historicalLoading: false,

  setFilter: (patch) => {
    const filter = { ...get().filter, ...patch }
    set({ filter, historicalResults: [], historicalCursor: null })
    if (isDebugFilterActive(filter)) get().runQuery()
  },

  clearFilter: () =>
    set({ filter: DEFAULT_DEBUG_FILTER, historicalResults: [], historicalCursor: null, search: DEFAULT_SEARCH }),

  runQuery: async (loadMore = false) => {
    const { filter, historicalCursor, historicalResults } = get()
    set({ historicalLoading: true })
    const result = await window.api.debugLogs.query(toQueryFilter(filter, loadMore ? historicalCursor : null))
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
