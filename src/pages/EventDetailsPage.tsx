import {
    AccessTime,
    ArrowBack,
    CalendarToday,
    Edit,
    LocationOn,
    People,
    Share
} from '@mui/icons-material'
import {
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    Paper,
    Tooltip,
    Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AttendeeList, EventDetailsSkeleton } from '../components'
import { ErrorHandler } from '../components/ErrorHandler'
import { useNotification } from '../components/NotificationProvider'
import { useAsyncOperation } from '../hooks/useAsyncOperation'
import { airtableService } from '../services/airtableService'
import type { Event, RSVP } from '../types'

export const EventDetailsPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { showNotification, showError } = useNotification()
  
  const [event, setEvent] = useState<Event | null>(null)
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [attendeeListLoading, setAttendeeListLoading] = useState(false)
  
  const {
    loading,
    error,
    execute: loadEventData,
    retry
  } = useAsyncOperation<{ event: Event; rsvps: RSVP[] }>({
    showErrorNotification: false, // We'll handle errors manually
    onSuccess: () => {
      // Data is set in the execute callback
    }
  })

  useEffect(() => {
    if (!eventId) {
      return
    }

    loadEventData(async () => {
      const [eventData, rsvpData] = await Promise.all([
        airtableService.getEvent(eventId),
        airtableService.getRSVPsByEvent(eventId)
      ])
      
      setEvent(eventData)
      setRsvps(rsvpData)
      
      return { event: eventData, rsvps: rsvpData }
    })
  }, [eventId]) // Removed loadEventData from dependencies

  const handleRetryLoad = () => {
    if (!eventId) return
    
    retry(async () => {
      const [eventData, rsvpData] = await Promise.all([
        airtableService.getEvent(eventId),
        airtableService.getRSVPsByEvent(eventId)
      ])
      
      setEvent(eventData)
      setRsvps(rsvpData)
      
      return { event: eventData, rsvps: rsvpData }
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleShare = async () => {
    if (!event) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        showNotification('Event link copied to clipboard!', 'success')
      }
    } catch (err) {
      console.error('Error sharing event:', err)
      showError('Failed to share event. Please try copying the URL manually.')
    }
  }

  const handleEdit = () => {
    if (!event) return
    navigate(`/events/${event.id}/edit`)
  }

  const handleCancelRSVP = async (rsvpId: string) => {
    try {
      setAttendeeListLoading(true)
      await airtableService.updateRSVP(rsvpId, { status: 'cancelled' })
      
      // Refresh the RSVP data
      if (eventId) {
        const updatedRsvps = await airtableService.getRSVPsByEvent(eventId)
        setRsvps(updatedRsvps)
      }
      
      // Success notification is now handled in AttendeeList component
    } catch (err) {
      console.error('Error cancelling RSVP:', err)
      // Error notification is now handled in AttendeeList component
      throw err
    } finally {
      setAttendeeListLoading(false)
    }
  }

  if (loading) {
    return <EventDetailsSkeleton />
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
        <ErrorHandler
          error={error}
          onRetry={handleRetryLoad}
          onGoBack={() => navigate(-1)}
          showRetry={true}
          showGoBack={true}
          variant="card"
        />
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
        <ErrorHandler
          error="Event not found or no longer available"
          onGoBack={() => navigate(-1)}
          showRetry={false}
          showGoBack={true}
          variant="card"
        />
      </Box>
    )
  }

  const confirmedRsvps = rsvps.filter(rsvp => rsvp.status === 'confirmed')
  const isEventFull = confirmedRsvps.length >= event.capacity
  const availableSpots = event.capacity - confirmedRsvps.length

  return (
    <Box>
      {/* Header with navigation and actions */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          size="large"
        >
          Back
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Share event">
            <IconButton onClick={handleShare} size="large">
              <Share />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit event">
            <IconButton onClick={handleEdit} size="large">
              <Edit />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main event information */}
      <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2
        }}>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }
            }}
          >
            {event.title}
          </Typography>
          {isEventFull && (
            <Chip 
              label="Event Full" 
              color="error" 
              size="medium"
            />
          )}
        </Box>

        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          {event.description}
        </Typography>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, 
          gap: { xs: 2, sm: 3 }, 
          mb: 4 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CalendarToday sx={{ fontSize: 24, color: 'primary.main' }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Date
              </Typography>
              <Typography variant="h6">
                {formatDate(event.date)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccessTime sx={{ fontSize: 24, color: 'primary.main' }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Time
              </Typography>
              <Typography variant="h6">
                {formatTime(event.time)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocationOn sx={{ fontSize: 24, color: 'primary.main' }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Location
              </Typography>
              <Typography variant="h6">
                {event.location}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <People sx={{ fontSize: 24, color: 'primary.main' }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Capacity
              </Typography>
              <Typography variant="h6">
                {confirmedRsvps.length} / {event.capacity} attendees
              </Typography>
              {!isEventFull && (
                <Chip 
                  label={`${availableSpots} spots available`} 
                  color="success" 
                  size="small" 
                  variant="outlined"
                  sx={{ mt: 0.5 }}
                />
              )}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            disabled={isEventFull}
            onClick={() => navigate(`/events/${event.id}/rsvp`)}
            sx={{ minWidth: 200 }}
          >
            {isEventFull ? 'Event Full' : 'RSVP Now'}
          </Button>
          
          {!isEventFull && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Already RSVP'd? Check your status on the RSVP page
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Attendee list */}
      <AttendeeList
        event={event}
        rsvps={rsvps}
        onCancelRSVP={handleCancelRSVP}
        isLoading={attendeeListLoading}
        showCancelActions={true}
      />
    </Box>
  )
}