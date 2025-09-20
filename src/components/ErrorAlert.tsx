import { Refresh } from '@mui/icons-material'
import { Alert, AlertTitle, Button } from '@mui/material'
import { AppError } from '../types'

interface ErrorAlertProps {
  error: Error | AppError | string
  onRetry?: () => void
  showRetry?: boolean
  severity?: 'error' | 'warning' | 'info'
}

export const ErrorAlert = ({ 
  error, 
  onRetry, 
  showRetry = false,
  severity = 'error'
}: ErrorAlertProps) => {
  const getErrorMessage = (err: Error | AppError | string): string => {
    if (typeof err === 'string') {
      return err
    }
    
    if (err instanceof AppError) {
      switch (err.type) {
        case 'NETWORK_ERROR':
          return 'Network error. Please check your connection and try again.'
        case 'NOT_FOUND_ERROR':
          return 'The requested resource was not found.'
        case 'VALIDATION_ERROR':
          return err.message
        case 'RATE_LIMIT_ERROR':
          return 'Too many requests. Please wait a moment and try again.'
        case 'CAPACITY_EXCEEDED':
          return 'This event is at full capacity.'
        default:
          return err.message || 'An unexpected error occurred.'
      }
    }
    
    return err.message || 'An unexpected error occurred.'
  }

  const getErrorTitle = (err: Error | AppError | string): string | undefined => {
    if (typeof err === 'string') {
      return undefined
    }
    
    if (err instanceof AppError) {
      switch (err.type) {
        case 'NETWORK_ERROR':
          return 'Connection Error'
        case 'NOT_FOUND_ERROR':
          return 'Not Found'
        case 'VALIDATION_ERROR':
          return 'Validation Error'
        case 'RATE_LIMIT_ERROR':
          return 'Rate Limit Exceeded'
        case 'CAPACITY_EXCEEDED':
          return 'Event Full'
        default:
          return 'Error'
      }
    }
    
    return 'Error'
  }

  const getSeverity = (err: Error | AppError | string): 'error' | 'warning' | 'info' => {
    if (typeof err === 'string') {
      return severity
    }
    
    if (err instanceof AppError) {
      switch (err.type) {
        case 'CAPACITY_EXCEEDED':
          return 'warning'
        case 'RATE_LIMIT_ERROR':
          return 'warning'
        case 'VALIDATION_ERROR':
          return 'warning'
        default:
          return 'error'
      }
    }
    
    return severity
  }

  const errorMessage = getErrorMessage(error)
  const errorTitle = getErrorTitle(error)
  const alertSeverity = getSeverity(error)

  return (
    <Alert 
      severity={alertSeverity}
      action={
        showRetry && onRetry ? (
          <Button
            color="inherit"
            size="small"
            onClick={onRetry}
            startIcon={<Refresh />}
          >
            Retry
          </Button>
        ) : undefined
      }
    >
      {errorTitle && <AlertTitle>{errorTitle}</AlertTitle>}
      {errorMessage}
    </Alert>
  )
}