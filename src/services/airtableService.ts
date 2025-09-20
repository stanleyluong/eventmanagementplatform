import type { AxiosInstance } from 'axios'
import axios, { AxiosError } from 'axios'
import type {
  CreateEventRequest,
  UpdateEventRequest,
  CreateRSVPRequest,
  UpdateRSVPRequest,
  CreateOrganizerRequest
} from '../types'
import type {
    AirtableRecord,
    AirtableResponse,
    Event,
    Organizer,
    RSVP
} from '../types'
import { AppError } from '../types'
import { apiCache, measurePerformance } from '../utils/performance'

// Airtable field mappings - matching your exact schema
interface AirtableEventFields {
  title: string
  description: string
  date: string
  time?: string  // Optional time field - may or may not exist in Airtable
  location: string
  capacity: number
  organizer_id: string
  created_at?: string
  updated_at?: string
}

interface AirtableRSVPFields {
  event_id: string
  attendee_name: string
  attendee_email: string
  status: 'confirmed' | 'cancelled'
  created_at?: string
  updated_at?: string
}

interface AirtableOrganizerFields {
  name: string
  email: string
  created_at?: string
}

interface AirtableErrorResponse {
  error?: {
    message?: string
  }
}

// Circuit breaker states
const CircuitState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
} as const

type CircuitState = typeof CircuitState[keyof typeof CircuitState]

// Airtable service class for API interactions
export class AirtableService {
  private client: AxiosInstance
  private baseId: string
  private maxRetries = 3
  private retryDelay = 1000 // 1 second base delay
  
  // Circuit breaker properties
  private circuitState: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime = 0
  private readonly failureThreshold = 5
  private readonly recoveryTimeout = 60000 // 1 minute

