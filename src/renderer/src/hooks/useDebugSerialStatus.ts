import { useEffect } from 'react'
import { useDebugSerialStore } from '../store/debugSerialStore'

export function useDebugSerialStatus(): void {
  useEffect(() => {
    useDebugSerialStore.getState().loadAutoReconnect()
    window.api.serialDebug.getStatus().then((status) => {
      useDebugSerialStore.setState({ status })
    })
    const unsubscribe = window.api.serialDebug.onStatus((status) => {
      useDebugSerialStore.setState({ status })
    })
    return unsubscribe
  }, [])
}
