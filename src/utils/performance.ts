// Performance monitoring utilities

export const measurePerformance = (name: string, fn: () => Promise<any>) => {
  return async () => {
    const start = performance.now()
    try {
      const result = await fn()
      const end = performance.now()
      console.log(`${name} took ${end - start} milliseconds`)
      return result
    } catch (error) {
      const end = performance.now()
      console.log(`${name} failed after ${end - start} milliseconds`)
      throw error
    }
  }
}

// Debounce utility for search and form inputs
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(null, args), wait)
  }
}

// Simple cache implementation for API responses
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private ttl: number

  constructor(ttlMinutes = 5) {
    this.ttl = ttlMinutes * 60 * 1000 // Convert to milliseconds
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }
}

export const apiCache = new SimpleCache(5) // 5 minute cache

// Image lazy loading utility
export const createIntersectionObserver = (callback: (entries: IntersectionObserverEntry[]) => void) => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px 0px',
    threshold: 0.1
  })
}

// Bundle size monitoring (development only)
export const logBundleSize = () => {
  if (import.meta.env.DEV) {
    // This will help identify large dependencies during development
    console.log('Bundle analysis available at build time')
  }
}