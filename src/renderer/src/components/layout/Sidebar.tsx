export type View = 'logs' | 'commands' | 'categories'

interface SidebarProps {
  active: View
  onSelect: (view: View) => void
}

const ITEMS: { id: View; label: string }[] = [
  { id: 'logs', label: 'Logs' },
  { id: 'commands', label: 'Commands' },
  { id: 'categories', label: 'Categories' }
]

function Sidebar({ active, onSelect }: SidebarProps): React.JSX.Element {
  return (
    <nav className="flex w-48 shrink-0 flex-col gap-1 border-r border-neutral-800 bg-neutral-950 p-3">
      <div className="mb-2 px-2 text-sm font-semibold text-neutral-200">Log Viewer</div>
      {ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`rounded-md px-3 py-2 text-left text-sm ${
            active === item.id
              ? 'bg-neutral-800 text-neutral-100'
              : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}

export default Sidebar
