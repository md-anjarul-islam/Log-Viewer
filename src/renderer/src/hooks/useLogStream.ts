import { useEffect, useRef } from 'react'
import type { LogEntry } from '@shared/types'
import { useLogsStore } from '../store/logsStore'

// Batches incoming log events per animation frame before flushing to the
// store. Flushing on every single line would thrash the virtualizer under a
// high-volume stream and is exactly what causes visible UI jumping.
export function useLogStream(): void {
  const bufferRef = useRef<LogEntry[]>([])
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const flush = (): void => {
      frameRef.current = null
      if (bufferRef.current.length === 0) return
      const batch = bufferRef.current
      bufferRef.current = []
      useLogsStore.getState().appendBatch(batch)
    }

    const unsubscribe = window.api.logs.onEntry((entry) => {
      bufferRef.current.push(entry)
      if (frameRef.current == null) {
        frameRef.current = requestAnimationFrame(flush)
      }
    })

    return () => {
      unsubscribe()
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    }
  }, [])
}
