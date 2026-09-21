import { useEffect } from 'react'
import { useCommandsStore } from '../store/commandsStore'

export function useCommands(): void {
  useEffect(() => {
    useCommandsStore.getState().load()
    const unsubscribe = window.api.commands.onChanged((commands) => {
      useCommandsStore.setState({ commands })
    })
    return unsubscribe
  }, [])
}
