import { useEffect, useRef, useState } from 'react'
import type { Virtualizer } from '@tanstack/react-virtual'

const BOTTOM_THRESHOLD_PX = 48

interface AutoScrollResult {
  isAtBottom: boolean
  newCount: number
  jumpToBottom: () => void
}

// Tracks whether the viewer is scrolled to the bottom of the log list and,
// while so, imperatively keeps the view pinned there as new entries arrive
// (not state-driven, to avoid a layout-thrash/re-render loop). The moment
// the user scrolls up, auto-scroll disarms and new arrivals are counted
// instead, surfaced via a "jump to bottom" affordance.
export function useAutoScroll(
  scrollElRef: React.RefObject<HTMLDivElement | null>,
  virtualizer: Virtualizer<HTMLDivElement, Element>,
  itemCount: number
): AutoScrollResult {
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [newCount, setNewCount] = useState(0)
  const isAtBottomRef = useRef(true)
  const lastCountRef = useRef(itemCount)

  useEffect(() => {
    const el = scrollElRef.current
    if (!el) return

    const handleScroll = (): void => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      const atBottom = distanceFromBottom < BOTTOM_THRESHOLD_PX
      isAtBottomRef.current = atBottom
      setIsAtBottom(atBottom)
      if (atBottom) setNewCount(0)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [scrollElRef])

  useEffect(() => {
    const added = itemCount - lastCountRef.current
    lastCountRef.current = itemCount
    if (added <= 0) return

    if (isAtBottomRef.current) {
      virtualizer.scrollToIndex(itemCount - 1, { align: 'end' })
    } else {
      setNewCount((n) => n + added)
    }
  }, [itemCount, virtualizer])

  function jumpToBottom(): void {
    virtualizer.scrollToIndex(itemCount - 1, { align: 'end' })
    isAtBottomRef.current = true
    setIsAtBottom(true)
    setNewCount(0)
  }

  return { isAtBottom, newCount, jumpToBottom }
}
