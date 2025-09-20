import { useEffect, useState } from 'react'
import { useNotification } from '../components/NotificationProvider'

interface NetworkStatus {
  isOnline: boolean
  isSlowConnection: boolean
  connectionType: string | null
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: null
  })
  
  const { showWarning, showInfo } = useNotification()

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      
      setNetworkStatus({
        isOnline: navigator.onLine,
        isSlowConnection: connection ? connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' : false,
        connectionType: connection ? connection.effectiveType : null
      })
    }

    const handleOnline = () => {
      updateNetworkStatus()
      showInfo('Connection restored')
    }

    const handleOffline = () => {
      updateNetworkStatus()
      showWarning('You are currently offline. Some features may not work properly.')
    }

    const handleConnectionChange = () => {
      updateNetworkStatus()
      
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
        showWarning('Slow connection detected. Operations may take longer than usual.')
      }
    }

    // Initial status
    updateNetworkStatus()

    // Event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [showWarning, showInfo])

  return networkStatus
}