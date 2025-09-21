import {
    Cloud,
    Code,
    DataObject,
    Palette,
    Security,
    Speed
} from '@mui/icons-material'
import {
    Box,
    Card,
    CardContent,
    Chip,
    Container,
    Divider,
    Link,
    Paper,
    Stack,
    Typography
} from '@mui/material'

export const AboutPage = () => {
  const techStack = {
    frontend: {
      icon: <Code />,
      title: 'Frontend',
      technologies: [
        { name: 'React 18', description: 'Modern UI library with hooks and concurrent features' },
        { name: 'TypeScript', description: 'Type-safe JavaScript for better development experience' },
        { name: 'Vite', description: 'Fast build tool and development server' },
        { name: 'React Router', description: 'Client-side routing for single-page application' }
      ]
    },
    ui: {
      icon: <Palette />,
      title: 'UI & Design',
      technologies: [
        { name: 'Material-UI (MUI)', description: 'React component library with Material Design' },
        { name: 'MUI X Date Pickers', description: 'Advanced date and time selection components' },
        { name: 'Emotion', description: 'CSS-in-JS library for styling components' },
        { name: 'Responsive Design', description: 'Mobile-first approach with breakpoint system' }
      ]
    },
    forms: {
      icon: <DataObject />,
      title: 'Forms & Validation',
      technologies: [
        { name: 'React Hook Form', description: 'Performant forms with minimal re-renders' },
        { name: 'Zod', description: 'TypeScript-first schema validation library' },
        { name: 'Hookform Resolvers', description: 'Integration between React Hook Form and Zod' }
      ]
    },
    backend: {
      icon: <Cloud />,
      title: 'Backend & Database',
      technologies: [
        { name: 'Airtable', description: 'Cloud-based database with API for data management' },
        { name: 'Axios', description: 'HTTP client for API requests' },
        { name: 'RESTful API', description: 'Standard API architecture for data operations' }
      ]
    },
    deployment: {
      icon: <Speed />,
      title: 'Deployment & Hosting',
      technologies: [
        { name: 'AWS Amplify', description: 'Full-stack deployment platform with CI/CD' },
        { name: 'GitHub', description: 'Version control and source code management' },
        { name: 'Automatic Deployments', description: 'Continuous deployment on code changes' }
      ]
    },
    development: {
      icon: <Security />,
      title: 'Development Tools',
      technologies: [
        { name: 'ESLint', description: 'Code linting for consistent code quality' },
        { name: 'TypeScript ESLint', description: 'TypeScript-specific linting rules' },
        { name: 'Date-fns', description: 'Modern JavaScript date utility library' },
        { name: 'Terser', description: 'JavaScript minification for production builds' }
      ]
    }
  }

  const features = [
    'Event Creation & Management',
    'RSVP System with Capacity Limits',
    'Organizer Dashboard',
    'Event Sharing Links',
    'Responsive Mobile Design',
    'Real-time Form Validation',
    'Error Boundary Protection',
    'Loading States & Notifications',
    'Date & Time Pickers',
    'Clipboard Integration'
  ]

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          About Event Manager
        </Typography>
        
        <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}>
          A modern, full-stack event management platform built with cutting-edge web technologies
          for seamless event creation, management, and RSVP handling.
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3 }}>
          Technology Stack
        </Typography>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
          gap: 3, 
          mb: 5 
        }}>
          {Object.entries(techStack).map(([key, section]) => (
            <Card key={key} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {section.icon}
                  <Typography variant="h6" component="h3" sx={{ ml: 1 }}>
                    {section.title}
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {section.technologies.map((tech, index) => (
                    <Box key={index}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        {tech.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tech.description}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3 }}>
          Key Features
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
            gap: 1 
          }}>
            {features.map((feature, index) => (
              <Chip 
                key={index}
                label={feature} 
                variant="outlined" 
                sx={{ mb: 1, width: '100%', justifyContent: 'flex-start' }}
              />
            ))}
          </Box>
        </Paper>

        <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3 }}>
          Architecture Highlights
        </Typography>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
          gap: 3 
        }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Modern React Architecture
              </Typography>
              <Typography variant="body2">
                Built with React 18 using functional components, hooks, and TypeScript for 
                type safety. Implements lazy loading and code splitting for optimal performance.
              </Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Cloud-First Backend
              </Typography>
              <Typography variant="body2">
                Leverages Airtable as a backend-as-a-service for rapid development and 
                scalability, with RESTful API integration for all data operations.
              </Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Production-Ready Deployment
              </Typography>
              <Typography variant="body2">
                Deployed on AWS Amplify with automatic CI/CD pipeline, ensuring reliable 
                hosting with global CDN distribution and HTTPS security.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ mt: 5, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Open Source & Learning
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This project demonstrates modern web development practices including component-based architecture,
            state management, form handling, API integration, and responsive design. Built as a learning
            project to showcase full-stack development capabilities with React and cloud services.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Link href="https://github.com/stanleyluong/eventmanagementplatform" target="_blank" rel="noopener">
              View Source Code on GitHub
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}