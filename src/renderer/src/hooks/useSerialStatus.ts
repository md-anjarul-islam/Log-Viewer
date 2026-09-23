import { useEffect } from 'react'
import { useSerialStore } from '../store/serialStore'

export function useSerialStatus(): void {
  useEffect(() => {
    useSerialStore.getState().refreshPorts()
    useSerialStore.getState().loadAutoReconnect()
    window.api.serial.getStatus().then((status) => {
      useSerialStore.setState({ status })
    })
    const unsubscribe = window.api.serial.onStatus((status) => {
      useSerialStore.setState({ status })
    })
    return unsubscribe
  }, [])
}
