import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import type { Event, RSVP } from '../../types'
import { AttendeeList } from '../AttendeeList'

// Mock the LoadingSpinner component
vi.mock('../LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: number }) => <div data-testid="loading-spinner">Loading {size}</div>
}))

const mockEvent: Event = {
  id: 'event-1',
  title: 'Test Event',
  description: 'Test Description',
  date: '2024-12-01',
  time: '14:00',
  location: 'Test Location',
  capacity: 10,
  organizerId: 'org-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  shareLink: 'http://localhost/events/event-1'
}

const mockRSVPs: RSVP[] = [
  {
    id: 'rsvp-1',
    eventId: 'event-1',
    attendeeName: 'John Doe',
    attendeeEmail: 'john@example.com',
    status: 'confirmed',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  },
  {
    id: 'rsvp-2',
    eventId: 'event-1',
    attendeeName: 'Jane Smith',
    attendeeEmail: 'jane@example.com',
    status: 'confirmed',
    createdAt: '2024-01-01T11:00:00Z',
    updatedAt: '2024-01-01T11:00:00Z'
  },
  {
    id: 'rsvp-3',
    eventId: 'event-1',
    attendeeName: 'Bob Wilson',
    attendeeEmail: 'bob@example.com',
    status: 'cancelled',
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z'
  }
]

describe('AttendeeList', () => {
  it('renders attendee list with correct count and capacity tracking', () => {
    render(
      <AttendeeList
        event={mockEvent}
        rsvps={mockRSVPs}
      />
    )

    // Check header with badge count (only confirmed RSVPs)
    expect(screen.getByText('Attendees (2 / 10)')).toBeInTheDocument()
    
    // Check capacity percentage (2/10 = 20%)
    expect(screen.getByText('20%')).toBeInTheDocument()
    expect(screen.getByText('8 spots remaining')).toBeInTheDocument()

    // Check that only confirmed RSVPs are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument() // cancelled RSVP
  })

  it('shows loading state', () => {
    render(
      <AttendeeList
        event={mockEvent}
        rsvps={[]}
        isLoading={true}
      />
    )

    expect(screen.getByText('Loading attendees...')).toBeInTheDocument()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('shows empty state when no attendees', () => {
    render(
      <AttendeeList
        event={mockEvent}
        rsvps={[]}
      />
    )

    expect(screen.getByText('No attendees yet')).toBeInTheDocument()
    expect(screen.getByText('Be the first to RSVP to this event!')).toBeInTheDocument()
  })

  it('shows cancel buttons when showCancelActions is true', () => {
    const mockCancelRSVP = vi.fn()
    
    render(
      <AttendeeList
        event={mockEvent}
        rsvps={mockRSVPs}
        onCancelRSVP={mockCancelRSVP}
        showCancelActions={true}
      />
    )

    // Should show cancel buttons for confirmed RSVPs
    const cancelButtons = screen.getAllByLabelText('cancel RSVP')
    expect(cancelButtons).toHaveLength(2) // Only for confirmed RSVPs
  })

  it('handles RSVP cancellation with confirmation dialog', async () => {
    const mockCancelRSVP = vi.fn().mockResolvedValue(undefined)
    
    render(
      <AttendeeList
        event={mockEvent}
        rsvps={mockRSVPs}
        onCancelRSVP={mockCancelRSVP}
        showCancelActions={true}
      />
    )

    // Click cancel button for first attendee
    const cancelButtons = screen.getAllByLabelText('cancel RSVP')
    fireEvent.click(cancelButtons[0])

    // Check confirmation dialog appears
    expect(screen.getByText('Cancel RSVP')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to cancel the RSVP for/)).toBeInTheDocument()
    expect(screen.getByText(/John Doe/)).toBeInTheDocument()

    // Confirm cancellation
    const confirmButton = screen.getByRole('button', { name: /Cancel RSVP/i })
    fireEvent.click(confirmButton)

    // Wait for the cancellation to complete
    await waitFor(() => {
      expect(mockCancelRSVP).toHaveBeenCalledWith('rsvp-1')
    })
  })

  it('displays correct capacity warning colors', () => {
    // Test event at 90% capacity (9/10)
    const nearFullRSVPs = Array.from({ length: 9 }, (_, i) => ({
      id: `rsvp-${i}`,
      eventId: 'event-1',
      attendeeName: `Attendee ${i}`,
      attendeeEmail: `attendee${i}@example.com`,
      status: 'confirmed' as const,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z'
    }))

    render(
      <AttendeeList
        event={mockEvent}
        rsvps={nearFullRSVPs}
      />
    )

    expect(screen.getByText('Attendees (9 / 10)')).toBeInTheDocument()
    expect(screen.getByText('90%')).toBeInTheDocument()
    expect(screen.getByText('1 spots remaining')).toBeInTheDocument()
  })
})