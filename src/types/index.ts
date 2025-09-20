import { z } from 'zod'

// Core data types for the Event Management Platform

export interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  capacity: number
  organizerId: string
  createdAt: string
  updatedAt: string
  shareLink: string
}

export interface RSVP {
  id: string
  eventId: string
  attendeeName: string
  attendeeEmail: string
  status: 'confirmed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface Organizer {
  id: string
  name: string
  email: string
  createdAt: string
}

// Request/Response types for API calls
export interface CreateEventRequest {
  title: string
  description: string
  date: string
  time: string
  location: string
  capacity: number
  organizerId: string
}

export interface UpdateEventRequest {
  title?: string
  description?: string
  date?: string
  time?: string
  location?: string
  capacity?: number
}

export interface CreateRSVPRequest {
  eventId: string
  attendeeName: string
  attendeeEmail: string
}

export interface UpdateRSVPRequest {
  status?: 'confirmed' | 'cancelled'
}

export interface CreateOrganizerRequest {
  name: string
  email: string
}

// Airtable API response types
export interface AirtableRecord<T> {
  id: string
  fields: T
  createdTime: string
}

export interface AirtableResponse<T> {
  records: AirtableRecord<T>[]
  offset?: string
}

export interface AirtableError {
  error: {
    type: string
    message: string
  }
}

// Zod validation schemas for form data
export const createEventSchema = z.object({
  title: z.string()
    .min(1, 'Event title is required')
    .max(100, 'Event title must be less than 100 characters'),
  description: z.string()
    .min(1, 'Event description is required')
    .max(1000, 'Event description must be less than 1000 characters'),
  date: z.string()
    .min(1, 'Event date is required')
    .refine((date) => {
      const eventDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return eventDate >= today
    }, 'Event date must be today or in the future'),
  time: z.string()
    .min(1, 'Event time is required')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  location: z.string()
    .min(1, 'Event location is required')
    .max(200, 'Event location must be less than 200 characters'),
  capacity: z.number()
    .min(1, 'Capacity must be at least 1')
    .max(10000, 'Capacity cannot exceed 10,000'),
  organizerId: z.string().min(1, 'Organizer ID is required')
})

export const updateEventSchema = z.object({
  title: z.string()
    .min(1, 'Event title is required')
    .max(100, 'Event title must be less than 100 characters')
    .optional(),
  description: z.string()
    .min(1, 'Event description is required')
    .max(1000, 'Event description must be less than 1000 characters')
    .optional(),
  date: z.string()
    .min(1, 'Event date is required')
    .refine((date) => {
      const eventDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return eventDate >= today
    }, 'Event date must be today or in the future')
    .optional(),
  time: z.string()
    .min(1, 'Event time is required')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
    .optional(),
  location: z.string()
    .min(1, 'Event location is required')
    .max(200, 'Event location must be less than 200 characters')
    .optional(),
  capacity: z.number()
    .min(1, 'Capacity must be at least 1')
    .max(10000, 'Capacity cannot exceed 10,000')
    .optional()
})

export const createRSVPSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  attendeeName: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  attendeeEmail: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email must be less than 254 characters')
})

export const updateRSVPSchema = z.object({
  status: z.enum(['confirmed', 'cancelled']).optional()
})

export const createOrganizerSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email must be less than 254 characters')
})

// Type inference from Zod schemas
export type CreateEventFormData = z.infer<typeof createEventSchema>
export type UpdateEventFormData = z.infer<typeof updateEventSchema>
export type CreateRSVPFormData = z.infer<typeof createRSVPSchema>
export type UpdateRSVPFormData = z.infer<typeof updateRSVPSchema>
export type CreateOrganizerFormData = z.infer<typeof createOrganizerSchema>

// Error types
export const ErrorType = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CAPACITY_EXCEEDED: 'CAPACITY_EXCEEDED'
} as const

export type ErrorType = typeof ErrorType[keyof typeof ErrorType]

// Custom error class for application errors
export class AppError extends Error {
  public type: ErrorType
  public statusCode?: number

  constructor(type: ErrorType, message: string, statusCode?: number) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.statusCode = statusCode
  }
}