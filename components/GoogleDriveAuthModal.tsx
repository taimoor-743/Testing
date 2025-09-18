'use client'

import { useState } from 'react'
import Button from './Button'

interface GoogleDriveAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: (credentials: any) => void
}

export default function GoogleDriveAuthModal({ isOpen, onClose, onAuthSuccess }: GoogleDriveAuthModalProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleDriveAuth = async () => {
    setIsConnecting(true)
    setError('')

    try {
      // Redirect to our OAuth endpoint
      window.location.href = '/api/auth/google-drive'
    } catch (err) {
      console.error('Google Drive authentication error:', err)
      setError('Failed to connect to Google Drive. Please try again.')
      setIsConnecting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Google Drive Icon */}
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.71 6.705L0 19h5.12l2.59-4.49L7.71 6.705zM24 19l-7.71-12.295L14.29 6.705 19.88 19H24zM12 0L7.71 6.705h8.58L12 0z"/>
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-zinc-900 mb-4">
            Connect Google Drive
          </h2>
          
          <p className="text-zinc-600 mb-6">
            To create new projects, you need to connect your Google Drive account. 
            This allows us to save your generated content directly to your Drive.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleGoogleDriveAuth}
              loading={isConnecting}
              size="lg"
              className="w-full"
            >
              {isConnecting ? 'Connecting...' : 'Connect Google Drive'}
            </Button>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 text-zinc-600 hover:text-zinc-800 transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="mt-6 text-xs text-zinc-500">
            <p>We only request access to create and manage files in your Google Drive.</p>
            <p>Your data is secure and private.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
