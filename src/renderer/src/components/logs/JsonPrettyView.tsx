import { useState } from 'react'

interface JsonPrettyViewProps {
  value: unknown
  depth?: number
}

function JsonPrettyView({ value, depth = 0 }: JsonPrettyViewProps): React.JSX.Element {
  if (value === null) return <span className="text-neutral-500">null</span>
  if (typeof value === 'boolean') return <span className="text-amber-400">{String(value)}</span>
  if (typeof value === 'number') return <span className="text-sky-400">{value}</span>
  if (typeof value === 'string') return <span className="text-emerald-400">&quot;{value}&quot;</span>

  if (Array.isArray(value)) {
    return (
      <JsonCollapsible
        entries={value.map((v, i) => [String(i), v] as const)}
        brackets={['[', ']']}
        depth={depth}
      />
    )
  }

  if (typeof value === 'object') {
    return <JsonCollapsible entries={Object.entries(value)} brackets={['{', '}']} depth={depth} />
  }

  return <span>{String(value)}</span>
}

interface JsonCollapsibleProps {
  entries: readonly (readonly [string, unknown])[]
  brackets: [string, string]
  depth: number
}

function JsonCollapsible({ entries, brackets, depth }: JsonCollapsibleProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(depth > 1)

  if (entries.length === 0) {
    return (
      <span className="text-neutral-500">
        {brackets[0]}
        {brackets[1]}
      </span>
    )
  }

  if (collapsed) {
    return (
      <button onClick={() => setCollapsed(false)} className="text-neutral-500 hover:text-neutral-300">
        {brackets[0]}…{brackets[1]}
      </button>
    )
  }

  return (
    <span>
      <button onClick={() => setCollapsed(true)} className="text-neutral-500 hover:text-neutral-300">
        {brackets[0]}
      </button>
      <div className="ml-4 border-l border-neutral-800 pl-2">
        {entries.map(([key, val], i) => (
          <div key={key}>
            <span className="text-indigo-300">{key}</span>
            <span className="text-neutral-600">: </span>
            <JsonPrettyView value={val} depth={depth + 1} />
            {i < entries.length - 1 && <span className="text-neutral-600">,</span>}
          </div>
        ))}
      </div>
      <span className="text-neutral-500">{brackets[1]}</span>
    </span>
  )
}

export default JsonPrettyView
