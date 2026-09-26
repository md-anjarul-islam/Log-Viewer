import { useState } from 'react'
import Sidebar, { type View } from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import CommandsView from './components/commands/CommandsView'
import CategoriesView from './components/categories/CategoriesView'
import LogStreamView from './components/logs/LogStreamView'
import DebugLogStreamView from './components/logs/DebugLogStreamView'
import { useCommands } from './hooks/useCommands'
import { useCategories } from './hooks/useCategories'
import { useLogStream } from './hooks/useLogStream'
import { useDebugSerialStatus } from './hooks/useDebugSerialStatus'
import { useDebugLogStream } from './hooks/useDebugLogStream'
import { useDebugLogsStore } from './store/debugLogsStore'

function App(): React.JSX.Element {
  const [view, setView] = useState<View>('commands')

  // Sets the debug-log view's filter to a window around the given serial
  // log's timestamp and switches to it — the "jump to debug view" action
  // from LogDetailPanel.
  function jumpToDebugLogs(centerTimestamp: string, windowMs: number): void {
    const centerMs = new Date(centerTimestamp).getTime()
    useDebugLogsStore.getState().setFilter({
      from: new Date(centerMs - windowMs).toISOString(),
      to: new Date(centerMs + windowMs).toISOString()
    })
    setView('debugLogs')
  }

  // Mounted here (not inside CommandsView/LogStreamView) so these IPC
  // subscriptions stay alive regardless of which tab is showing — otherwise
  // navigating away and back silently drops commands:changed/logs:stream
  // events that arrived while unmounted.
  useCommands()
  useCategories()
  useLogStream()
  useDebugSerialStatus()
  useDebugLogStream()

  return (
    <div className="flex h-screen w-screen bg-neutral-950 text-neutral-100">
      <Sidebar active={view} onSelect={setView} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          {view === 'commands' && <CommandsView />}
          {view === 'categories' && <CategoriesView />}
          {view === 'logs' && <LogStreamView onJumpToDebugLogs={jumpToDebugLogs} />}
          {view === 'debugLogs' && <DebugLogStreamView />}
        </main>
      </div>
    </div>
  )
}

export default App
