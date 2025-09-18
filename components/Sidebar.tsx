'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { SessionManager } from '../lib/session'
import { UserService } from '../lib/supabase'

export default function Sidebar() {
  const pathname = usePathname()
  const [hasGoogleDrive, setHasGoogleDrive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkGoogleDriveConnection = async () => {
      try {
        // Check if user has email stored (from previous Google Drive connection)
        const userEmail = SessionManager.getUserEmail()
        
        let connected = false
        if (userEmail) {
          // User has connected Google Drive before, check connection status
          connected = await UserService.hasGoogleDriveConnection(userEmail)
        } else {
          // No email stored, check session-based connection
          connected = await UserService.hasGoogleDriveConnection()
        }
        
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

  const navigation = [
    {
      name: 'Website Copy Generator',
      href: '/',
      icon: '📝',
      requiresGoogleDrive: false
    },
    {
      name: 'History',
      href: '/history',
      icon: '📊',
      requiresGoogleDrive: false
    }
  ]

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <div>
            <div className="text-xl font-bold">TEKTON</div>
            <div className="text-xs text-gray-400">WORDS</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Google Drive Status */}
      <div className="px-4 py-4 border-t border-gray-700">
        {isLoading ? (
          <div className="text-sm text-gray-400">Checking connection...</div>
        ) : hasGoogleDrive ? (
          <div className="text-sm text-green-400 flex items-center">
            <span className="mr-2">✅</span>
            Google Drive Connected
          </div>
        ) : (
          <div className="text-sm text-red-400 flex items-center">
            <span className="mr-2">❌</span>
            Google Drive Required
          </div>
        )}
      </div>
    </div>
  )
}