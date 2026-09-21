import { useState } from 'react'
import Sidebar, { type View } from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import CommandsView from './components/commands/CommandsView'
import LogStreamView from './components/logs/LogStreamView'

function App(): React.JSX.Element {
  const [view, setView] = useState<View>('commands')

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
