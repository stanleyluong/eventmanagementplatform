import { Add } from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fab,
    TextField,
    Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EventCard, EventCardSkeleton } from '../components'
import { useNotification } from '../components/NotificationProvider'
import { airtableService } from '../services/airtableService'
import type { CreateOrganizerRequest, Event, Organizer } from '../types'
import { AppError } from '../types'

export const DashboardPage = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning } = useNotification()
  
  const [events, setEvents] = useState<Event[]>([])
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [organizer, setOrganizer] = useState<Organizer | null>(null)
  const [showOrganizerDialog, setShowOrganizerDialog] = useState(false)
  const [organizerForm, setOrganizerForm] = useState({ name: '', email: '' })

  useEffect(() => {
    // Check if organizer exists in localStorage
    const savedOrganizer = localStorage.getItem('organizer')
    if (savedOrganizer) {
      const organizerData = JSON.parse(savedOrganizer)
      setOrganizer(organizerData)
      loadEvents(organizerData.id)
    } else {
      setShowOrganizerDialog(true)
      setLoading(false)
    }
  }, [])

  const handleCreateOrganizer = async () => {
    if (!organizerForm.name.trim() || !organizerForm.email.trim()) {
      showWarning('Please fill in all fields')
      return
    }

    try {
      const organizerRequest: CreateOrganizerRequest = {
        name: organizerForm.name.trim(),
        email: organizerForm.email.trim()
      }
      
      const newOrganizer = await airtableService.createOrganizer(organizerRequest)
      setOrganizer(newOrganizer)
      localStorage.setItem('organizer', JSON.stringify(newOrganizer))
      setShowOrganizerDialog(false)
      showSuccess('Welcome! You can now create events.')
      loadEvents(newOrganizer.id)
    } catch (err) {
      console.error('Error creating organizer:', err)
      
      let errorMessage = 'Failed to create organizer profile'
      if (err instanceof AppError) {
        switch (err.type) {
          case 'VALIDATION_ERROR':
            errorMessage = err.message
            break
          case 'NETWORK_ERROR':
            errorMessage = 'Network error. Please check your connection and try again.'
            break
          case 'RATE_LIMIT_ERROR':
            errorMessage = 'Too many requests. Please wait a moment and try again.'
            break
          default:
            errorMessage = err.message
        }
      }
      
      showError(errorMessage)
    }
  }

  const loadEvents = async (organizerId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const eventsData = await airtableService.getEventsByOrganizer(organizerId)
      setEvents(eventsData)
      
      // Load RSVP counts for each event
      const counts: Record<string, number> = {}
      await Promise.all(
        eventsData.map(async (event) => {
          try {
            const rsvps = await airtableService.getRSVPsByEvent(event.id)
            counts[event.id] = rsvps.filter(rsvp => rsvp.status === 'confirmed').length
          } catch (err) {
            console.error(`Error loading RSVPs for event ${event.id}:`, err)
            counts[event.id] = 0
          }
        })
      )
      setRsvpCounts(counts)
    } catch (err) {
      console.error('Error loading events:', err)
      
      let errorMessage = 'Failed to load events'
      if (err instanceof AppError) {
        switch (err.type) {
          case 'NETWORK_ERROR':
            errorMessage = 'Network error. Please check your connection and try again.'
            break
          case 'RATE_LIMIT_ERROR':
            errorMessage = 'Too many requests. Please wait a moment and try again.'
            break
          default:
            errorMessage = err.message
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = () => {
    navigate('/create-event')
  }

  const handleEditEvent = (event: Event) => {
    navigate(`/events/${event.id}/edit`)
  }

  const handleShareEvent = async (event: Event) => {
    const shareUrl = `${window.location.origin}/events/${event.id}`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: shareUrl
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        showSuccess('Event link copied to clipboard!')
      }
    } catch (err) {
      console.error('Error sharing event:', err)
      showError('Failed to share event. Please try copying the URL manually.')
    }
  }

  const handleViewDetails = (event: Event) => {
    navigate(`/events/${event.id}`)
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header skeleton */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Box sx={{ mb: 1 }}>
              <Box component="div" sx={{ width: 300, height: 48, bgcolor: 'grey.300', borderRadius: 1 }} />
            </Box>
            <Box component="div" sx={{ width: 200, height: 28, bgcolor: 'grey.200', borderRadius: 1 }} />
          </Box>
          <Box component="div" sx={{ width: 140, height: 48, bgcolor: 'grey.300', borderRadius: 1 }} />
        </Box>

        {/* Events grid skeleton */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            lg: 'repeat(3, 1fr)' 
          }, 
          gap: 3 
        }}>
          {[...Array(6)].map((_, index) => (
            <EventCardSkeleton key={index} />
          ))}
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            My Events Dashboard
          </Typography>
          {organizer && (
            <Typography variant="h6" color="text.secondary">
              Welcome back, {organizer.name}!
            </Typography>
          )}
        </Box>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateEvent}
          size="large"
        >
          Create Event
        </Button>
      </Box>

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Events grid */}
      {events.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
            No events yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Create your first event to get started!
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateEvent}
            size="large"
          >
            Create Your First Event
          </Button>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            lg: 'repeat(3, 1fr)' 
          }, 
          gap: 3 
        }}>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              rsvpCount={rsvpCounts[event.id] || 0}
              showActions={true}
              onEdit={handleEditEvent}
              onShare={handleShareEvent}
              onViewDetails={handleViewDetails}
            />
          ))}
        </Box>
      )}

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="create event"
        onClick={handleCreateEvent}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' }
        }}
      >
        <Add />
      </Fab>

      {/* Organizer setup dialog */}
      <Dialog 
        open={showOrganizerDialog} 
        onClose={() => {}} 
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Welcome to Event Manager
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            To get started, please provide your information:
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            label="Your Name"
            type="text"
            fullWidth
            variant="outlined"
            value={organizerForm.name}
            onChange={(e) => setOrganizerForm(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Your Email"
            type="email"
            fullWidth
            variant="outlined"
            value={organizerForm.email}
            onChange={(e) => setOrganizerForm(prev => ({ ...prev, email: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCreateOrganizer}
            variant="contained"
            disabled={!organizerForm.name.trim() || !organizerForm.email.trim()}
          >
            Get Started
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}