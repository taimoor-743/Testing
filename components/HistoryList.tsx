'use client'

import { useState, useEffect } from 'react'
import { UserService } from '../lib/supabase'

// Interface for history display data
interface HistoryItem {
  id: string
  project_name: string
  business_details: string
  website_structure: string
  output_link?: string
  status: string
  error_message?: string
  created_at: string
  updated_at: string
}

export default function HistoryList() {
  const [requests, setRequests] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchRequests = async () => {
    try {
      // Use the new UserService method for user-specific project usage
      const userProjectUsage = await UserService.getUserProjectUsage()
      
      // Transform the data to match the HistoryItem interface
      const transformedData: HistoryItem[] = userProjectUsage.map((item: any) => ({
        id: item.id,
        project_name: item.projects?.project_name || 'Unknown Project',
        business_details: item.projects?.business_details || '',
        website_structure: item.website_structure || item.request_data?.website_structure || '',
        output_link: item.output_link || item.response_data?.output_link,
        status: item.status,
        error_message: item.error_message || item.response_data?.error_message,
        created_at: item.created_at,
        updated_at: item.updated_at
      }))

      setRequests(transformedData)
    } catch (err) {
      console.error('Error fetching requests:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const filteredRequests = requests.filter(request =>
    request.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.business_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.website_structure.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Search Bar */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by project name, business details, or website structure..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No requests found.</div>
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'Try adjusting your search terms.' : 'Create your first project to see it here.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CREATED
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LAST UPDATED
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PROJECT NAME
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BUSINESS DETAILS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STRUCTURE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OUTPUT
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(request.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(request.updated_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{request.project_name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={request.business_details}>
                      {request.business_details}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={request.website_structure}>
                      {request.website_structure}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.output_link ? (
                      <a
                        href={request.output_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Output
                      </a>
                    ) : request.error_message ? (
                      <div className="text-red-600 text-xs" title={request.error_message}>
                        Error
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}