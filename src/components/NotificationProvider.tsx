import { Alert, Snackbar, type AlertColor } from '@mui/material'
import { createContext, useContext, useState, type ReactNode } from 'react'

interface Notification {
  id: string
  message: string
  severity: AlertColor
  autoHideDuration?: number
}

interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor, autoHideDuration?: number) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showWarning: (message: string) => void
  showInfo: (message: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = (
    message: string,
    severity: AlertColor = 'info',
    autoHideDuration: number = 6000
  ) => {
    const id = Date.now().toString()
    const notification: Notification = {
      id,
      message,
      severity,
      autoHideDuration
    }
    
    setNotifications(prev => [...prev, notification])
  }

  const showSuccess = (message: string) => showNotification(message, 'success')
  const showError = (message: string) => showNotification(message, 'error', 8000)
  const showWarning = (message: string) => showNotification(message, 'warning')
  const showInfo = (message: string) => showNotification(message, 'info')

  const handleClose = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const contextValue: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.autoHideDuration}
          onClose={() => handleClose(notification.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            // Stack notifications vertically
            bottom: `${16 + (index * 70)}px !important`,
            zIndex: 1400 + index
          }}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={notification.severity}
            variant="filled"
            sx={{ 
              width: '100%',
              minWidth: 300,
              maxWidth: 500
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  )
}

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}