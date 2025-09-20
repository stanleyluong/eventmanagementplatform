import { useCallback, useRef, useState } from 'react'
import { useNotification } from '../components/NotificationProvider'
import { AppError } from '../types'

interface AsyncOperationState<T> {
  data: T | null
  loading: boolean
  error: Error | AppError | null
}

interface UseAsyncOperationOptions {
  showSuccessNotification?: boolean
  showErrorNotification?: boolean
  successMessage?: string
  onSuccess?: () => void
  onError?: (error: Error | AppError) => void
}

export const useAsyncOperation = <T>(
  options: UseAsyncOperationOptions = {}
) => {
  const {
    showSuccessNotification = false,
    showErrorNotification = true,
    successMessage = 'Operation completed successfully',
    onSuccess,
    onError
  } = options

  const { showSuccess, showError, showWarning } = useNotification()
  
  // Use refs to store callback functions to prevent dependency changes
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  
  // Update refs when callbacks change
  onSuccessRef.current = onSuccess
  onErrorRef.current = onError
  
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const execute = useCallback(async (
    operation: () => Promise<T>
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await operation()
      
      setState({
        data: result,
        loading: false,
        error: null
      })
      
      if (showSuccessNotification) {
        showSuccess(successMessage)
      }
      
      onSuccessRef.current?.()
      return result
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError('NETWORK_ERROR', 'An unexpected error occurred')
      
      setState({
        data: null,
        loading: false,
        error: appError
      })
      
      if (showErrorNotification) {
        if (appError.type === 'RATE_LIMIT_ERROR' || appError.type === 'CAPACITY_EXCEEDED') {
          showWarning(appError.message)
        } else {
          showError(appError.message)
        }
      }
      
      onErrorRef.current?.(appError)
      return null
    }
  }, [showSuccessNotification, showErrorNotification, successMessage, showSuccess, showError, showWarning])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    })
  }, [])

  const retry = useCallback(async (
    operation: () => Promise<T>
  ): Promise<T | null> => {
    return execute(operation)
  }, [execute])

  return {
    ...state,
    execute,
    reset,
    retry
  }
}