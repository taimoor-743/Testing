'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import NewCopyForm from '../../components/NewCopyForm'
import { UserService } from '../../lib/supabase'
import { SessionManager } from '../../lib/session'

export default function Dashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hasGoogleDrive, setHasGoogleDrive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

         useEffect(() => {
           const checkGoogleDriveConnection = async () => {
             try {
               // Check if user has email stored (from previous Google Drive connection)
               const userEmail = SessionManager.getUserEmail()
               
               if (userEmail) {
                 // User has connected Google Drive before, check connection status
                 const connected = await UserService.hasGoogleDriveConnection(userEmail)
                 setHasGoogleDrive(connected)
               } else {
                 // No email stored, check session-based connection
                 const connected = await UserService.hasGoogleDriveConnection()
                 setHasGoogleDrive(connected)
               }
               
               // Check if user was redirected from Google OAuth
               const googleDriveConnected = searchParams.get('google_drive_connected')
               if (googleDriveConnected === 'true') {
                 setHasGoogleDrive(true)
                 // Clear the URL parameter
                 router.replace('/dashboard')
               }
             } catch (error) {
               console.error('Error checking Google Drive connection:', error)
             } finally {
               setIsLoading(false)
             }
           }

           checkGoogleDriveConnection()
         }, [router, searchParams])

  const handleGoogleDriveConnect = () => {
    window.location.href = '/api/auth/google-drive'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!hasGoogleDrive) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Website Copy Generator
          </h1>
          
          {/* Google Drive Connection Banner */}
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">🔗</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  Connect Your Google Drive
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Connect your Google Drive to start creating and managing projects. We'll automatically set up everything you need!
                </p>
              </div>
              <button
                onClick={handleGoogleDriveConnect}
                className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Connect Google Drive
              </button>
            </div>
          </div>
          
          <NewCopyForm />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Website Copy Generator
        </h1>
        <NewCopyForm />
      </div>
    </div>
  )
}
