import { CheckCircle, Event as EventIcon, LocationOn, Schedule } from '@mui/icons-material'
import { Box, Button, Card, CardContent, Divider, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import type { Event, RSVP } from '../types'

interface RSVPConfirmationProps {
  event: Event
  rsvp: RSVP
}

export const RSVPConfirmation = ({ event, rsvp }: RSVPConfirmationProps) => {
  const navigate = useNavigate()

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

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <CardContent sx={{ p: 4, textAlign: 'center' }}>
        {/* Success Icon */}
        <CheckCircle 
          sx={{ 
            fontSize: 64, 
            color: 'success.main', 
            mb: 2 
          }} 
        />

        {/* Confirmation Message */}
        <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 600, color: 'success.main' }}>
          RSVP Confirmed!
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Thank you, {rsvp.attendeeName}! You're all set for this event.
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Event Details Summary */}
        <Box sx={{ textAlign: 'left', mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
            Event Details
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <EventIcon sx={{ color: 'primary.main', mt: 0.5 }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Event
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {event.title}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Schedule sx={{ color: 'primary.main', mt: 0.5 }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Date & Time
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formatDate(event.date)} at {formatTime(event.time)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <LocationOn sx={{ color: 'primary.main', mt: 0.5 }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Location
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {event.location}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={() => navigate(`/events/${event.id}`)}
            sx={{ minWidth: 140 }}
          >
            View Event
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{ minWidth: 140 }}
          >
            Back to Home
          </Button>
        </Box>

        {/* Additional Info */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          A confirmation has been recorded for {rsvp.attendeeEmail}
        </Typography>
      </CardContent>
    </Card>
  )
}