'use client'

import { useState } from 'react'

export default function TestGoogleDrive() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleConnection = async () => {
    setIsConnecting(true)
    setError(null)
    setResult(null)

    try {
      // Redirect to the OAuth route
      window.location.href = '/api/auth/google-drive'
    } catch (err) {
      console.error('Error initiating Google auth:', err)
      setError('Error initiating Google auth: ' + (err as Error).message)
      setIsConnecting(false)
    }
  }

  const handleTestDatabase = async () => {
    try {
      const response = await fetch('/api/test/database')
      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Database test failed')
      }
    } catch (err) {
      setError('Database test failed: ' + (err as Error).message)
    }
  }

  const handleTestOAuth = async () => {
    try {
      const response = await fetch('/api/test/oauth')
      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'OAuth test failed')
      }
    } catch (err) {
      setError('OAuth test failed: ' + (err as Error).message)
    }
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
        maxWidth: '800px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '2em',
          fontWeight: 'bold',
          color: '#333333',
          marginBottom: '20px'
        }}>
          🧪 Google Drive Connection Test
        </h1>
        
        <p style={{
          color: '#666666',
          marginBottom: '30px',
          lineHeight: '1.5'
        }}>
          Test Google Drive OAuth connection and database storage functionality.
        </p>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '15px',
          marginBottom: '30px'
        }}>
          <button
            onClick={handleGoogleConnection}
            disabled={isConnecting}
            style={{
              backgroundColor: isConnecting ? '#94a3b8' : '#4285f4',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1em',
              fontWeight: '500',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isConnecting ? '🔄 Connecting...' : '🔍 Test Google Drive OAuth'}
          </button>

          <button
            onClick={handleTestDatabase}
            style={{
              backgroundColor: '#10b981',
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
            🗄️ Test Database Connection
          </button>

          <button
            onClick={handleTestOAuth}
            style={{
              backgroundColor: '#f59e0b',
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
            ⚙️ Test OAuth Configuration
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '20px',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#dc2626', margin: '0 0 8px 0' }}>❌ Error</h3>
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

        {result && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '20px',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#16a34a', margin: '0 0 8px 0' }}>✅ Test Result</h3>
            <pre style={{
              color: '#166534',
              fontSize: '0.9em',
              whiteSpace: 'pre-wrap',
              margin: 0
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div style={{
          fontSize: '0.85em',
          color: '#999999',
          marginTop: '20px',
          lineHeight: '1.4',
          textAlign: 'left'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#666' }}>Test Functions:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li><strong>Google Drive OAuth:</strong> Tests the complete OAuth flow and database storage</li>
            <li><strong>Database Connection:</strong> Verifies Supabase connection and table structure</li>
            <li><strong>OAuth Configuration:</strong> Checks environment variables and OAuth setup</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
