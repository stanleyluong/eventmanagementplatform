import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Box, Button, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { CreateRSVPFormData, Event, RSVP } from '../types'
import { AppError, createRSVPSchema } from '../types'
import { ErrorHandler } from './ErrorHandler'
import { LoadingSpinner } from './LoadingSpinner'
import { useNotification } from './NotificationProvider'

interface RSVPFormProps {
  event: Event
  onRSVPSuccess: (rsvp: RSVP) => void
  onRSVPSubmit: (data: CreateRSVPFormData) => Promise<RSVP>
  existingRSVP?: RSVP | null
  availableSpots: number
}

export const RSVPForm = ({ 
  event, 
  onRSVPSuccess, 
  onRSVPSubmit, 
  existingRSVP,
  availableSpots 
}: RSVPFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { showSuccess, showError, showWarning } = useNotification()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateRSVPFormData>({
    resolver: zodResolver(createRSVPSchema),
    defaultValues: {
      eventId: event.id,
      attendeeName: '',
      attendeeEmail: ''
    }
  })

  const onSubmit = async (data: CreateRSVPFormData) => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)
      
      const rsvp = await onRSVPSubmit(data)
      
      // Show success notification
      showSuccess(`RSVP confirmed for ${event.title}! You're all set.`)
      
      onRSVPSuccess(rsvp)
      reset()
    } catch (error) {
      console.error('RSVP submission error:', error)
      
      let errorMessage = 'An unexpected error occurred. Please try again.'
      
      if (error instanceof AppError) {
        switch (error.type) {
          case 'CAPACITY_EXCEEDED':
            errorMessage = 'Sorry, this event is now at full capacity.'
            showWarning(errorMessage)
            break
          case 'VALIDATION_ERROR':
            errorMessage = error.message
            showError(errorMessage)
            break
          case 'NETWORK_ERROR':
            errorMessage = 'Network error. Please check your connection and try again.'
            showError(errorMessage)
            break
          case 'RATE_LIMIT_ERROR':
            errorMessage = 'Too many requests. Please wait a moment and try again.'
            showWarning(errorMessage)
            break
          default:
            showError(errorMessage)
        }
      } else {
        showError(errorMessage)
      }
      
      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show message if user already has an RSVP
  if (existingRSVP && existingRSVP.status === 'confirmed') {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          You have already RSVP'd to this event as {existingRSVP.attendeeName}.
        </Alert>
      </Box>
    )
  }

  // Show message if event is at capacity
  if (availableSpots <= 0) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This event is at full capacity. No more RSVPs can be accepted.
        </Alert>
      </Box>
    )
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
        RSVP to {event.title}
      </Typography>

      {availableSpots <= 5 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Only {availableSpots} spot{availableSpots !== 1 ? 's' : ''} remaining!
        </Alert>
      )}

      {submitError && (
        <Box sx={{ mb: 3 }}>
          <ErrorHandler
            error={submitError}
            onRetry={() => setSubmitError(null)}
            showRetry={false}
            variant="inline"
          />
        </Box>
      )}

      <TextField
        {...register('attendeeName')}
        label="Your Name"
        fullWidth
        required
        error={!!errors.attendeeName}
        helperText={errors.attendeeName?.message}
        disabled={isSubmitting}
        sx={{ mb: 3 }}
      />

      <TextField
        {...register('attendeeEmail')}
        label="Your Email"
        type="email"
        fullWidth
        required
        error={!!errors.attendeeEmail}
        helperText={errors.attendeeEmail?.message}
        disabled={isSubmitting}
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting || availableSpots <= 0}
          sx={{ minWidth: 120 }}
        >
          {isSubmitting ? <LoadingSpinner size={20} /> : 'RSVP'}
        </Button>
        
        <Typography variant="body2" color="text.secondary">
          {availableSpots} spot{availableSpots !== 1 ? 's' : ''} available
        </Typography>
      </Box>
    </Box>
  )
}