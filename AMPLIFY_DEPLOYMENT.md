# AWS Amplify Deployment Guide

## Pre-Deployment Checklist

✅ **Build Configuration**
- `amplify.yml` created with proper build commands
- Build tested locally and successful
- Security headers configured

✅ **SPA Routing**
- `_redirects` file created in `public/` directory
- Redirects properly configured for React Router

✅ **Environment Variables**
- `.env.example` template available
- Production environment variables ready for Amplify console

## Deployment Steps

### 1. Connect Repository to AWS Amplify

1. Log into AWS Console and navigate to AWS Amplify
2. Click "New app" > "Host web app"
3. Connect your GitHub/GitLab repository
4. Select the main branch for deployment

### 2. Configure Build Settings

The build settings should automatically detect the `amplify.yml` file. Verify:
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: Latest LTS (18.x or higher)

### 3. Set Environment Variables

Navigate to "App settings" > "Environment variables" and add:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `VITE_AIRTABLE_API_KEY` | Your Airtable API key | API key for accessing Airtable data |
| `VITE_AIRTABLE_BASE_ID` | Your Airtable base ID | Base ID for the event management base |

### 4. Deploy and Test

1. Save configuration and deploy
2. Wait for build to complete
3. Test the deployed application:
   - Navigate to different routes (should not show 404)
   - Test event creation functionality
   - Verify RSVP functionality works
   - Check responsive design on mobile

## Build Configuration Details

### amplify.yml Features

- **Fast installs**: Uses `npm ci` for reliable dependency installation
- **Production build**: Runs `npm run build` with TypeScript compilation
- **Caching**: Caches `node_modules` for faster subsequent builds
- **Security headers**: Includes CSP, XSS protection, and other security headers
- **Artifacts**: Serves all files from the `dist` directory

### Security Headers Included

- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `X-Content-Type-Options: nosniff` - MIME type sniffing protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Referrer policy
- `Content-Security-Policy` - Comprehensive CSP for the application

### SPA Routing Configuration

The `public/_redirects` file ensures that:
- All routes are handled by React Router
- Direct URL access works for any route
- 404 errors are properly handled by the React application

## Troubleshooting

### Common Build Issues

1. **Build fails with dependency errors**
   - Ensure `package-lock.json` is committed
   - Check Node.js version compatibility

2. **Environment variables not working**
   - Verify variable names start with `VITE_`
   - Check that variables are set in Amplify console
   - Redeploy after adding variables

3. **Routing issues (404 on refresh)**
   - Verify `_redirects` file is in `public/` directory
   - Check that file is copied to `dist/` during build

4. **API calls failing**
   - Verify Airtable API key and base ID are correct
   - Check CORS configuration in CSP headers
   - Test API calls in browser developer tools

### Performance Optimization

- Build includes automatic code splitting
- Static assets are cached by Amplify CDN
- Gzip compression is enabled by default
- Bundle size is optimized with Vite's production build