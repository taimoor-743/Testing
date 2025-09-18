'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import HistoryList from '../../components/HistoryList'
import { UserService } from '../../lib/supabase'

export default function HistoryPage() {
  const router = useRouter()
  const [hasGoogleDrive, setHasGoogleDrive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkGoogleDriveConnection = async () => {
      try {
        const connected = await UserService.hasGoogleDriveConnection()
        setHasGoogleDrive(connected)
      } catch (error) {
        console.error('Error checking Google Drive connection:', error)
        setHasGoogleDrive(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkGoogleDriveConnection()
  }, [])

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

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          History
        </h1>
        
        {!hasGoogleDrive && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm">⚠️</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Google Drive Not Connected
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Connect your Google Drive to see your project history. Your data will be securely stored and only accessible to you.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <HistoryList />
      </div>
    </div>
  )
}