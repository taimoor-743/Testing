import { google } from 'googleapis'
import { NextRequest } from 'next/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.NEXT_PUBLIC_APP_URL) {
      console.error('Missing required environment variables:', {
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL
      })
      return new Response('Server configuration error: Missing required environment variables', { status: 500 })
    }

    // Clean and validate the app URL
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim().replace(/\/$/, '') // Remove trailing slash
    const redirectUri = `${appUrl}/api/auth/google-drive/callback`
    
    // Log the redirect URI for debugging
    console.log('OAuth Configuration:', {
      appUrl,
      redirectUri,
      clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
      clientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
      hasAllEnvVars: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.NEXT_PUBLIC_APP_URL)
    })

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )
    
    console.log('OAuth2 Client created successfully')

    // Generate OAuth URL with proper parameters for account selection
    // Using full drive scope to ensure we get refresh tokens
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required for refresh token
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/drive' // Full drive scope for refresh tokens
      ],
      prompt: 'consent', // Force consent screen to ensure refresh token
      include_granted_scopes: true,
      state: 'session_' + Date.now() // Session ID for state
    })

    console.log('Redirecting to Google OAuth:', authUrl)
    console.log('Expected redirect URI:', redirectUri)
    
    return Response.redirect(authUrl)
  } catch (error) {
    console.error('Google OAuth error:', error)
    return new Response(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 })
  }
}