import { Box, Paper, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { EventCreationForm } from '../components'
import type { Event } from '../types'

export const CreateEventPage = () => {
  const navigate = useNavigate()

  const handleEventCreated = (event: Event) => {
    // Navigate to the event details page after creation
    navigate(`/events/${event.id}`)
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Create New Event
      </Typography>
      <Paper sx={{ p: 3 }}>
        <EventCreationForm onEventCreated={handleEventCreated} />
      </Paper>
    </Box>
  )
}