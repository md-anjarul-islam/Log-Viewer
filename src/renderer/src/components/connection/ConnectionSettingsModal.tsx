import { useEffect, useState } from 'react'
import { useSerialStore } from '../../store/serialStore'
import { useDebugSerialStore } from '../../store/debugSerialStore'
import { useSerialConnectionForm } from '../../hooks/useSerialConnectionForm'
import SerialConnectionFields from './SerialConnectionFields'

interface ConnectionSettingsModalProps {
  open: boolean
  onClose: () => void
}

interface AutoReconnectToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

function AutoReconnectToggle({ checked, onChange }: AutoReconnectToggleProps): React.JSX.Element {
  return (
    <label
      className="flex items-center gap-1.5 text-xs text-neutral-400"
      title="Automatically reconnect to the last device when it becomes available again"
    >
      <span>Auto-reconnect</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-4 w-8 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-indigo-600' : 'bg-neutral-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  )
}

function ConnectionSettingsModal({ open, onClose }: ConnectionSettingsModalProps): React.JSX.Element | null {
  const ports = useSerialStore((s) => s.ports)
  const loadingPorts = useSerialStore((s) => s.loadingPorts)
  const status = useSerialStore((s) => s.status)
  const connecting = useSerialStore((s) => s.connecting)
  const lastError = useSerialStore((s) => s.lastError)
  const autoReconnect = useSerialStore((s) => s.autoReconnect)
  const refreshPorts = useSerialStore((s) => s.refreshPorts)
  const connect = useSerialStore((s) => s.connect)
  const disconnect = useSerialStore((s) => s.disconnect)
  const setAutoReconnect = useSerialStore((s) => s.setAutoReconnect)

  const debugStatus = useDebugSerialStore((s) => s.status)
  const debugConnecting = useDebugSerialStore((s) => s.connecting)
  const debugLastError = useDebugSerialStore((s) => s.lastError)
  const debugAutoReconnect = useDebugSerialStore((s) => s.autoReconnect)
  const debugConnect = useDebugSerialStore((s) => s.connect)
  const debugDisconnect = useDebugSerialStore((s) => s.disconnect)
  const debugSetAutoReconnect = useDebugSerialStore((s) => s.setAutoReconnect)

  const mainForm = useSerialConnectionForm()
  const debugForm = useSerialConnectionForm()
  const [debugEnabled, setDebugEnabled] = useState(false)

  useEffect(() => {
    if (open) refreshPorts()
  }, [open, refreshPorts])

  useEffect(() => {
    if (!mainForm.selectedPath && ports.length > 0) mainForm.setSelectedPath(ports[0].path)
    if (!debugForm.selectedPath && ports.length > 0) debugForm.setSelectedPath(ports[0].path)
  }, [ports, mainForm.selectedPath, debugForm.selectedPath, mainForm.setSelectedPath, debugForm.setSelectedPath])

  if (!open) return null

  const debugPortConflict =
    debugEnabled && !debugStatus.connected && debugForm.selectedPath !== '' && debugForm.selectedPath === mainForm.selectedPath

  const handleConnectMain = async (): Promise<void> => {
    await connect(mainForm.selectedPath, mainForm.baudRate, mainForm.delimiterHex)
  }

  const handleConnectDebug = async (): Promise<void> => {
    if (debugPortConflict) return
    await debugConnect(debugForm.selectedPath, debugForm.baudRate, debugForm.delimiterHex)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-100">Connection settings</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-5">
          <section className="rounded-md border border-neutral-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-200">Hardware connection</h3>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    status.connected ? 'bg-emerald-500' : status.reconnecting ? 'animate-pulse bg-amber-500' : 'bg-neutral-600'
                  }`}
                />
                <span className="text-xs text-neutral-400">
                  {status.connected ? `Connected — ${status.path}` : status.reconnecting ? 'Reconnecting…' : 'Disconnected'}
                </span>
              </div>
            </div>

            {!status.connected && !status.reconnecting && (
              <SerialConnectionFields idPrefix="main" form={mainForm} ports={ports} loadingPorts={loadingPorts} onRefresh={refreshPorts} />
            )}

            <div className="mt-3 flex items-center justify-between">
              <AutoReconnectToggle checked={autoReconnect} onChange={setAutoReconnect} />
              {status.connected || status.reconnecting ? (
                <button
                  onClick={() => disconnect()}
                  className="rounded-md bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-200 hover:bg-neutral-700"
                >
                  {status.reconnecting ? 'Cancel' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={handleConnectMain}
                  disabled={!mainForm.selectedPath || connecting || !mainForm.delimiterValid}
                  className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {connecting ? 'Connecting…' : 'Connect'}
                </button>
              )}
            </div>
            {lastError && <p className="mt-2 text-xs text-red-400">{lastError}</p>}
          </section>

          <section className="rounded-md border border-neutral-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
                <input
                  type="checkbox"
                  checked={debugEnabled || debugStatus.connected || debugStatus.reconnecting}
                  disabled={debugStatus.connected || debugStatus.reconnecting}
                  onChange={(e) => setDebugEnabled(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                />
                Debug connection <span className="font-normal text-neutral-500">(optional)</span>
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    debugStatus.connected ? 'bg-emerald-500' : debugStatus.reconnecting ? 'animate-pulse bg-amber-500' : 'bg-neutral-600'
                  }`}
                />
                <span className="text-xs text-neutral-400">
                  {debugStatus.connected
                    ? `Connected — ${debugStatus.path}`
                    : debugStatus.reconnecting
                      ? 'Reconnecting…'
                      : 'Disconnected'}
                </span>
              </div>
            </div>

            <p className="mb-3 text-xs text-neutral-500">
              Listens on a second serial link to the same hardware (e.g. a dedicated debug/logging UART) and stores its
              output separately, under Debug Logs.
            </p>

            {(debugEnabled || debugStatus.connected || debugStatus.reconnecting) && (
              <>
                {!debugStatus.connected && !debugStatus.reconnecting && (
                  <SerialConnectionFields
                    idPrefix="debug"
                    form={debugForm}
                    ports={ports}
                    loadingPorts={loadingPorts}
                    onRefresh={refreshPorts}
                  />
                )}

                <div className="mt-3 flex items-center justify-between">
                  <AutoReconnectToggle checked={debugAutoReconnect} onChange={debugSetAutoReconnect} />
                  {debugStatus.connected || debugStatus.reconnecting ? (
                    <button
                      onClick={() => debugDisconnect()}
                      className="rounded-md bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-200 hover:bg-neutral-700"
                    >
                      {debugStatus.reconnecting ? 'Cancel' : 'Disconnect'}
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectDebug}
                      disabled={!debugForm.selectedPath || debugConnecting || !debugForm.delimiterValid || debugPortConflict}
                      className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {debugConnecting ? 'Connecting…' : 'Connect'}
                    </button>
                  )}
                </div>
                {debugPortConflict && (
                  <p className="mt-2 text-xs text-red-400">
                    Debug port must be different from the main connection port.
                  </p>
                )}
                {debugLastError && <p className="mt-2 text-xs text-red-400">{debugLastError}</p>}
              </>
            )}
          </section>
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="text-sm text-neutral-400 hover:text-neutral-200">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConnectionSettingsModal
