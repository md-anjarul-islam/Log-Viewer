import { useEffect, useState } from 'react'
import { useSerialStatus } from '../../hooks/useSerialStatus'
import { useSerialStore } from '../../store/serialStore'

const COMMON_BAUD_RATES = [9600, 19200, 38400, 57600, 115200]

function TopBar(): React.JSX.Element {
  useSerialStatus()
  const ports = useSerialStore((s) => s.ports)
  const status = useSerialStore((s) => s.status)
  const loadingPorts = useSerialStore((s) => s.loadingPorts)
  const connecting = useSerialStore((s) => s.connecting)
  const lastError = useSerialStore((s) => s.lastError)
  const autoReconnect = useSerialStore((s) => s.autoReconnect)
  const lastDevice = useSerialStore((s) => s.lastDevice)
  const refreshPorts = useSerialStore((s) => s.refreshPorts)
  const connect = useSerialStore((s) => s.connect)
  const disconnect = useSerialStore((s) => s.disconnect)
  const setAutoReconnect = useSerialStore((s) => s.setAutoReconnect)

  const [selectedPath, setSelectedPath] = useState('')
  const [baudRate, setBaudRate] = useState(9600)

  useEffect(() => {
    if (!selectedPath && ports.length > 0) {
      setSelectedPath(ports[0].path)
    }
  }, [ports, selectedPath])

  return (
    <div className="flex items-center gap-3 border-b border-neutral-800 bg-neutral-950 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            status.connected
              ? 'bg-emerald-500'
              : status.reconnecting
                ? 'animate-pulse bg-amber-500'
                : 'bg-neutral-600'
          }`}
        />
        <span className="text-xs text-neutral-400">
          {status.connected
            ? `Connected — ${status.path}`
            : status.reconnecting
              ? `Reconnecting to ${lastDevice?.path ?? 'device'}…`
              : 'Disconnected'}
        </span>
      </div>

      <div className="mx-2 h-4 w-px bg-neutral-800" />

      {status.reconnecting ? (
        <button
          onClick={() => disconnect()}
          className="rounded-md bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-200 hover:bg-neutral-700"
        >
          Cancel
        </button>
      ) : !status.connected ? (
        <>
          <select
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200"
          >
            {ports.length === 0 && <option value="">No ports found</option>}
            {ports.map((p) => (
              <option key={p.path} value={p.path}>
                {p.path}
                {p.manufacturer ? ` (${p.manufacturer})` : ''}
              </option>
            ))}
          </select>

          <select
            value={baudRate}
            onChange={(e) => setBaudRate(Number(e.target.value))}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200"
          >
            {COMMON_BAUD_RATES.map((rate) => (
              <option key={rate} value={rate}>
                {rate} baud
              </option>
            ))}
          </select>

          <button
            onClick={() => refreshPorts()}
            disabled={loadingPorts}
            className="rounded-md px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
          >
            Refresh
          </button>

          <button
            onClick={() => selectedPath && connect(selectedPath, baudRate)}
            disabled={!selectedPath || connecting}
            className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {connecting ? 'Connecting…' : 'Connect'}
          </button>
        </>
      ) : (
        <button
          onClick={() => disconnect()}
          className="rounded-md bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-200 hover:bg-neutral-700"
        >
          Disconnect
        </button>
      )}

      <label
        className="flex items-center gap-1.5 text-xs text-neutral-400"
        title="Automatically reconnect to the last device when it becomes available again"
      >
        <span>Auto-reconnect</span>
        <button
          type="button"
          role="switch"
          aria-checked={autoReconnect}
          onClick={() => setAutoReconnect(!autoReconnect)}
          className={`relative h-4 w-8 shrink-0 rounded-full transition-colors ${
            autoReconnect ? 'bg-indigo-600' : 'bg-neutral-700'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
              autoReconnect ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </label>

      {lastError && <span className="text-xs text-red-400">{lastError}</span>}
    </div>
  )
}

export default TopBar