  constructor() {
    const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY
    this.baseId = import.meta.env.VITE_AIRTABLE_BASE_ID

    if (!apiKey || !this.baseId) {
      throw new Error('Airtable API key and base ID must be configured in environment variables')
    }

    this.client = axios.create({
      baseURL: `https://api.airtable.com/v0/${this.baseId}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    })

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleApiError(error)
    )
  }

  // Enhanced error handling and retry logic
  private async handleApiError(error: AxiosError): Promise<never> {
    // Log error for debugging with more detail
    console.error('Airtable API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code,
      url: error.config?.url,
      method: error.config?.method,
      requestData: error.config?.data
    })

    if (error.response) {
      const status = error.response.status
      const message = (error.response.data as AirtableErrorResponse)?.error?.message || error.message

      switch (status) {
        case 400:
          throw new AppError('VALIDATION_ERROR', 'Invalid request data. Please check your input and try again.', status)
        case 401:
          throw new AppError('NETWORK_ERROR', 'Authentication failed. Please check your API credentials.', status)
        case 403:
          throw new AppError('NETWORK_ERROR', 'Access denied. You don\'t have permission to perform this action.', status)
        case 404:
          throw new AppError('NOT_FOUND_ERROR', 'The requested resource was not found. It may have been deleted or moved.', status)
        case 413:
          throw new AppError('VALIDATION_ERROR', 'Request too large. Please reduce the amount of data and try again.', status)
        case 422:
          throw new AppError('VALIDATION_ERROR', message || 'Invalid data provided. Please check your input.', status)
        case 429:
          throw new AppError('RATE_LIMIT_ERROR', 'Too many requests. Please wait a moment before trying again.', status)
        case 500:
          throw new AppError('NETWORK_ERROR', 'Server error occurred. Please try again in a few minutes.', status)
        case 502:
        case 503:
        case 504:
          throw new AppError('NETWORK_ERROR', 'Service temporarily unavailable. Please try again later.', status)
        default:
          throw new AppError('NETWORK_ERROR', `Unexpected error occurred (${status}). Please try again.`, status)
      }
    } else if (error.request) {
      // Network connectivity issues
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new AppError('NETWORK_ERROR', 'Unable to connect to the server. Please check your internet connection.')
      } else if (error.code === 'ETIMEDOUT') {
        throw new AppError('NETWORK_ERROR', 'Request timed out. Please check your connection and try again.')
      } else {
        throw new AppError('NETWORK_ERROR', 'Network error occurred. Please check your connection and try again.')
      }
    } else {
      // Request setup errors
      throw new AppError('NETWORK_ERROR', `Request configuration error: ${error.message}`)
    }
  }

  private async retryRequest<T>(
    operation: () => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    // Check circuit breaker before attempting request
    this.checkCircuitBreaker()
    
    try {
      const result = await operation()
      this.recordSuccess()
      return result
    } catch (error) {
      this.recordFailure()
      
      if (retries > 0 && error instanceof AppError) {
        // Determine if error is retryable
        const isRetryable = this.isRetryableError(error)
        
        if (isRetryable) {
          const delay = this.calculateRetryDelay(error, this.maxRetries - retries)
          console.log(`Retrying request in ${delay}ms. Attempts remaining: ${retries}`)
          
          await new Promise(resolve => setTimeout(resolve, delay))
          return this.retryRequest(operation, retries - 1)
        }
      }
      throw error
    }
  }

  private isRetryableError(error: AppError): boolean {
    // Only retry for specific error types
    switch (error.type) {
      case 'RATE_LIMIT_ERROR':
        return true
      case 'NETWORK_ERROR':
        // Retry network errors with 5xx status codes or no status code (connection issues)
        return !error.statusCode || error.statusCode >= 500
      default:
        return false
    }
  }

  private calculateRetryDelay(error: AppError, attempt: number): number {
    // Use exponential backoff with jitter
    const baseDelay = this.retryDelay
    let delay = baseDelay * Math.pow(2, attempt)
    
    // For rate limit errors, use longer delays
    if (error.type === 'RATE_LIMIT_ERROR') {
      delay = Math.max(delay, 5000) // Minimum 5 seconds for rate limits
    }
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay
    return Math.min(delay + jitter, 30000) // Cap at 30 seconds
  }

  // Circuit breaker implementation
  private checkCircuitBreaker(): void {
    const now = Date.now()
    
    switch (this.circuitState) {
      case CircuitState.OPEN:
        if (now - this.lastFailureTime >= this.recoveryTimeout) {
          this.circuitState = CircuitState.HALF_OPEN
          console.log('Circuit breaker moving to HALF_OPEN state')
        } else {
          throw new AppError('NETWORK_ERROR', 'Service temporarily unavailable due to repeated failures. Please try again later.')
        }
        break
      case CircuitState.HALF_OPEN:
        // Allow one request through to test if service is recovered
        break
      case CircuitState.CLOSED:
        // Normal operation
        break
    }
  }

  private recordSuccess(): void {
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.circuitState = CircuitState.CLOSED
      this.failureCount = 0
      console.log('Circuit breaker reset to CLOSED state')
    } else if (this.circuitState === CircuitState.CLOSED && this.failureCount > 0) {
      this.failureCount = 0
    }
  }

  private recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
    
    if (this.failureCount >= this.failureThreshold) {
      this.circuitState = CircuitState.OPEN
      console.log(`Circuit breaker opened after ${this.failureCount} failures`)
    }
  }

  // Helper methods for data transformation
  private transformEventFromAirtable(record: AirtableRecord<AirtableEventFields>): Event {
    const fields = record.fields
    
    // Handle date and time fields
    let date: string
    let time: string = '10:00' // Default time
    
    // Get date from the date field
    if (fields.date) {
      // If it's just a date string (YYYY-MM-DD), use it directly
      if (fields.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = fields.date
      } else {
        // If it's a datetime string, extract the date part
        try {
          const eventDate = new Date(fields.date)
          if (!isNaN(eventDate.getTime())) {
            date = eventDate.toISOString().split('T')[0] // YYYY-MM-DD
          } else {
            date = fields.date
          }
        } catch {
          date = fields.date
        }
      }
    } else {
      // Fallback
      const now = new Date()
      date = now.toISOString().split('T')[0]
    }
    
    // Extract time from description if it was stored there
    if (fields.description && fields.description.includes('Event Time:')) {
      const timeMatch = fields.description.match(/Event Time:\s*(\d{2}:\d{2})/)
      if (timeMatch) {
        time = timeMatch[1]
      }
    }
    
    // Clean up description by removing the embedded time info
    let cleanDescription = fields.description
    if (cleanDescription && cleanDescription.includes('Event Time:')) {
      cleanDescription = cleanDescription.replace(/\n\nEvent Time:\s*\d{2}:\d{2}/, '').trim()
    }
    
    return {
      id: record.id,
      title: fields.title,
      description: cleanDescription,
      date: date,
      time: time,
      location: fields.location,
      capacity: fields.capacity,
      organizerId: fields.organizer_id,
      createdAt: fields.created_at || record.createdTime,
      updatedAt: fields.updated_at || record.createdTime,
      shareLink: typeof window !== 'undefined' 
        ? `${window.location.origin}/events/${record.id}` 
        : `/events/${record.id}`
    }
  }

  private transformRSVPFromAirtable(record: AirtableRecord<AirtableRSVPFields>): RSVP {
    const fields = record.fields
    return {
      id: record.id,
      eventId: fields.event_id,
      attendeeName: fields.attendee_name,
      attendeeEmail: fields.attendee_email,
      status: fields.status,
      createdAt: fields.created_at || record.createdTime,
      updatedAt: fields.updated_at || record.createdTime
    }
  }

  private transformOrganizerFromAirtable(record: AirtableRecord<AirtableOrganizerFields>): Organizer {
    const fields = record.fields
    return {
      id: record.id,
      name: fields.name,
      email: fields.email,
      createdAt: fields.created_at || record.createdTime
    }
  }

  // Events CRUD operations
  async createEvent(eventRequest: CreateEventRequest): Promise<Event> {
    return measurePerformance('createEvent', () => this.retryRequest(async () => {
      // Use the provided organizer ID (should come from localStorage)
      let organizerId = eventRequest.organizerId
      
      // Only create a new organizer if we're still using the temp ID
      if (organizerId === 'temp-organizer-id') {
        console.log('⚠️ No organizer found in localStorage, creating default organizer...')
        try {
          const organizer = await this.createOrganizer({
            name: 'Event Organizer',
            email: 'organizer@example.com'
          })
          organizerId = organizer.id
          console.log('✅ Created organizer:', organizer.id)
        } catch (error) {
          console.log('⚠️ Failed to create organizer, using temp ID:', error)
          // Continue with the temp ID and let Airtable handle the error
        }
      } else {
        console.log('✅ Using existing organizer ID:', organizerId)
      }
      
      // Convert date to format that matches your existing Airtable data (M/D/YYYY)
      const dateParts = eventRequest.date.split('-') // Split YYYY-MM-DD
      const eventDate = `${parseInt(dateParts[1])}/${parseInt(dateParts[2])}/${dateParts[0]}` // Convert to M/D/YYYY
      
      console.log('🔍 Creating event with date only:', eventDate)
      console.log('🔍 Time will be handled separately:', eventRequest.time)
      console.log('🔍 Using organizer ID:', organizerId)
      
      const eventData: AirtableEventFields = {
        title: eventRequest.title,
        description: `${eventRequest.description}\n\nEvent Time: ${eventRequest.time}`,
        date: eventDate,
        // time: eventRequest.time,  // Commented out - field doesn't exist in Airtable
        location: eventRequest.location,
        capacity: eventRequest.capacity,
        organizer_id: organizerId
      }

      const response = await this.client.post<AirtableResponse<AirtableEventFields>>('/Events', {
        records: [{ fields: eventData }]
      })

      if (!response.data.records || response.data.records.length === 0) {
        throw new AppError('NETWORK_ERROR', 'Failed to create event')
      }

      console.log('✅ Event created successfully!')
      const event = this.transformEventFromAirtable(response.data.records[0])
      
      // Clear organizer events cache
      apiCache.delete(`events:organizer:${event.organizerId}`)
      
      return event
    }))()
  }

  async getEvent(eventId: string): Promise<Event> {
    // Validate event ID format
    if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Invalid event ID provided')
    }

    // Basic Airtable record ID validation (starts with 'rec' and is 17 characters)
    const airtableIdPattern = /^rec[a-zA-Z0-9]{14}$/
    if (!airtableIdPattern.test(eventId)) {
      throw new AppError('NOT_FOUND_ERROR', 'Invalid event link. Please check the URL and try again.')
    }

    const cacheKey = `event:${eventId}`
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return cached
    }

    return this.retryRequest(async () => {
      try {
        const response = await this.client.get<AirtableRecord<AirtableEventFields>>(`/Events/${eventId}`)
        const event = this.transformEventFromAirtable(response.data)
        
        // Validate event data integrity
        if (!event.title || !event.date || !event.time) {
          throw new AppError('VALIDATION_ERROR', 'Event data is incomplete or corrupted')
        }
        
        apiCache.set(cacheKey, event)
        return event
      } catch (error) {
        if (error instanceof AppError && error.statusCode === 404) {
          throw new AppError('NOT_FOUND_ERROR', 'Event not found. It may have been deleted or the link is incorrect.')
        }
        throw error
      }
    })
  }

  async updateEvent(eventId: string, updates: UpdateEventRequest): Promise<Event> {
    return this.retryRequest(async () => {
      const updateData: Partial<AirtableEventFields> = {}

      // Only include fields that are being updated
      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.location !== undefined) updateData.location = updates.location
      if (updates.capacity !== undefined) updateData.capacity = updates.capacity
      
      // Handle date/time updates - combine them into date field
      if (updates.date !== undefined || updates.time !== undefined) {
        // Get current event to preserve existing date/time if only one is being updated
        const currentEvent = await this.getEvent(eventId)
        const date = updates.date !== undefined ? updates.date : currentEvent.date
        const time = updates.time !== undefined ? updates.time : currentEvent.time
        updateData.date = new Date(`${date}T${time}:00`).toISOString()
      }

      const response = await this.client.patch<AirtableResponse<AirtableEventFields>>('/Events', {
        records: [{ 
          id: eventId, 
          fields: updateData 
        }]
      })

      if (!response.data.records || response.data.records.length === 0) {
        throw new AppError('NETWORK_ERROR', 'Failed to update event')
      }

      const event = this.transformEventFromAirtable(response.data.records[0])
      
      // Update cache
      const cacheKey = `event:${eventId}`
      apiCache.set(cacheKey, event)
      
      // Clear related caches
      apiCache.delete(`events:organizer:${event.organizerId}`)
      
      return event
    })
  }

  async getEventsByOrganizer(organizerId: string): Promise<Event[]> {
    const cacheKey = `events:organizer:${organizerId}`
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return cached
    }

    return this.retryRequest(async () => {
      const response = await this.client.get<AirtableResponse<AirtableEventFields>>('/Events', {
        params: {
          filterByFormula: `{organizer_id} = '${organizerId}'`,
          sort: [{ field: 'created_at', direction: 'desc' }]
        }
      })

      const events = response.data.records.map(record => this.transformEventFromAirtable(record))
      apiCache.set(cacheKey, events)
      return events
    })
  }

  // RSVP CRUD operations
  async createRSVP(rsvp: CreateRSVPRequest): Promise<RSVP> {
    return this.retryRequest(async () => {
      // Validate input data
      if (!rsvp.eventId || !rsvp.attendeeName || !rsvp.attendeeEmail) {
        throw new AppError('VALIDATION_ERROR', 'Missing required RSVP information')
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(rsvp.attendeeEmail)) {
        throw new AppError('VALIDATION_ERROR', 'Please provide a valid email address')
      }

      // First check if event exists and is valid
      let event: Event
      try {
        event = await this.getEvent(rsvp.eventId)
      } catch (error) {
        if (error instanceof AppError && error.type === 'NOT_FOUND_ERROR') {
          throw new AppError('NOT_FOUND_ERROR', 'This event no longer exists or the link is invalid')
        }
        throw error
      }

      // Check if event is in the past
      const eventDateTime = new Date(`${event.date}T${event.time}`)
      const currentTime = new Date()
      if (eventDateTime < currentTime) {
        throw new AppError('VALIDATION_ERROR', 'Cannot RSVP to past events')
      }

      // Get existing RSVPs with error handling
      let existingRSVPs: RSVP[]
      try {
        existingRSVPs = await this.getRSVPsByEvent(rsvp.eventId)
      } catch (error) {
        console.warn('Failed to fetch existing RSVPs, proceeding with caution:', error)
        existingRSVPs = []
      }

      const confirmedRSVPs = existingRSVPs.filter(r => r.status === 'confirmed')

      // Check capacity with buffer for race conditions
      if (confirmedRSVPs.length >= event.capacity) {
        throw new AppError('CAPACITY_EXCEEDED', 'This event is now at full capacity. No more RSVPs can be accepted.')
      }

      // Check for duplicate RSVP (including cancelled ones)
      const existingRSVP = existingRSVPs.find(r => 
        r.attendeeEmail.toLowerCase() === rsvp.attendeeEmail.toLowerCase()
      )
      
      if (existingRSVP) {
        if (existingRSVP.status === 'confirmed') {
          throw new AppError('VALIDATION_ERROR', 'You have already RSVP\'d to this event')
        } else if (existingRSVP.status === 'cancelled') {
          // Reactivate cancelled RSVP instead of creating new one
          return await this.updateRSVP(existingRSVP.id, { status: 'confirmed' })
        }
      }

      // Double-check capacity right before creating (race condition protection)
      const latestRSVPs = await this.getRSVPsByEvent(rsvp.eventId)
      const latestConfirmedCount = latestRSVPs.filter(r => r.status === 'confirmed').length
      
      if (latestConfirmedCount >= event.capacity) {
        throw new AppError('CAPACITY_EXCEEDED', 'This event just reached full capacity. Please try another event.')
      }

      const rsvpData: AirtableRSVPFields = {
        event_id: rsvp.eventId,
        attendee_name: rsvp.attendeeName.trim(),
        attendee_email: rsvp.attendeeEmail.toLowerCase().trim(),
        status: 'confirmed'
        // Note: created_at and updated_at are likely auto-generated by Airtable
      }

      const response = await this.client.post<AirtableResponse<AirtableRSVPFields>>('/RSVPs', {
        records: [{ fields: rsvpData }]
      })

      if (!response.data.records || response.data.records.length === 0) {
        throw new AppError('NETWORK_ERROR', 'Failed to create RSVP. Please try again.')
      }

      const newRSVP = this.transformRSVPFromAirtable(response.data.records[0])
      
      // Clear cache to ensure fresh data
      apiCache.delete(`rsvps:event:${rsvp.eventId}`)
      
      return newRSVP
    })
  }

  async getRSVPsByEvent(eventId: string): Promise<RSVP[]> {
    const cacheKey = `rsvps:event:${eventId}`
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return cached
    }

    return this.retryRequest(async () => {
      const response = await this.client.get<AirtableResponse<AirtableRSVPFields>>('/RSVPs', {
        params: {
          filterByFormula: `{event_id} = '${eventId}'`,
          sort: [{ field: 'created_at', direction: 'asc' }]
        }
      })

      const rsvps = response.data.records.map(record => this.transformRSVPFromAirtable(record))
      apiCache.set(cacheKey, rsvps)
      return rsvps
    })
  }

  async updateRSVP(rsvpId: string, updates: UpdateRSVPRequest): Promise<RSVP> {
    return this.retryRequest(async () => {
      const updateData: Partial<AirtableRSVPFields> = {}

      if (updates.status !== undefined) {
        updateData.status = updates.status
      }

      const response = await this.client.patch<AirtableResponse<AirtableRSVPFields>>('/RSVPs', {
        records: [{ 
          id: rsvpId, 
          fields: updateData 
        }]
      })

      if (!response.data.records || response.data.records.length === 0) {
        throw new AppError('NETWORK_ERROR', 'Failed to update RSVP')
      }

      return this.transformRSVPFromAirtable(response.data.records[0])
    })
  }

  async deleteRSVP(rsvpId: string): Promise<void> {
    return this.retryRequest(async () => {
      await this.client.delete(`/RSVPs/${rsvpId}`)
    })
  }

  // Organizer operations
  async createOrganizer(organizer: CreateOrganizerRequest): Promise<Organizer> {
    return this.retryRequest(async () => {
      // Check if organizer with this email already exists
      const existingOrganizers = await this.getOrganizerByEmail(organizer.email)
      if (existingOrganizers.length > 0) {
        return existingOrganizers[0] // Return existing organizer
      }

      const organizerData: AirtableOrganizerFields = {
        name: organizer.name,
        email: organizer.email
        // Note: created_at is likely auto-generated by Airtable
      }

      const response = await this.client.post<AirtableResponse<AirtableOrganizerFields>>('/Organizers', {
        records: [{ fields: organizerData }]
      })

      if (!response.data.records || response.data.records.length === 0) {
        throw new AppError('NETWORK_ERROR', 'Failed to create organizer')
      }

      return this.transformOrganizerFromAirtable(response.data.records[0])
    })
  }

  async getOrganizer(organizerId: string): Promise<Organizer> {
    return this.retryRequest(async () => {
      const response = await this.client.get<AirtableRecord<AirtableOrganizerFields>>(`/Organizers/${organizerId}`)
      return this.transformOrganizerFromAirtable(response.data)
    })
  }

  // Helper method to find organizer by email
  private async getOrganizerByEmail(email: string): Promise<Organizer[]> {
    return this.retryRequest(async () => {
      const response = await this.client.get<AirtableResponse<AirtableOrganizerFields>>('/Organizers', {
        params: {
          filterByFormula: `{email} = '${email}'`
        }
      })

      return response.data.records.map(record => this.transformOrganizerFromAirtable(record))
    })
  }

  // Utility method to get RSVP by email and event
  async getRSVPByEmailAndEvent(email: string, eventId: string): Promise<RSVP | null> {
    return this.retryRequest(async () => {
      const response = await this.client.get<AirtableResponse<AirtableRSVPFields>>('/RSVPs', {
        params: {
          filterByFormula: `AND({attendee_email} = '${email}', {event_id} = '${eventId}')`
        }
      })

      if (response.data.records.length === 0) {
        return null
      }

      return this.transformRSVPFromAirtable(response.data.records[0])
    })
  }

  // Utility method to get confirmed RSVP count for an event
  async getConfirmedRSVPCount(eventId: string): Promise<number> {
    return this.retryRequest(async () => {
      const response = await this.client.get<AirtableResponse<AirtableRSVPFields>>('/RSVPs', {
        params: {
          filterByFormula: `AND({event_id} = '${eventId}', {status} = 'confirmed')`,
          fields: ['event_id'] // Only fetch minimal data for counting
        }
      })

      return response.data.records.length
    })
  }
}

// Export singleton instance
export const airtableService = new AirtableService()