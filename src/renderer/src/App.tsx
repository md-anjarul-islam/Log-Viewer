import { useState } from 'react'
import Sidebar, { type View } from './components/layout/Sidebar'
import CommandsView from './components/commands/CommandsView'

function LogsPlaceholder(): React.JSX.Element {
  return (
    <div className="flex h-full items-center justify-center text-sm text-neutral-500">
      Log streaming view is coming in a later milestone.
    </div>
  )
}

function App(): React.JSX.Element {
  const [view, setView] = useState<View>('commands')

  return (
    <div className="flex h-screen w-screen bg-neutral-950 text-neutral-100">
      <Sidebar active={view} onSelect={setView} />
      <main className="flex-1 overflow-hidden">
        {view === 'commands' ? <CommandsView /> : <LogsPlaceholder />}
      </main>
    </div>
  )
}

export default App
