import { COMMAND_ENCODING_MODES, type CommandEncodingMode } from '../../lib/commandEncoding'

interface CommandEncodingToggleProps {
  mode: CommandEncodingMode
  onChange: (mode: CommandEncodingMode) => void
}

function CommandEncodingToggle({ mode, onChange }: CommandEncodingToggleProps): React.JSX.Element {
  return (
    <div className="flex items-center rounded-md border border-neutral-700 p-0.5">
      {COMMAND_ENCODING_MODES.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          className={`rounded px-2 py-0.5 text-[11px] font-medium uppercase ${
            mode === m ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

export default CommandEncodingToggle
