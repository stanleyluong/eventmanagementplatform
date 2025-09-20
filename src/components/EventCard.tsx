import {
    AccessTime,
    CalendarToday,
    Edit,
    LocationOn,
    People,
    Share
} from '@mui/icons-material'
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    IconButton,
    Typography
} from '@mui/material'
import React from 'react'
import type { Event } from '../types'

interface EventCardProps {
  event: Event
  showActions?: boolean
  onEdit?: (event: Event) => void
  onShare?: (event: Event) => void
  onViewDetails?: (event: Event) => void
  rsvpCount?: number
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  showActions = false,
  onEdit,
  onShare,
  onViewDetails,
  rsvpCount = 0
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  const isEventFull = rsvpCount >= event.capacity
  const availableSpots = event.capacity - rsvpCount

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            {event.title}
          </Typography>
          {isEventFull && (
            <Chip 
              label="Full" 
              color="error" 
              size="small" 
              sx={{ ml: 1 }}
            />
          )}
        </Box>

        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {event.description}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {formatDate(event.date)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {formatTime(event.time)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {event.location}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {rsvpCount} / {event.capacity} attendees
            </Typography>
            {!isEventFull && (
              <Chip 
                label={`${availableSpots} spots left`} 
                color="success" 
                size="small" 
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button 
          size="small" 
          variant="outlined"
          onClick={() => onViewDetails?.(event)}
        >
          View Details
        </Button>
        
        {showActions && (
          <Box>
            <IconButton 
              size="small" 
              onClick={() => onShare?.(event)}
              title="Share event"
            >
              <Share />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => onEdit?.(event)}
              title="Edit event"
            >
              <Edit />
            </IconButton>
          </Box>
        )}
      </CardActions>
    </Card>
  )
}