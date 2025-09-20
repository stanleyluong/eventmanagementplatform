import { airtableService } from '../services/airtableService'
import { AppError } from '../types'

/**
 * Utility functions for testing error handling in development
 * These can be called from the browser console to test various error scenarios
 */

// Test invalid event ID handling
export const testInvalidEventId = async () => {
  console.log('Testing invalid event ID...')
  try {
    await airtableService.getEvent('invalid-id')
  } catch (error) {
    console.log('✅ Invalid event ID handled correctly:', error)
    return error
  }
}

// Test network error simulation
export const testNetworkError = async () => {
  console.log('Testing network error handling...')
  
  // Temporarily break the API key to simulate auth error
  const originalClient = (airtableService as any).client
  ;(airtableService as any).client = {
    ...originalClient,
    get: () => Promise.reject(new Error('Network error'))
  }
  
  try {
    await airtableService.getEvent('rec123456789012345')
  } catch (error) {
    console.log('✅ Network error handled correctly:', error)
    // Restore original client
    ;(airtableService as any).client = originalClient
    return error
  }
}

// Test RSVP validation
export const testRSVPValidation = async () => {
  console.log('Testing RSVP validation...')
  try {
    await airtableService.createRSVP({
      eventId: '',
      attendeeName: '',
      attendeeEmail: 'invalid-email'
    })
  } catch (error) {
    console.log('✅ RSVP validation handled correctly:', error)
    return error
  }
}

// Test capacity exceeded scenario
export const testCapacityExceeded = async () => {
  console.log('Testing capacity exceeded scenario...')
  
  // Mock the service methods to simulate full event
  const originalGetEvent = airtableService.getEvent
  const originalGetRSVPs = airtableService.getRSVPsByEvent
  
  ;(airtableService as any).getEvent = async () => ({
    id: 'rec123',
    title: 'Full Event',
    description: 'This event is full',
    date: '2024-12-01',
    time: '10:00',
    location: 'Test Location',
    capacity: 1,
    organizerId: 'org123',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    shareLink: '/events/rec123'
  })
  
  ;(airtableService as any).getRSVPsByEvent = async () => ([
    {
      id: 'rsvp1',
      eventId: 'rec123',
      attendeeName: 'John Doe',
      attendeeEmail: 'john@example.com',
      status: 'confirmed' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ])
  
  try {
    await airtableService.createRSVP({
      eventId: 'rec123',
      attendeeName: 'Jane Doe',
      attendeeEmail: 'jane@example.com'
    })
  } catch (error) {
    console.log('✅ Capacity exceeded handled correctly:', error)
    
    // Restore original methods
    ;(airtableService as any).getEvent = originalGetEvent
    ;(airtableService as any).getRSVPsByEvent = originalGetRSVPs
    
    return error
  }
}

// Test all error scenarios
export const testAllErrorScenarios = async () => {
  console.log('🧪 Running all error handling tests...')
  
  const results = {
    invalidEventId: await testInvalidEventId(),
    networkError: await testNetworkError(),
    rsvpValidation: await testRSVPValidation(),
    capacityExceeded: await testCapacityExceeded()
  }
  
  console.log('📊 Test Results:', results)
  
  // Check if all tests returned AppError instances
  const allTestsPassed = Object.values(results).every(result => result instanceof AppError)
  
  if (allTestsPassed) {
    console.log('✅ All error handling tests passed!')
  } else {
    console.log('❌ Some error handling tests failed')
  }
  
  return results
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  ;(window as any).errorTests = {
    testInvalidEventId,
    testNetworkError,
    testRSVPValidation,
    testCapacityExceeded,
    testAllErrorScenarios
  }
  
  console.log('🔧 Error testing utilities available at window.errorTests')
}