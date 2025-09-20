import { ArrowBack } from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    Container
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EventEditForm, LoadingSpinner } from '../components'
import { useNotification } from '../components/NotificationProvider'
import { airtableService } from '../services/airtableService'
import type { Event } from '../types'
import { AppError } from '../types'

export const EventEditPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { showError } = useNotification()
  
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) {
      setError('Event ID is required')
      setLoading(false)
      return
    }

    loadEvent()
  }, [eventId])

  const loadEvent = async () => {
    if (!eventId) return

    try {
      setLoading(true)
      setError(null)
      
      const eventData = await airtableService.getEvent(eventId)
      setEvent(eventData)
    } catch (err) {
      console.error('Error loading event:', err)
      
      let errorMessage = 'Failed to load event'
      if (err instanceof AppError) {
        switch (err.type) {
          case 'NOT_FOUND_ERROR':
            errorMessage = 'Event not found'
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
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = (updatedEvent: Event) => {
    setEvent(updatedEvent)
    navigate(`/events/${updatedEvent.id}`)
  }

  const handleCancel = () => {
    navigate(-1)
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <LoadingSpinner />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Alert severity="error">
          {error}
        </Alert>
      </Container>
    )
  }

  if (!event) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
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
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back to Event
      </Button>
      
      <EventEditForm
        event={event}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </Container>
  )
}