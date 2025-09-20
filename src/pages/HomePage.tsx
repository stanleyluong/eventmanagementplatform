import { Box, Button, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

export const HomePage = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to Event Management Platform
      </Typography>
      <Typography variant="body1" paragraph>
        Create and manage events, share them with attendees, and track RSVPs all in one place.
      </Typography>
      <Box sx={{ 
        mt: 3, 
        display: 'flex', 
        gap: 2, 
        flexDirection: { xs: 'column', sm: 'row' },
        flexWrap: 'wrap',
        '& > *': {
          minWidth: { xs: '100%', sm: 'auto' }
        }
      }}>
        <Button 
          variant="contained" 
          color="primary" 
          component={Link} 
          to="/create-event"
          size="large"
        >
          Create Event
        </Button>
        <Button 
          variant="outlined" 
          color="primary"
          component={Link} 
          to="/dashboard"
          size="large"
        >
          My Events
        </Button>
      </Box>
    </Box>
  )
}