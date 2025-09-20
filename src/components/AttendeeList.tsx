import { Cancel, Person } from '@mui/icons-material'
import {
    Avatar,
    Badge,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    LinearProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemSecondaryAction,
    ListItemText,
    Paper,
    Typography
} from '@mui/material'
import { useState } from 'react'
import type { Event, RSVP } from '../types'
import { LoadingSpinner } from './LoadingSpinner'
import { useNotification } from './NotificationProvider'

interface AttendeeListProps {
  event: Event
  rsvps: RSVP[]
  onCancelRSVP?: (rsvpId: string) => Promise<void>
  isLoading?: boolean
  showCancelActions?: boolean
}

export const AttendeeList = ({ 
  event, 
  rsvps, 
  onCancelRSVP, 
  isLoading = false,
  showCancelActions = false
}: AttendeeListProps) => {
  const [cancellingRSVPId, setCancellingRSVPId] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedRSVP, setSelectedRSVP] = useState<RSVP | null>(null)
  const { showSuccess, showError } = useNotification()

  // Filter confirmed RSVPs for display
  const confirmedRSVPs = rsvps.filter(rsvp => rsvp.status === 'confirmed')
  const rsvpCount = confirmedRSVPs.length
  const capacityPercentage = (rsvpCount / event.capacity) * 100

  const handleCancelClick = (rsvp: RSVP) => {
    setSelectedRSVP(rsvp)
    setShowCancelDialog(true)
  }

  const handleCancelConfirm = async () => {
    if (!selectedRSVP || !onCancelRSVP) return

    try {
      setCancellingRSVPId(selectedRSVP.id)
      await onCancelRSVP(selectedRSVP.id)
      
      // Show success notification
      showSuccess(`RSVP cancelled for ${selectedRSVP.attendeeName}`)
      
      setShowCancelDialog(false)
      setSelectedRSVP(null)
    } catch (error) {
      console.error('Error cancelling RSVP:', error)
      showError(`Failed to cancel RSVP for ${selectedRSVP.attendeeName}. Please try again.`)
    } finally {
      setCancellingRSVPId(null)
    }
  }

  const handleCancelDialogClose = () => {
    if (!cancellingRSVPId) {
      setShowCancelDialog(false)
      setSelectedRSVP(null)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  const getAvatarColor = (name: string) => {
    // Generate a consistent color based on the name
    const colors = [
      '#1976d2', '#388e3c', '#f57c00', '#d32f2f', 
      '#7b1fa2', '#303f9f', '#0288d1', '#00796b'
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <LoadingSpinner size={20} />
          <Typography variant="h6">Loading attendees...</Typography>
        </Box>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header with RSVP count and capacity tracking */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Badge 
            badgeContent={rsvpCount} 
            color="primary"
            max={9999}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.75rem',
                minWidth: '20px',
                height: '20px'
              }
            }}
          >
            <Person sx={{ fontSize: 24 }} />
          </Badge>
          <Typography variant="h6" component="h3">
            Attendees ({rsvpCount} / {event.capacity})
          </Typography>
        </Box>

        {/* Capacity progress bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Capacity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(capacityPercentage)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(capacityPercentage, 100)}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: capacityPercentage >= 100 ? 'error.main' : 
                                capacityPercentage >= 80 ? 'warning.main' : 'success.main'
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {event.capacity - rsvpCount} spots remaining
          </Typography>
        </Box>
      </Box>

      {/* Attendee list */}
      {confirmedRSVPs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Person sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            No attendees yet
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Be the first to RSVP to this event!
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: '100%' }}>
          {confirmedRSVPs.map((rsvp, index) => (
            <ListItem
              key={rsvp.id}
              sx={{
                px: 0,
                borderBottom: index < confirmedRSVPs.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider'
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: getAvatarColor(rsvp.attendeeName),
                    width: 40,
                    height: 40,
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                >
                  {getInitials(rsvp.attendeeName)}
                </Avatar>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {rsvp.attendeeName}
                  </Typography>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {rsvp.attendeeEmail}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      RSVP'd {new Date(rsvp.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                }
              />

              {showCancelActions && onCancelRSVP && (
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="cancel RSVP"
                    onClick={() => handleCancelClick(rsvp)}
                    disabled={cancellingRSVPId === rsvp.id}
                    color="error"
                    size="small"
                    sx={{
                      '&:hover': {
                        backgroundColor: 'error.light',
                        color: 'error.contrastText'
                      }
                    }}
                  >
                    {cancellingRSVPId === rsvp.id ? (
                      <LoadingSpinner size={16} />
                    ) : (
                      <Cancel fontSize="small" />
                    )}
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </ListItem>
          ))}
        </List>
      )}

      {/* Cancel RSVP Confirmation Dialog */}
      <Dialog
        open={showCancelDialog}
        onClose={handleCancelDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancel RSVP</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel the RSVP for <strong>{selectedRSVP?.attendeeName}</strong>?
            This will remove them from the attendee list and free up a spot for other attendees.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCancelDialogClose} 
            disabled={!!cancellingRSVPId}
          >
            Keep RSVP
          </Button>
          <Button 
            onClick={handleCancelConfirm} 
            color="error" 
            variant="contained"
            disabled={!!cancellingRSVPId}
            startIcon={cancellingRSVPId ? <LoadingSpinner size={16} /> : <Cancel />}
          >
            {cancellingRSVPId ? 'Cancelling...' : 'Cancel RSVP'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}