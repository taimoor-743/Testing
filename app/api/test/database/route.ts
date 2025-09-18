import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const googleClientId = process.env.GOOGLE_CLIENT_ID
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

    // Check environment variables
    const envCheck = {
      supabaseUrl: !!supabaseUrl,
      supabaseAnonKey: !!supabaseAnonKey,
      supabaseServiceKey: !!supabaseServiceKey,
      googleClientId: !!googleClientId,
      googleClientSecret: !!googleClientSecret
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        error: 'Missing Supabase environment variables',
        details: envCheck
      }, { status: 500 })
    }

    // Create Supabase clients
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const supabaseService = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (connectionError) {
      return NextResponse.json({
        error: 'Database connection failed',
        details: {
          message: connectionError.message,
          code: connectionError.code,
          hint: connectionError.hint
        }
      }, { status: 500 })
    }

    // Test table structure
    const tableTests: Record<string, { accessible: boolean; error: string | null }> = {}

    // Test users table
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, google_user_id, created_at')
        .limit(1)
      
      tableTests.users = {
        accessible: !usersError,
        error: usersError?.message || null
      }
    } catch (error) {
      tableTests.users = {
        accessible: false,
        error: (error as Error).message
      }
    }

    // Test google_drive_connections table
    try {
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('google_drive_connections')
        .select('id, user_id, client_id, client_secret, access_token, google_email, is_active')
        .limit(1)
      
      tableTests.google_drive_connections = {
        accessible: !connectionsError,
        error: connectionsError?.message || null
      }
    } catch (error) {
      tableTests.google_drive_connections = {
        accessible: false,
        error: (error as Error).message
      }
    }

    // Test inserting a test user (if service key available)
    let testUserResult = null
    if (supabaseService) {
      try {
        const testEmail = `test-${Date.now()}@example.com`
        const { data: testUser, error: testUserError } = await supabaseService
          .from('users')
          .insert({
            email: testEmail,
            name: 'Test User'
          })
          .select()
          .single()

        if (testUserError) {
          testUserResult = {
            success: false,
            error: testUserError.message
          }
        } else {
          testUserResult = {
            success: true,
            userId: testUser.id,
            email: testUser.email
          }

          // Test Google Drive connection storage
          try {
            const { data: testConnection, error: testConnectionError } = await supabaseService
              .from('google_drive_connections')
              .insert({
                user_id: testUser.id,
                client_id: googleClientId || 'test-client-id',
                client_secret: googleClientSecret || 'test-client-secret',
                access_token: 'test-access-token',
                refresh_token: 'test-refresh-token',
                google_email: testEmail,
                is_active: true
              })
              .select()
              .single()

            if (testConnectionError) {
              testUserResult.connectionTest = {
                success: false,
                error: testConnectionError.message
              }
            } else {
              testUserResult.connectionTest = {
                success: true,
                connectionId: testConnection.id,
                clientIdStored: !!testConnection.client_id,
                clientSecretStored: !!testConnection.client_secret
              }

              // Clean up test data
              await supabaseService
                .from('google_drive_connections')
                .delete()
                .eq('id', testConnection.id)

              await supabaseService
                .from('users')
                .delete()
                .eq('id', testUser.id)
            }
          } catch (error) {
            testUserResult.connectionTest = {
              success: false,
              error: (error as Error).message
            }
          }
        }
      } catch (error) {
        testUserResult = {
          success: false,
          error: (error as Error).message
        }
      }
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      connection: {
        successful: true,
        message: 'Database connection successful'
      },
      tables: tableTests,
      testUser: testUserResult,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Database test failed:', error)
    return NextResponse.json({
      error: 'Database test failed',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}
