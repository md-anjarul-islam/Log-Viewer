import { useEffect, useState } from 'react'

function App(): React.JSX.Element {
  const [appVersion, setAppVersion] = useState<string | null>(null)

  useEffect(() => {
    window.api.getAppVersion().then(setAppVersion)
  }, [])

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 text-neutral-100">
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-8 py-6 text-center">
        <h1 className="text-2xl font-semibold">Log Viewer</h1>
        <p className="mt-2 text-sm text-neutral-400">
          {appVersion ? `Electron app v${appVersion} — IPC bridge working` : 'Connecting to main process…'}
        </p>
      </div>
    </div>
  )
}

export default App
