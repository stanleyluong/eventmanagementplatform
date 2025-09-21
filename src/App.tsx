import { Box } from '@mui/material'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { LoadingSpinner } from './components/LoadingSpinner'
import { NotificationProvider } from './components/NotificationProvider'
import { useNetworkStatus } from './hooks/useNetworkStatus'

// Import error testing utilities in development
if (import.meta.env.DEV) {
  import('./utils/errorTesting')
  import('./utils/airtableDebug')
}

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then(module => ({ default: module.AboutPage })))
const CreateEventPage = lazy(() => import('./pages/CreateEventPage').then(module => ({ default: module.CreateEventPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })))
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage').then(module => ({ default: module.EventDetailsPage })))
const EventEditPage = lazy(() => import('./pages/EventEditPage').then(module => ({ default: module.EventEditPage })))
const RSVPPage = lazy(() => import('./pages/RSVPPage').then(module => ({ default: module.RSVPPage })))

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          height: '100%',
        },
        body: {
          height: '100%',
          margin: 0,
          padding: 0,
        },
        '#root': {
          height: '100%',
          minHeight: '100vh',
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: 'lg',
      },
      styleOverrides: {
        root: {
          paddingLeft: 16,
          paddingRight: 16,
          width: '100%',
          '@media (min-width: 600px)': {
            paddingLeft: 24,
            paddingRight: 24,
          },
        },
      },
    },
  },
})

// Network status component to monitor connectivity
const NetworkStatusMonitor = () => {
  useNetworkStatus()
  return null
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <ErrorBoundary>
          <NotificationProvider>
            <NetworkStatusMonitor />
            <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <Layout>
                <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/create-event" element={<CreateEventPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/events/:eventId" element={<EventDetailsPage />} />
                    <Route path="/events/:eventId/edit" element={<EventEditPage />} />
                    <Route path="/events/:eventId/rsvp" element={<RSVPPage />} />
                  </Routes>
                </Suspense>
              </Layout>
            </Box>
          </NotificationProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
