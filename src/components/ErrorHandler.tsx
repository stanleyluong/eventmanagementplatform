import { Block, Error as ErrorIcon, Refresh, Warning, WifiOff } from '@mui/icons-material'
import {
    Alert,
    AlertTitle,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Typography
} from '@mui/material'
import { AppError } from '../types'

interface ErrorHandlerProps {
  error: Error | AppError | string
  onRetry?: () => void
  onGoBack?: () => void
  showRetry?: boolean
  showGoBack?: boolean
  variant?: 'inline' | 'page' | 'card'
  title?: string
}

export const ErrorHandler = ({ 
  error, 
  onRetry, 
  onGoBack,
  showRetry = true,
  showGoBack = false,
  variant = 'inline',
  title
}: ErrorHandlerProps) => {
  const getErrorInfo = (err: Error | AppError | string) => {
    if (typeof err === 'string') {
      return {
        title: title || 'Error',
        message: err,
        severity: 'error' as const,
        icon: <ErrorIcon />,
        actionable: true
      }
    }
    
    if (err instanceof AppError) {
      switch (err.type) {
        case 'NETWORK_ERROR':
          return {
            title: title || 'Connection Problem',
            message: err.message,
            severity: 'error' as const,
            icon: <WifiOff />,
            actionable: true,
            suggestions: [
              'Check your internet connection',
              'Try refreshing the page',
              'Wait a moment and try again'
            ]
          }
        case 'NOT_FOUND_ERROR':
          return {
            title: title || 'Not Found',
            message: err.message,
            severity: 'warning' as const,
            icon: <Warning />,
            actionable: false,
            suggestions: [
              'Check if the link is correct',
              'The item may have been deleted',
              'Try going back and selecting again'
            ]
          }
        case 'VALIDATION_ERROR':
          return {
            title: title || 'Invalid Data',
            message: err.message,
            severity: 'warning' as const,
            icon: <Warning />,
            actionable: true,
            suggestions: [
              'Please check your input',
              'Make sure all required fields are filled',
              'Verify the format is correct'
            ]
          }
        case 'RATE_LIMIT_ERROR':
          return {
            title: title || 'Too Many Requests',
            message: err.message,
            severity: 'warning' as const,
            icon: <Block />,
            actionable: true,
            suggestions: [
              'Please wait a moment before trying again',
              'Avoid rapid repeated requests',
              'Try again in a few minutes'
            ]
          }
        case 'CAPACITY_EXCEEDED':
          return {
            title: title || 'Event Full',
            message: err.message,
            severity: 'info' as const,
            icon: <Block />,
            actionable: false,
            suggestions: [
              'This event has reached maximum capacity',
              'Check if there are similar events available',
              'Contact the organizer for more information'
            ]
          }
        default:
          return {
            title: title || 'Error',
            message: err.message || 'An unexpected error occurred',
            severity: 'error' as const,
            icon: <ErrorIcon />,
            actionable: true
          }
      }
    }
    
    return {
      title: title || 'Error',
      message: err.message || 'An unexpected error occurred',
      severity: 'error' as const,
      icon: <ErrorIcon />,
      actionable: true
    }
  }

  const errorInfo = getErrorInfo(error)

  const ActionButtons = () => (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
      {showRetry && errorInfo.actionable && onRetry && (
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={onRetry}
          size="small"
        >
          Try Again
        </Button>
      )}
      {showGoBack && onGoBack && (
        <Button
          variant="outlined"
          onClick={onGoBack}
          size="small"
        >
          Go Back
        </Button>
      )}
    </Box>
  )

  const ErrorContent = () => (
    <>
      <Alert 
        severity={errorInfo.severity}
        icon={errorInfo.icon}
        sx={{ mb: errorInfo.suggestions ? 2 : 0 }}
      >
        <AlertTitle>{errorInfo.title}</AlertTitle>
        {errorInfo.message}
      </Alert>
      
      {errorInfo.suggestions && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            What you can try:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {errorInfo.suggestions.map((suggestion, index) => (
              <Chip
                key={index}
                label={suggestion}
                variant="outlined"
                size="small"
                sx={{ alignSelf: 'flex-start' }}
              />
            ))}
          </Box>
        </Box>
      )}
      
      <ActionButtons />
    </>
  )

  if (variant === 'page') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          p: 3,
          textAlign: 'center'
        }}
      >
        <Box sx={{ maxWidth: 600, width: '100%' }}>
          <ErrorContent />
        </Box>
      </Box>
    )
  }

  if (variant === 'card') {
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardContent>
          <ErrorContent />
        </CardContent>
      </Card>
    )
  }

  // Inline variant (default)
  return (
    <Box sx={{ maxWidth: 600 }}>
      <ErrorContent />
    </Box>
  )
}