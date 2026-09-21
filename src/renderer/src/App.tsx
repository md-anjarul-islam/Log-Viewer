import { useState } from 'react'
import Sidebar, { type View } from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import CommandsView from './components/commands/CommandsView'
import LogStreamView from './components/logs/LogStreamView'
import { useCommands } from './hooks/useCommands'
import { useLogStream } from './hooks/useLogStream'

function App(): React.JSX.Element {
  const [view, setView] = useState<View>('commands')

  // Mounted here (not inside CommandsView/LogStreamView) so these IPC
  // subscriptions stay alive regardless of which tab is showing — otherwise
  // navigating away and back silently drops commands:changed/logs:stream
  // events that arrived while unmounted.
  useCommands()
  useLogStream()

  return (
    <div className="flex h-screen w-screen bg-neutral-950 text-neutral-100">
      <Sidebar active={view} onSelect={setView} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          {view === 'commands' ? <CommandsView /> : <LogStreamView />}
        </main>
      </div>
    </div>
  )
}

export default App
