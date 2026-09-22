import type { Category } from '@shared/types'

interface CategoryListProps {
  categories: Category[]
  commandCounts: Map<number, number>
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

function PencilIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M14.69 2.86a1.5 1.5 0 0 1 2.12 0l.33.33a1.5 1.5 0 0 1 0 2.12L8.4 14.05l-3.02.67a.5.5 0 0 1-.6-.6l.67-3.02 9.24-9.24z" />
    </svg>
  )
}

function TrashIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2.5a1 1 0 0 0-1 1V4H4.5a.5.5 0 0 0 0 1H5v10.5A1.5 1.5 0 0 0 6.5 17h7a1.5 1.5 0 0 0 1.5-1.5V5h.5a.5.5 0 0 0 0-1H13v-.5a1 1 0 0 0-1-1H8zM7.5 7a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5z"
      />
    </svg>
  )
}

function CategoryList({ categories, commandCounts, onEdit, onDelete }: CategoryListProps): React.JSX.Element {
  if (categories.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
        No categories yet. Create one to get started.
      </div>
    )
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-neutral-800 text-xs uppercase tracking-wide text-neutral-500">
          <th className="py-2 pr-4 font-medium">Name</th>
          <th className="py-2 pr-4 font-medium">Commands</th>
          <th className="py-2 pr-4 font-medium" />
        </tr>
      </thead>
      <tbody>
        {categories.map((category) => (
          <tr key={category.id} className="border-b border-neutral-900 last:border-0">
            <td className="py-2.5 pr-4 text-neutral-100">{category.name}</td>
            <td className="py-2.5 pr-4 text-neutral-400">{commandCounts.get(category.id) ?? 0}</td>
            <td className="py-2.5 pr-4">
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => onEdit(category)}
                  className="rounded-md p-2 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
                  title="Edit"
                  aria-label="Edit"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => onDelete(category)}
                  className="rounded-md p-2 text-red-500/80 hover:bg-neutral-800 hover:text-red-400"
                  title="Delete"
                  aria-label="Delete"
                >
                  <TrashIcon />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default CategoryList
