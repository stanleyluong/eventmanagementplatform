import { Cancel, CheckCircle } from '@mui/icons-material'
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Typography
} from '@mui/material'
import { useState } from 'react'
import type { RSVP } from '../types'
import { LoadingSpinner } from './LoadingSpinner'
import { useNotification } from './NotificationProvider'

interface RSVPStatusProps {
  rsvp: RSVP
  onCancelRSVP: (rsvpId: string) => Promise<void>
  isLoading?: boolean
}

export const RSVPStatus = ({ rsvp, onCancelRSVP, isLoading = false }: RSVPStatusProps) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const { showSuccess, showError } = useNotification()

  const handleCancelClick = () => {
    setShowCancelDialog(true)
  }

  const handleCancelConfirm = async () => {
    try {
      setIsCancelling(true)
      await onCancelRSVP(rsvp.id)
      
      // Show success notification
      showSuccess('Your RSVP has been cancelled successfully')
      
      setShowCancelDialog(false)
    } catch (error) {
      console.error('Error cancelling RSVP:', error)
      showError('Failed to cancel your RSVP. Please try again.')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleCancelDialogClose = () => {
    if (!isCancelling) {
      setShowCancelDialog(false)
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <LoadingSpinner size={20} />
        <Typography variant="body2" color="text.secondary">
          Loading RSVP status...
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Chip
          icon={rsvp.status === 'confirmed' ? <CheckCircle /> : <Cancel />}
          label={rsvp.status === 'confirmed' ? 'RSVP Confirmed' : 'RSVP Cancelled'}
          color={rsvp.status === 'confirmed' ? 'success' : 'default'}
          variant={rsvp.status === 'confirmed' ? 'filled' : 'outlined'}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Name: <strong>{rsvp.attendeeName}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Email: <strong>{rsvp.attendeeEmail}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          RSVP Date: {new Date(rsvp.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </Typography>
      </Box>

      {rsvp.status === 'confirmed' && (
        <Button
          variant="outlined"
          color="error"
          onClick={handleCancelClick}
          startIcon={<Cancel />}
          size="small"
        >
          Cancel RSVP
        </Button>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={showCancelDialog}
        onClose={handleCancelDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancel RSVP</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your RSVP for this event? 
            This action cannot be undone, but you can RSVP again if spots are still available.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCancelDialogClose} 
            disabled={isCancelling}
          >
            Keep RSVP
          </Button>
          <Button 
            onClick={handleCancelConfirm} 
            color="error" 
            variant="contained"
            disabled={isCancelling}
            startIcon={isCancelling ? <LoadingSpinner size={16} /> : <Cancel />}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel RSVP'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}