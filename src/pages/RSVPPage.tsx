import { ArrowBack } from '@mui/icons-material'
import { Alert, Box, Button, Paper, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { LoadingSpinner, RSVPConfirmation, RSVPForm, RSVPStatus } from '../components'

import { airtableService } from '../services/airtableService'
import type { CreateRSVPFormData, Event, RSVP } from '../types'
import { AppError } from '../types'

export const RSVPPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()


  const [event, setEvent] = useState<Event | null>(null)
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [userRSVP, setUserRSVP] = useState<RSVP | null>(null)
  const [newRSVP, setNewRSVP] = useState<RSVP | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingUserRSVP, setCheckingUserRSVP] = useState(false)

  // Get email from URL params if provided (for checking existing RSVP)
  const emailParam = searchParams.get('email')

  useEffect(() => {
    if (!eventId) {
      setError('Event ID is required')
      setLoading(false)
      return
    }

    loadEventData()
  }, [eventId])

  useEffect(() => {
    if (emailParam && event) {
      checkUserRSVP(emailParam)
    }
  }, [emailParam, event])

  const loadEventData = async () => {
    if (!eventId) return

    try {
      setLoading(true)
      setError(null)

      const [eventData, rsvpData] = await Promise.all([
        airtableService.getEvent(eventId),
        airtableService.getRSVPsByEvent(eventId)
      ])

      setEvent(eventData)
      setRsvps(rsvpData.filter(rsvp => rsvp.status === 'confirmed'))
    } catch (err) {
      console.error('Error loading event data:', err)
      if (err instanceof AppError && err.type === 'NOT_FOUND_ERROR') {
        setError('Event not found')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load event details')
      }
    } finally {
      setLoading(false)
    }
  }

  const checkUserRSVP = async (email: string) => {
    if (!eventId) return

    try {
      setCheckingUserRSVP(true)
      const existingRSVP = await airtableService.getRSVPByEmailAndEvent(email, eventId)
      setUserRSVP(existingRSVP)
    } catch (err) {
      console.error('Error checking user RSVP:', err)
      // Don't show error for RSVP check, just continue
    } finally {
      setCheckingUserRSVP(false)
    }
  }

  const handleRSVPSubmit = async (data: CreateRSVPFormData): Promise<RSVP> => {
    const rsvp = await airtableService.createRSVP(data)
    
    // Update local state
    setRsvps(prev => [...prev, rsvp])
    setNewRSVP(rsvp)
    setUserRSVP(rsvp)
    
    return rsvp
  }

  const handleRSVPSuccess = (_rsvp: RSVP) => {
    // Success notification is now handled in RSVPForm component
  }

  const handleCancelRSVP = async (rsvpId: string) => {
    try {
      await airtableService.updateRSVP(rsvpId, { status: 'cancelled' })
      
      // Update local state
      setRsvps(prev => prev.filter(r => r.id !== rsvpId))
      setUserRSVP(prev => prev ? { ...prev, status: 'cancelled' } : null)
      
      // Success notification is now handled in RSVPStatus component
    } catch (err) {
      console.error('Error cancelling RSVP:', err)
      // Error notification is now handled in RSVPStatus component
      throw err
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <LoadingSpinner />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  if (!event) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Alert severity="info">
          Event not found
        </Alert>
      </Box>
    )
  }

  const confirmedRsvps = rsvps.filter(rsvp => rsvp.status === 'confirmed')
  const availableSpots = event.capacity - confirmedRsvps.length

  // Show confirmation if user just RSVP'd
  if (newRSVP) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/events/${event.id}`)}
          sx={{ mb: 2 }}
        >
          Back to Event
        </Button>
        <RSVPConfirmation event={event} rsvp={newRSVP} />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/events/${event.id}`)}
        >
          Back to Event
        </Button>
      </Box>

      {/* Event Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 600 }}>
          {event.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {new Date(event.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })} at {event.time}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {event.location}
        </Typography>
      </Paper>

      {/* RSVP Content */}
      <Paper sx={{ p: 4 }}>
        {checkingUserRSVP ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
            <LoadingSpinner size={20} />
            <Typography variant="body2" color="text.secondary">
              Checking your RSVP status...
            </Typography>
          </Box>
        ) : userRSVP && userRSVP.status === 'confirmed' ? (
          <Box>
            <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
              Your RSVP Status
            </Typography>
            <RSVPStatus 
              rsvp={userRSVP} 
              onCancelRSVP={handleCancelRSVP}
            />
          </Box>
        ) : (
          <RSVPForm
            event={event}
            onRSVPSuccess={handleRSVPSuccess}
            onRSVPSubmit={handleRSVPSubmit}
            existingRSVP={userRSVP}
            availableSpots={availableSpots}
          />
        )}
      </Paper>
    </Box>
  )
}