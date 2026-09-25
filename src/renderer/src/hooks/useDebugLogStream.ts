import { useEffect, useRef } from 'react'
import type { DebugLogEntry } from '@shared/types'
import { useDebugLogsStore } from '../store/debugLogsStore'

// Mirrors useLogStream's per-frame batching for the debug connection's stream.
export function useDebugLogStream(): void {
  const bufferRef = useRef<DebugLogEntry[]>([])
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const flush = (): void => {
      frameRef.current = null
      if (bufferRef.current.length === 0) return
      const batch = bufferRef.current
      bufferRef.current = []
      useDebugLogsStore.getState().appendBatch(batch)
    }

    const unsubscribeEntry = window.api.debugLogs.onEntry((entry) => {
      bufferRef.current.push(entry)
      if (frameRef.current == null) {
        frameRef.current = requestAnimationFrame(flush)
      }
    })

    const unsubscribeCleared = window.api.debugLogs.onCleared(({ olderThanIso }) => {
      if (olderThanIso == null) {
        useDebugLogsStore.getState().clearEntries()
      } else {
        useDebugLogsStore.getState().removeOlderThan(olderThanIso)
      }
    })

    return () => {
      unsubscribeEntry()
      unsubscribeCleared()
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    }
  }, [])
}
