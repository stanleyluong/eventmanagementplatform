import { Box, CircularProgress, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material'
import { forwardRef } from 'react'

interface LoadingSpinnerProps {
  message?: string
  size?: number
  iconOnly?: boolean
  sx?: SxProps<Theme>
}

export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(({ 
  message = 'Loading...', 
  size = 40, 
  iconOnly = false,
  sx = {}
}, ref) => {
  if (iconOnly) {
    return (
      <Box 
        ref={ref}
        sx={{
          display: 'inline-flex',
          ...(sx as object)
        }}
      >
        <CircularProgress size={size} />
      </Box>
    )
  }

  return (
    <Box
      ref={ref}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        gap: 2,
        ...(sx as object)
      }}
    >
      <CircularProgress size={size} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  )
})

// Add display name for better debugging
LoadingSpinner.displayName = 'LoadingSpinner'