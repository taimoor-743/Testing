import { google } from 'googleapis'
import { NextRequest } from 'next/server'
import { UserService } from '../../../../../lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 OAuth Callback received:', request.url)
    
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    console.log('🔍 Callback parameters:', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
      error: error,
      codeLength: code?.length || 0
    })

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const redirectUrl = new URL('/dashboard', baseUrl)
      redirectUrl.searchParams.set('error', 'auth_denied')
      return Response.redirect(redirectUrl.toString())
    }

    if (!code) {
      console.error('Authorization code not found')
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const redirectUrl = new URL('/dashboard', baseUrl)
      redirectUrl.searchParams.set('error', 'no_code')
      return Response.redirect(redirectUrl.toString())
    }

    // Clean and validate the app URL (same as in route.ts)
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim().replace(/\/$/, '') // Remove trailing slash
    const redirectUri = `${appUrl}/api/auth/google-drive/callback`
    
    // Create OAuth2 client with master credentials
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )

    const { tokens } = await oauth2Client.getToken(code)
    
    // Log the tokens received for debugging
    console.log('🔍 OAuth Tokens Received:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      hasExpiryDate: !!tokens.expiry_date,
      scope: tokens.scope,
      tokenType: tokens.token_type
    })

    // Get user info
    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()
    
    // Log user info for debugging
    console.log('🔍 User Info Received:', {
      email: userInfo.email,
      name: userInfo.name,
      id: userInfo.id,
      verified_email: userInfo.verified_email
    })

    // Save Google Drive connection (this will create/get user by email)
    // This is the ONLY thing that should happen during connection
    try {
      console.log('🔄 Saving Google Drive connection for user:', userInfo.email)
      await UserService.saveGoogleDriveConnection({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        scope: tokens.scope,
        user_info: userInfo
      })
      console.log('✅ Google Drive connection saved to database for:', userInfo.email)
    } catch (dbError) {
      console.error('❌ Error saving Google Drive connection to database for:', userInfo.email, dbError)
      // If database save fails, redirect with error
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const redirectUrl = new URL('/dashboard', baseUrl)
      redirectUrl.searchParams.set('error', 'db_save_failed')
      return Response.redirect(redirectUrl.toString())
    }

    // NO WEBHOOK CALL HERE - Webhook should only be called when generating copy
    console.log('✅ Google Drive connection completed successfully. Webhook will be called when user generates copy.')

    // Redirect back to dashboard with success
    const redirectUrl = new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    redirectUrl.searchParams.set('google_drive_connected', 'true')
    
    return Response.redirect(redirectUrl.toString())
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    
    // Ensure we have a valid base URL for error redirect
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUrl = new URL('/dashboard', baseUrl)
    redirectUrl.searchParams.set('error', 'auth_failed')
    
    return Response.redirect(redirectUrl.toString())
  }
}