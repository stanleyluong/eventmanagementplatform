import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle, ContentCopy } from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { airtableService } from '../services/airtableService'
import { createEventSchema, type CreateEventFormData, type Event } from '../types'
import { LoadingSpinner } from './LoadingSpinner'
import { useNotification } from './NotificationProvider'

interface EventCreationFormProps {
  onEventCreated?: (event: Event) => void
}

export const EventCreationForm: React.FC<EventCreationFormProps> = ({ onEventCreated }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const { showNotification } = useNotification()
  const navigate = useNavigate()

  // Check if user has an organizer profile
  useEffect(() => {
    const savedOrganizer = localStorage.getItem('organizer')
    if (!savedOrganizer) {
      showNotification('Please set up your organizer profile first', 'warning')
      navigate('/dashboard')
    }
  }, [navigate, showNotification])

  // Get organizer from localStorage
  const getOrganizerId = () => {
    const savedOrganizer = localStorage.getItem('organizer')
    if (savedOrganizer) {
      const organizerData = JSON.parse(savedOrganizer)
      return organizerData.id
    }
    return 'temp-organizer-id' // Fallback
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      capacity: 50,
      organizerId: getOrganizerId()
    }
  })

  const onSubmit = async (data: CreateEventFormData) => {
    setIsSubmitting(true)
    try {
      const event = await airtableService.createEvent(data)
      setCreatedEvent(event)
      setShowSuccessDialog(true)
      reset()
      onEventCreated?.(event)
      showNotification('Event created successfully!', 'success')
    } catch (error) {
      console.error('Error creating event:', error)
      showNotification(
        error instanceof Error ? error.message : 'Failed to create event. Please try again.',
        'error'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyLink = async () => {
    if (createdEvent?.shareLink) {
      try {
        await navigator.clipboard.writeText(createdEvent.shareLink)
        setLinkCopied(true)
        showNotification('Event link copied to clipboard!', 'success')
        setTimeout(() => setLinkCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy link:', error)
        showNotification('Failed to copy link. Please copy manually.', 'error')
      }
    }
  }

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false)
    setCreatedEvent(null)
    setLinkCopied(false)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={3}>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Event Title"
                error={!!errors.title}
                helperText={errors.title?.message}
                disabled={isSubmitting}
                required
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Event Description"
                multiline
                rows={4}
                error={!!errors.description}
                helperText={errors.description?.message}
                disabled={isSubmitting}
                required
              />
            )}
          />

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
            gap: 2 
          }}>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Event Date"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => {
                    field.onChange(date ? date.toISOString().split('T')[0] : '')
                  }}
                  disabled={isSubmitting}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.date,
                      helperText: errors.date?.message,
                      required: true
                    }
                  }}
                  minDate={new Date()}
                />
              )}
            />

            <Controller
              name="time"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Event Time"
                  type="time"
                  error={!!errors.time}
                  helperText={errors.time?.message}
                  disabled={isSubmitting}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              )}
            />
          </Box>

          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Event Location"
                error={!!errors.location}
                helperText={errors.location?.message}
                disabled={isSubmitting}
                required
              />
            )}
          />

          <Controller
            name="capacity"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Maximum Capacity"
                type="number"
                error={!!errors.capacity}
                helperText={errors.capacity?.message}
                disabled={isSubmitting}
                required
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                inputProps={{ min: 1, max: 10000 }}
                sx={{ maxWidth: { sm: 300 } }}
              />
            )}
          />

          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: { xs: 'stretch', sm: 'flex-end' },
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Button
              type="button"
              variant="outlined"
              onClick={() => reset()}
              disabled={isSubmitting}
              size="large"
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <LoadingSpinner size={20} /> : undefined}
              size="large"
            >
              {isSubmitting ? 'Creating Event...' : 'Create Event'}
            </Button>
          </Box>
        </Stack>

        {/* Success Dialog */}
        <Dialog
          open={showSuccessDialog}
          onClose={handleCloseSuccessDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            Event Created Successfully!
          </DialogTitle>
          <DialogContent>
            <Alert severity="success" sx={{ mb: 2 }}>
              Your event has been created and is ready to share with attendees.
            </Alert>
            
            {createdEvent && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {createdEvent.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {createdEvent.description}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Date:</strong> {new Date(createdEvent.date).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Time:</strong> {createdEvent.time}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Location:</strong> {createdEvent.location}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Capacity:</strong> {createdEvent.capacity} attendees
                </Typography>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Share this link with your attendees:
                  </Typography>
                  <TextField
                    fullWidth
                    value={createdEvent.shareLink}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleCopyLink}
                            edge="end"
                            color={linkCopied ? 'success' : 'primary'}
                          >
                            <ContentCopy />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    size="small"
                  />
                  {linkCopied && (
                    <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                      Link copied to clipboard!
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSuccessDialog} variant="contained">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}