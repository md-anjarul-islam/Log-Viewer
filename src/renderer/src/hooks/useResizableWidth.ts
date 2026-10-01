import { useCallback, useEffect, useRef, useState } from 'react'

interface UseResizableWidthOptions {
  storageKey: string
  defaultWidth: number
  minWidth: number
  maxWidth: number
  // 'right': the handle sits on the panel's right edge (dragging right grows it).
  // 'left': the handle sits on the panel's left edge (dragging left grows it).
  handleSide: 'left' | 'right'
}

interface ResizableWidth {
  width: number
  isDragging: boolean
  handleProps: {
    onPointerDown: (e: React.PointerEvent) => void
    onKeyDown: (e: React.KeyboardEvent) => void
    onDoubleClick: () => void
  }
}

const KEY_STEP = 16

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function readStored(key: string): number | null {
  try {
    const raw = localStorage.getItem(key)
    const n = raw == null ? NaN : Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

// Drag-to-resize width for a side panel, clamped to [minWidth, maxWidth] and
// persisted per storageKey. Double-click the handle to reset to the default.
export function useResizableWidth({
  storageKey,
  defaultWidth,
  minWidth,
  maxWidth,
  handleSide
}: UseResizableWidthOptions): ResizableWidth {
  const [width, setWidth] = useState(() => clamp(readStored(storageKey) ?? defaultWidth, minWidth, maxWidth))
  const [isDragging, setIsDragging] = useState(false)
  const widthRef = useRef(width)
  widthRef.current = width

  const persist = useCallback(
    (w: number) => {
      try {
        localStorage.setItem(storageKey, String(Math.round(w)))
      } catch {
        // storage unavailable — resizing still works for this session
      }
    },
    [storageKey]
  )

  const sign = handleSide === 'right' ? 1 : -1

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = widthRef.current
      setIsDragging(true)

      const onMove = (ev: PointerEvent): void => {
        setWidth(clamp(startWidth + sign * (ev.clientX - startX), minWidth, maxWidth))
      }
      const onUp = (): void => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        setIsDragging(false)
        persist(widthRef.current)
      }
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [sign, minWidth, maxWidth, persist]
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      const dir = e.key === 'ArrowRight' ? 1 : -1
      const next = clamp(widthRef.current + sign * dir * KEY_STEP, minWidth, maxWidth)
      setWidth(next)
      persist(next)
    },
    [sign, minWidth, maxWidth, persist]
  )

  const onDoubleClick = useCallback(() => {
    const next = clamp(defaultWidth, minWidth, maxWidth)
    setWidth(next)
    persist(next)
  }, [defaultWidth, minWidth, maxWidth, persist])

  // Safety net if the component unmounts mid-drag.
  useEffect(
    () => () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    },
    []
  )

  return { width, isDragging, handleProps: { onPointerDown, onKeyDown, onDoubleClick } }
}
