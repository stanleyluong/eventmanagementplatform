import { AppError } from '../types'

interface OfflineQueueItem {
  id: string
  operation: () => Promise<any>
  retryCount: number
  maxRetries: number
  timestamp: number
}

class OfflineHandler {
  private queue: OfflineQueueItem[] = []
  private isProcessing = false
  private readonly maxRetries = 3
  private readonly retryDelay = 5000 // 5 seconds

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.processQueue.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }

  // Add operation to offline queue
  queueOperation(operation: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      
      const queueItem: OfflineQueueItem = {
        id,
        operation: async () => {
          try {
            const result = await operation()
            resolve(result)
            return result
          } catch (error) {
            reject(error)
            throw error
          }
        },
        retryCount: 0,
        maxRetries: this.maxRetries,
        timestamp: Date.now()
      }

      this.queue.push(queueItem)

      // If online, try to process immediately
      if (navigator.onLine) {
        this.processQueue()
      } else {
        // If offline, reject with appropriate error
        reject(new AppError('NETWORK_ERROR', 'You are currently offline. This operation will be retried when connection is restored.'))
      }
    })
  }

  // Process queued operations when back online
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true
    console.log(`Processing ${this.queue.length} queued operations...`)

    const itemsToProcess = [...this.queue]
    this.queue = []

    for (const item of itemsToProcess) {
      try {
        await item.operation()
        console.log(`Successfully processed queued operation ${item.id}`)
      } catch (error) {
        item.retryCount++
        
        if (item.retryCount < item.maxRetries) {
          // Re-queue for retry
          this.queue.push(item)
          console.log(`Queued operation ${item.id} failed, will retry (${item.retryCount}/${item.maxRetries})`)
        } else {
          console.error(`Queued operation ${item.id} failed permanently after ${item.maxRetries} retries:`, error)
        }
      }
    }

    this.isProcessing = false

    // If there are still items in queue, schedule another processing attempt
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), this.retryDelay)
    }
  }

  private handleOffline() {
    console.log('Application went offline. Operations will be queued.')
  }

  // Get queue status for UI display
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      oldestItem: this.queue.length > 0 ? this.queue[0].timestamp : null
    }
  }

  // Clear queue (for testing or manual intervention)
  clearQueue() {
    this.queue = []
  }
}

// Export singleton instance
export const offlineHandler = new OfflineHandler()

// Utility function to wrap operations with offline handling
export const withOfflineSupport = <T>(operation: () => Promise<T>): Promise<T> => {
  if (!navigator.onLine) {
    return offlineHandler.queueOperation(operation)
  }
  
  return operation().catch(error => {
    // If it's a network error and we're offline, queue it
    if (error instanceof AppError && error.type === 'NETWORK_ERROR' && !navigator.onLine) {
      return offlineHandler.queueOperation(operation)
    }
    throw error
  })
}