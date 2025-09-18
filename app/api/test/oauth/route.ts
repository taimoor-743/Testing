import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const redirectUri = appUrl ? `${appUrl}/api/auth/google-drive/callback` : null

    // Check environment variables
    const envCheck = {
      clientId: !!clientId,
      clientSecret: !!clientSecret,
      appUrl: !!appUrl,
      redirectUri: !!redirectUri
    }

    if (!clientId || !clientSecret || !appUrl) {
      return NextResponse.json({
        error: 'Missing OAuth environment variables',
        details: envCheck
      }, { status: 500 })
    }

    // Test OAuth2 client creation
    let oauth2Client = null
    try {
      oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      )
    } catch (error) {
      return NextResponse.json({
        error: 'Failed to create OAuth2 client',
        details: {
          message: (error as Error).message,
          envCheck
        }
      }, { status: 500 })
    }

    // Test OAuth URL generation
    let authUrl = null
    try {
      authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/drive'
        ],
        prompt: 'consent',
        include_granted_scopes: true,
        state: 'test_' + Date.now()
      })
    } catch (error) {
      return NextResponse.json({
        error: 'Failed to generate OAuth URL',
        details: {
          message: (error as Error).message,
          envCheck
        }
      }, { status: 500 })
    }

    // Test Google APIs availability
    let googleApisTest = null
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
      // This won't actually make a request, just test the API setup
      googleApisTest = {
        oauth2Api: 'Available',
        driveApi: 'Available'
      }
    } catch (error) {
      googleApisTest = {
        error: (error as Error).message
      }
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      oauth2Client: {
        created: true,
        clientId: clientId.substring(0, 20) + '...',
        redirectUri
      },
      authUrl: {
        generated: true,
        url: authUrl.substring(0, 100) + '...',
        length: authUrl.length
      },
      googleApis: googleApisTest,
      configuration: {
        accessType: 'offline',
        scopes: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/drive'
        ],
        prompt: 'consent'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('OAuth test failed:', error)
    return NextResponse.json({
      error: 'OAuth test failed',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}
