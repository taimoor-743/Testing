'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function DebugConnectionPage() {
  const searchParams = useSearchParams()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const runDebugTests = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Test 1: Environment Variables
        const envTest = await fetch('/api/test/oauth')
        const envData = await envTest.json()

        // Test 2: Database Connection
        const dbTest = await fetch('/api/test/database')
        const dbData = await dbTest.json()

        // Test 3: Check URL parameters for OAuth errors
        const urlParams = {
          error: searchParams.get('error'),
          google_drive_connected: searchParams.get('google_drive_connected'),
          code: searchParams.get('code') ? 'Present' : 'Missing',
          state: searchParams.get('state') ? 'Present' : 'Missing'
        }

        // Test 4: Check localStorage for session data
        const sessionData = {
          hasSessionId: !!localStorage.getItem('tekton_session_id'),
          hasGoogleDriveConnection: !!localStorage.getItem('tekton_google_drive_connected'),
          hasUserEmail: !!localStorage.getItem('tekton_user_email'),
          sessionId: localStorage.getItem('tekton_session_id'),
          userEmail: localStorage.getItem('tekton_user_email')
        }

        // Test 5: Check if we can access Supabase directly
        let supabaseTest = null
        try {
          const supabaseResponse = await fetch('/api/test/supabase')
          supabaseTest = await supabaseResponse.json()
        } catch (err) {
          supabaseTest = { error: 'Failed to test Supabase connection' }
        }

        const debugResult = {
          timestamp: new Date().toISOString(),
          url: window.location.href,
          urlParams,
          environment: envData,
          database: dbData,
          session: sessionData,
          supabase: supabaseTest,
          userAgent: navigator.userAgent,
          cookies: document.cookie,
          localStorage: {
            keys: Object.keys(localStorage),
            values: Object.fromEntries(
              Object.keys(localStorage).map(key => [key, localStorage.getItem(key)])
            )
          }
        }

        setDebugInfo(debugResult)
      } catch (err) {
        setError(`Debug test failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setIsLoading(false)
      }
    }

    runDebugTests()
  }, [searchParams])

  const handleTestGoogleDriveConnection = () => {
    window.location.href = '/api/auth/google-drive'
  }

  const handleClearSession = () => {
    localStorage.clear()
    document.cookie = 'google_drive_connected=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    window.location.reload()
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '800px',
          width: '100%'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2 style={{ color: '#374151', marginBottom: '10px' }}>Running Debug Tests...</h2>
          <p style={{ color: '#6b7280' }}>Please wait while we gather diagnostic information</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '1200px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '2em',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '20px'
        }}>
          🔍 Google Drive Connection Debug
        </h1>
        
        <p style={{
          color: '#6b7280',
          marginBottom: '30px',
          lineHeight: '1.5'
        }}>
          This page shows detailed diagnostic information about your Google Drive connection attempt.
        </p>

        <div style={{ 
          display: 'flex', 
          gap: '15px',
          marginBottom: '30px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleTestGoogleDriveConnection}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1em',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🔗 Test Google Drive Connection
          </button>

          <button
            onClick={handleClearSession}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1em',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🗑️ Clear Session & Retry
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#dc2626', margin: '0 0 8px 0' }}>❌ Debug Error</h3>
            <pre style={{
              color: '#7f1d1d',
              fontSize: '0.9em',
              whiteSpace: 'pre-wrap',
              margin: 0
            }}>
              {error}
            </pre>
          </div>
        )}

        {debugInfo && (
          <div style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '20px',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#1f2937', margin: '0 0 16px 0' }}>📊 Debug Information</h3>
            <div style={{
              backgroundColor: '#1f2937',
              color: '#f9fafb',
              padding: '16px',
              borderRadius: '6px',
              fontSize: '0.85em',
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              overflow: 'auto',
              maxHeight: '600px',
              whiteSpace: 'pre-wrap'
            }}>
              {JSON.stringify(debugInfo, null, 2)}
            </div>
          </div>
        )}

        <div style={{
          fontSize: '0.85em',
          color: '#6b7280',
          marginTop: '30px',
          lineHeight: '1.4',
          textAlign: 'left',
          backgroundColor: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>🔧 What This Debug Page Shows:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li><strong>Environment Variables:</strong> Checks if all required OAuth and database credentials are set</li>
            <li><strong>Database Connection:</strong> Tests Supabase connectivity and table structure</li>
            <li><strong>URL Parameters:</strong> Shows any OAuth errors or success indicators from the callback</li>
            <li><strong>Session Data:</strong> Displays stored session information and user email</li>
            <li><strong>Local Storage:</strong> Shows all stored data that might affect the connection</li>
            <li><strong>Browser Info:</strong> User agent and cookie information for troubleshooting</li>
          </ul>
          
          <h4 style={{ margin: '16px 0 8px 0', color: '#374151' }}>📋 Instructions:</h4>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Click "Test Google Drive Connection" to start the OAuth flow</li>
            <li>Complete the Google authorization process</li>
            <li>You'll be redirected back here with detailed error information</li>
            <li>Copy the JSON debug information and share it for analysis</li>
            <li>Use "Clear Session & Retry" if you need to start fresh</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
