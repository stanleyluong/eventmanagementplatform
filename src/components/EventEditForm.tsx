import { zodResolver } from '@hookform/resolvers/zod'
import {
    AccessTime,
    CalendarToday,
    Cancel,
    LocationOn,
    People,
    Save
} from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    InputAdornment,
    Paper,
    TextField,
    Typography
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { airtableService } from '../services/airtableService'
import type { Event, UpdateEventFormData } from '../types'
import { updateEventSchema } from '../types'
import { LoadingSpinner } from './LoadingSpinner'
import { useNotification } from './NotificationProvider'

interface EventEditFormProps {
  event: Event
  onSave?: (updatedEvent: Event) => void
  onCancel?: () => void
}

export const EventEditForm: React.FC<EventEditFormProps> = ({
  event,
  onSave,
  onCancel
}) => {
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = useForm<UpdateEventFormData>({
    resolver: zodResolver(updateEventSchema),
    defaultValues: {
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      capacity: event.capacity
    }
  })

  // Reset form when event changes
  useEffect(() => {
    reset({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      capacity: event.capacity
    })
  }, [event, reset])

  const onSubmit = async (data: UpdateEventFormData) => {
    try {
      setLoading(true)
      setError(null)

      // Only send fields that have changed
      const updates: Partial<UpdateEventFormData> = {}
      if (data.title !== event.title) updates.title = data.title
      if (data.description !== event.description) updates.description = data.description
      if (data.date !== event.date) updates.date = data.date
      if (data.time !== event.time) updates.time = data.time
      if (data.location !== event.location) updates.location = data.location
      if (data.capacity !== event.capacity) updates.capacity = data.capacity

      // If no changes, just call onSave with current event
      if (Object.keys(updates).length === 0) {
        showNotification('No changes to save', 'info')
        onSave?.(event)
        return
      }

      const updatedEvent = await airtableService.updateEvent(event.id, updates)
      
      showNotification('Event updated successfully!', 'success')
      onSave?.(updatedEvent)
    } catch (err) {
      console.error('Error updating event:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event'
      setError(errorMessage)
      showNotification(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (isDirty) {
      const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?')
      if (!confirmCancel) return
    }
    onCancel?.()
  }

  const formatDateForInput = (dateString: string) => {
    // Convert from display format to input format (YYYY-MM-DD)
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 600 }}>
        Edit Event
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Event Title */}
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Event Title"
                fullWidth
                required
                error={!!errors.title}
                helperText={errors.title?.message}
                disabled={loading}
              />
            )}
          />

          {/* Event Description */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Event Description"
                fullWidth
                required
                multiline
                rows={4}
                error={!!errors.description}
                helperText={errors.description?.message}
                disabled={loading}
              />
            )}
          />

          {/* Date and Time */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Controller
              name="date"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <TextField
                  {...field}
                  label="Event Date"
                  type="date"
                  fullWidth
                  required
                  value={formatDateForInput(value || '')}
                  onChange={(e) => onChange(e.target.value)}
                  error={!!errors.date}
                  helperText={errors.date?.message}
                  disabled={loading}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Controller
              name="time"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Event Time"
                  type="time"
                  fullWidth
                  required
                  error={!!errors.time}
                  helperText={errors.time?.message}
                  disabled={loading}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTime />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </Box>

          {/* Location */}
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Event Location"
                fullWidth
                required
                error={!!errors.location}
                helperText={errors.location?.message}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          {/* Capacity */}
          <Box sx={{ maxWidth: { xs: '100%', sm: '50%' } }}>
            <Controller
              name="capacity"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <TextField
                  {...field}
                  label="Maximum Capacity"
                  type="number"
                  fullWidth
                  required
                  value={value || ''}
                  onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                  error={!!errors.capacity}
                  helperText={errors.capacity?.message}
                  disabled={loading}
                  inputProps={{
                    min: 1,
                    max: 10000
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <People />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </Box>

          {/* Form Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
              startIcon={<Cancel />}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !isDirty}
              startIcon={loading ? <LoadingSpinner size={20} /> : <Save />}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}