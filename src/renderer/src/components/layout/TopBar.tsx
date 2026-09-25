import { useState } from 'react'
import { useSerialStatus } from '../../hooks/useSerialStatus'
import { useSerialStore } from '../../store/serialStore'
import { useDebugSerialStore } from '../../store/debugSerialStore'
import ConnectionSettingsModal from '../connection/ConnectionSettingsModal'

function TopBar(): React.JSX.Element {
  useSerialStatus()
  const status = useSerialStore((s) => s.status)
  const lastDevice = useSerialStore((s) => s.lastDevice)
  const lastError = useSerialStore((s) => s.lastError)
  const disconnect = useSerialStore((s) => s.disconnect)

  const debugStatus = useDebugSerialStore((s) => s.status)
  const debugDisconnect = useDebugSerialStore((s) => s.disconnect)

  const [settingsOpen, setSettingsOpen] = useState(false)

  const showDebugIndicator = debugStatus.connected || debugStatus.reconnecting || Boolean(debugStatus.error)

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
      ) : status.connected ? (
        <button
          onClick={() => disconnect()}
          className="rounded-md bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-200 hover:bg-neutral-700"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={() => setSettingsOpen(true)}
          className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500"
        >
          New Connection
        </button>
      )}

      {status.connected && (
        <button
          onClick={() => setSettingsOpen(true)}
          className="rounded-md px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200"
          title="Connection settings"
        >
          ⚙ Connection settings
        </button>
      )}

      {showDebugIndicator && (
        <>
          <div className="mx-1 h-4 w-px bg-neutral-800" />
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                debugStatus.connected
                  ? 'bg-emerald-500'
                  : debugStatus.reconnecting
                    ? 'animate-pulse bg-amber-500'
                    : 'bg-neutral-600'
              }`}
            />
            <span className="text-xs text-neutral-400">
              {debugStatus.connected
                ? `Debug — ${debugStatus.path}`
                : debugStatus.reconnecting
                  ? 'Debug reconnecting…'
                  : 'Debug disconnected'}
            </span>
          </div>
          {(debugStatus.connected || debugStatus.reconnecting) && (
            <button
              onClick={() => debugDisconnect()}
              className="rounded-md px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200"
            >
              {debugStatus.reconnecting ? 'Cancel debug' : 'Disconnect debug'}
            </button>
          )}
        </>
      )}

      {lastError && <span className="ml-auto text-xs text-red-400">{lastError}</span>}

      <ConnectionSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default TopBar
