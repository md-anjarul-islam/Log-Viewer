import { useCallback, useEffect, useRef, useState } from 'react'

type Axis = 'x' | 'y'

interface UseSplitOptions {
  storageKey: string
  axis: Axis // x: first pane is left, y: first pane is top
  initialRatio?: number
  minFirstPx: number
  minSecondPx: number
}

interface UseSplit {
  containerRef: React.RefObject<HTMLDivElement | null>
  ratio: number
  dragging: boolean
  onPointerDown: (e: React.PointerEvent) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  reset: () => void
}

const KEY_STEP_PX = 24

function load(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key)
    const n = raw === null ? NaN : Number(raw)
    return n > 0 && n < 1 ? n : fallback
  } catch {
    return fallback
  }
}

// Draggable two-pane split. State is a ratio (0-1) of the container so it
// survives window resizes; min pixel sizes are enforced on every update and
// re-applied when the container itself shrinks.
export function useSplit({
  storageKey,
  axis,
  initialRatio = 0.5,
  minFirstPx,
  minSecondPx
}: UseSplitOptions): UseSplit {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [ratio, setRatio] = useState(() => load(storageKey, initialRatio))
  const [dragging, setDragging] = useState(false)

  const clamp = useCallback(
    (r: number): number => {
      const el = containerRef.current
      if (!el) return r
      const total = axis === 'x' ? el.clientWidth : el.clientHeight
      if (total <= minFirstPx + minSecondPx) return minFirstPx / Math.max(total, 1)
      return Math.min(Math.max(r, minFirstPx / total), 1 - minSecondPx / total)
    },
    [axis, minFirstPx, minSecondPx]
  )

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(ratio))
    } catch {
      /* ignore */
    }
  }, [storageKey, ratio])

  // Re-clamp when the window/container shrinks.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setRatio((r) => clamp(r)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [clamp])

  const onPointerDown = useCallback(
    (e: React.PointerEvent): void => {
      const el = containerRef.current
      if (!el) return
      e.preventDefault()
      setDragging(true)
      const rect = el.getBoundingClientRect()
      const move = (ev: PointerEvent): void => {
        const pos = axis === 'x' ? ev.clientX - rect.left : ev.clientY - rect.top
        const total = axis === 'x' ? rect.width : rect.height
        setRatio(clamp(pos / total))
      }
      const up = (): void => {
        setDragging(false)
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    },
    [axis, clamp]
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      const el = containerRef.current
      if (!el) return
      const dec = axis === 'x' ? 'ArrowLeft' : 'ArrowUp'
      const inc = axis === 'x' ? 'ArrowRight' : 'ArrowDown'
      if (e.key !== dec && e.key !== inc) return
      e.preventDefault()
      const total = axis === 'x' ? el.clientWidth : el.clientHeight
      const delta = (e.key === inc ? KEY_STEP_PX : -KEY_STEP_PX) / total
      setRatio((r) => clamp(r + delta))
    },
    [axis, clamp]
  )

  const reset = useCallback(() => setRatio(clamp(initialRatio)), [clamp, initialRatio])

  return { containerRef, ratio, dragging, onPointerDown, onKeyDown, reset }
}
