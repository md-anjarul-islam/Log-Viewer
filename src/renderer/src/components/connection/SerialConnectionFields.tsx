import type { SerialPortInfo } from '@shared/types'
import { COMMON_BAUD_RATES, DELIMITER_PRESETS, type SerialConnectionForm } from '../../hooks/useSerialConnectionForm'

interface SerialConnectionFieldsProps {
  idPrefix: string
  form: SerialConnectionForm
  ports: SerialPortInfo[]
  loadingPorts: boolean
  onRefresh: () => void
  disabled?: boolean
}

function SerialConnectionFields({
  idPrefix,
  form,
  ports,
  loadingPorts,
  onRefresh,
  disabled
}: SerialConnectionFieldsProps): React.JSX.Element {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label htmlFor={`${idPrefix}-port`} className="w-16 shrink-0 text-xs text-neutral-400">
          Port
        </label>
        <select
          id={`${idPrefix}-port`}
          value={form.selectedPath}
          onChange={(e) => form.setSelectedPath(e.target.value)}
          disabled={disabled}
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 disabled:opacity-50"
        >
          {ports.length === 0 && <option value="">No ports found</option>}
          {ports.map((p) => (
            <option key={p.path} value={p.path}>
              {p.path}
              {p.manufacturer ? ` (${p.manufacturer})` : ''}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRefresh}
          disabled={disabled || loadingPorts}
          className="rounded-md px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor={`${idPrefix}-baud`} className="w-16 shrink-0 text-xs text-neutral-400">
          Baud rate
        </label>
        <select
          id={`${idPrefix}-baud`}
          value={form.baudRate}
          onChange={(e) => form.setBaudRate(Number(e.target.value))}
          disabled={disabled}
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 disabled:opacity-50"
        >
          {COMMON_BAUD_RATES.map((rate) => (
            <option key={rate} value={rate}>
              {rate} baud
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor={`${idPrefix}-delimiter`} className="w-16 shrink-0 text-xs text-neutral-400">
          Delimiter
        </label>
        <select
          id={`${idPrefix}-delimiter`}
          value={form.delimiterPreset}
          onChange={(e) => form.setDelimiterPreset(e.target.value)}
          disabled={disabled}
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 disabled:opacity-50"
        >
          {DELIMITER_PRESETS.map((preset) => (
            <option key={preset.hex} value={preset.hex}>
              {preset.label}
            </option>
          ))}
        </select>
        {form.isCustomDelimiter && (
          <input
            type="text"
            value={form.customDelimiterHex}
            onChange={(e) => form.setCustomDelimiterHex(e.target.value)}
            placeholder="hex bytes, e.g. 04"
            disabled={disabled}
            className="w-28 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 disabled:opacity-50"
          />
        )}
      </div>
      {form.isCustomDelimiter && !form.delimiterValid && (
        <p className="pl-[4.5rem] text-[11px] text-red-400">Enter valid hex bytes (e.g. 04 or 0d0a).</p>
      )}
    </div>
  )
}

export default SerialConnectionFields
