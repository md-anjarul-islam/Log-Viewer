import { useEffect } from 'react'
import { useSerialStore } from '../store/serialStore'

export function useSerialStatus(): void {
  useEffect(() => {
    useSerialStore.getState().refreshPorts()
    const unsubscribe = window.api.serial.onStatus((status) => {
      useSerialStore.setState({ status })
    })
    return unsubscribe
  }, [])
}
