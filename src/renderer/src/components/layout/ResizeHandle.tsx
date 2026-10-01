interface ResizeHandleProps {
  side: 'left' | 'right'
  active: boolean
  handleProps: React.HTMLAttributes<HTMLDivElement>
}

// Thin vertical grip straddling a panel edge. Place inside a `relative` panel.
function ResizeHandle({ side, active, handleProps }: ResizeHandleProps): React.JSX.Element {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      tabIndex={0}
      title="Drag to resize (double-click to reset)"
      {...handleProps}
      className={`absolute inset-y-0 z-50 w-1.5 cursor-col-resize touch-none outline-none transition-colors hover:bg-indigo-500/60 focus-visible:bg-indigo-500/60 ${
        side === 'right' ? '-right-0.5' : '-left-0.5'
      } ${active ? 'bg-indigo-500/80' : ''}`}
    />
  )
}

export default ResizeHandle
