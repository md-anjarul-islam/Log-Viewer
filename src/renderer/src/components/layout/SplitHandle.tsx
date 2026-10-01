import type { PointerEvent, KeyboardEvent } from 'react'

interface SplitHandleProps {
  axis: 'x' | 'y'
  dragging: boolean
  onPointerDown: (e: PointerEvent) => void
  onKeyDown: (e: KeyboardEvent) => void
  onDoubleClick: () => void
}

// Thin divider between two panes. Double-click resets to the default size.
function SplitHandle({
  axis,
  dragging,
  onPointerDown,
  onKeyDown,
  onDoubleClick
}: SplitHandleProps): React.JSX.Element {
  const vertical = axis === 'x'
  return (
    <div
      role="separator"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      tabIndex={0}
      title="Drag to resize · double-click to reset"
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onDoubleClick={onDoubleClick}
      className={`shrink-0 touch-none select-none bg-neutral-800 transition-colors hover:bg-indigo-500 focus:bg-indigo-500 focus:outline-none ${
        vertical ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'
      } ${dragging ? 'bg-indigo-500' : ''}`}
    />
  )
}

export default SplitHandle
