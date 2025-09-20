// Resource preloading utilities for better performance

export const preloadRoute = (routePath: string) => {
  // Preload route components when user hovers over navigation links
  const routeMap: Record<string, () => Promise<any>> = {
    '/': () => import('../pages/HomePage'),
    '/create-event': () => import('../pages/CreateEventPage'),
    '/dashboard': () => import('../pages/DashboardPage'),
  }

  const preloader = routeMap[routePath]
  if (preloader) {
    preloader().catch(console.error)
  }
}

export const preloadCriticalData = async (organizerId?: string) => {
  // Preload critical data that's likely to be needed
  if (organizerId) {
    try {
      const { airtableService } = await import('../services/airtableService')
      // Preload organizer events in the background
      airtableService.getEventsByOrganizer(organizerId).catch(console.error)
    } catch (error) {
      console.error('Failed to preload critical data:', error)
    }
  }
}

// Preload images that are likely to be used
export const preloadImages = (imageUrls: string[]) => {
  imageUrls.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
  })
}

// Prefetch DNS for external resources
export const prefetchDNS = (domains: string[]) => {
  domains.forEach(domain => {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = domain
    document.head.appendChild(link)
  })
}

// Initialize performance optimizations
export const initializePerformanceOptimizations = () => {
  // Prefetch Airtable API domain
  prefetchDNS(['https://api.airtable.com'])
  
  // Add performance observer for monitoring (development only)
  if (import.meta.env.DEV && 'PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            console.log('Navigation timing:', entry)
          }
        })
      })
      observer.observe({ entryTypes: ['navigation'] })
    } catch (error) {
      console.warn('Performance observer not supported:', error)
    }
  }
}