'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ClockIcon as Clock3Icon,
  ChartBarIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import { useTimezone } from '../../lib/hooks/useTimezone'
import { formatDateStringInUserTimezone } from '../../lib/timezoneUtils'
import { formatInTimeZone } from 'date-fns-tz'

interface LeaveRecord {
  _id: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  appliedDate: string
  approvedBy?: string
  rejectionReason?: string
}

interface LeaveHistoryProps {
  userId: string
  onViewDetails?: (leave: LeaveRecord) => void
}

const LeaveHistory = ({ userId, onViewDetails }: LeaveHistoryProps) => {
  const { safeFormatDate, timezone } = useTimezone()
  const [leaves, setLeaves] = useState<LeaveRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    leaveType: 'all',
    startDate: '',
    endDate: ''
  })
  const [sortBy, setSortBy] = useState('appliedDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchLeaveHistory = useCallback(async () => {
    try {
      setLoading(true)
      
      let queryParams = `userId=${userId}`
      
      if (filters.status !== 'all') {
        queryParams += `&status=${filters.status}`
      }
      
      if (filters.leaveType !== 'all') {
        queryParams += `&leaveType=${filters.leaveType}`
      }
      
      if (filters.startDate) {
        queryParams += `&startDate=${filters.startDate}`
      }
      
      if (filters.endDate) {
        queryParams += `&endDate=${filters.endDate}`
      }

      const response = await fetch(`/api/leaves?${queryParams}`)
      const data = await response.json()
      
      if (data.success) {
        const sortedLeaves = [...data.data]
        
        // Sort the data
        sortedLeaves.sort((a, b) => {
          let aValue = a[sortBy as keyof LeaveRecord]
          let bValue = b[sortBy as keyof LeaveRecord]
          
          if (sortBy === 'appliedDate' || sortBy === 'startDate' || sortBy === 'endDate') {
            aValue = new Date(aValue as string).getTime()
            bValue = new Date(bValue as string).getTime()
          }
          
          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1
          } else {
            return aValue < bValue ? 1 : -1
          }
        })
        
        setLeaves(sortedLeaves)
      }
    } catch (error) {
      console.error('Error fetching leave history:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, filters, sortBy, sortOrder])

  useEffect(() => {
    fetchLeaveHistory()
  }, [userId, filters, sortBy, sortOrder, fetchLeaveHistory])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />
      case 'rejected':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-gray-500" />
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'sick':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'casual':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'annual':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'maternity':
        return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'paternity':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Invalid Date') {
      return 'Invalid Date'
    }
    try {
      return formatDateStringInUserTimezone(dateString, timezone, { month: 'short', day: 'numeric', year: 'numeric' })
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'Invalid Date'
    }
  }


  const formatDateRange = (start: string, end: string) => {
    if (!start || !end || start === 'Invalid Date' || end === 'Invalid Date') {
      return 'Invalid Date Range'
    }
    
    try {
      const startDate = new Date(start)
      const endDate = new Date(end)
      
      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 'Invalid Date Range'
      }
      
      // Compare month/year in the viewer's timezone
      const startYearMonth = formatInTimeZone(startDate, timezone, 'yyyy-MM')
      const endYearMonth = formatInTimeZone(endDate, timezone, 'yyyy-MM')
      
      if (startYearMonth === endYearMonth) {
        const startDay = formatInTimeZone(startDate, timezone, 'd')
        const endDay = formatInTimeZone(endDate, timezone, 'd')
        const monthYear = formatInTimeZone(startDate, timezone, 'MMM yyyy')
        return `${startDay} - ${endDay} ${monthYear}`
      } else {
        return `${formatDate(start)} - ${formatDate(end)}`
      }
    } catch (error) {
      console.error('Error formatting date range:', start, end, error)
      return 'Invalid Date Range'
    }
  }

  const truncateWords = (text: string, maxWords: number) => {
    if (!text) return ''
    const words = text.trim().split(/\s+/)
    if (words.length <= maxWords) return text
    return words.slice(0, maxWords).join(' ') + '…'
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const clearFilters = () => {
    setFilters({
      status: 'all',
      leaveType: 'all',
      startDate: '',
      endDate: ''
    })
  }

  const exportData = () => {
    // Implementation for exporting leave data
    console.log('Exporting leave data...')
  }

  const handleCancelLeave = async (leaveId: string) => {
    if (!confirm('Are you sure you want to cancel this leave request? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/leaves', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveId,
          status: 'cancelled'
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Refresh the leave history
        fetchLeaveHistory()
      } else {
        alert(data.message || 'Failed to cancel leave request')
      }
    } catch (error) {
      console.error('Error cancelling leave:', error)
      alert('Failed to cancel leave request')
    }
  }

  const filteredLeaves = leaves.filter(leave => {
    if (filters.status !== 'all' && leave.status !== filters.status) return false
    if (filters.leaveType !== 'all' && leave.leaveType !== filters.leaveType) return false
    if (filters.startDate && new Date(leave.startDate) < new Date(filters.startDate)) return false
    if (filters.endDate && new Date(leave.endDate) > new Date(filters.endDate)) return false
    return true
  })

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Leave History</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              View and manage your leave requests
            </p>
          </div>
          
          <div className="mt-3 sm:mt-0 flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={exportData}
              className="flex items-center px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChartBarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Leave Type Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Leave Type
            </label>
            <select
              value={filters.leaveType}
              onChange={(e) => handleFilterChange('leaveType', e.target.value)}
              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="sick">Sick</option>
              <option value="casual">Casual</option>
              <option value="annual">Annual</option>
              <option value="maternity">Maternity</option>
              <option value="paternity">Paternity</option>
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              From Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              To Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex items-center space-x-2">
            <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            <span className="text-xs sm:text-sm text-gray-500">
              {filteredLeaves.length} of {leaves.length} leaves
            </span>
          </div>
          
          <button
            onClick={clearFilters}
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leave history...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No leave records found</p>
            <p className="text-sm text-gray-400">
              {leaves.length === 0 ? 'You haven\'t submitted any leave requests yet' : 'No leaves match the current filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('appliedDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="hidden sm:inline">Applied Date</span>
                      <span className="sm:hidden">Date</span>
                      {sortBy === 'appliedDate' && (
                        <span className="text-blue-600">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                <th 
                  className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('leaveType')}
                >
                  <div className="flex items-center space-x-1">
                    <span className="hidden sm:inline">Leave Type</span>
                    <span className="sm:hidden">Type</span>
                    {sortBy === 'leaveType' && (
                      <span className="text-blue-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('startDate')}
                >
                  <div className="flex items-center space-x-1">
                    <span className="hidden sm:inline">Date Range</span>
                    <span className="sm:hidden">Range</span>
                    {sortBy === 'startDate' && (
                      <span className="text-blue-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Days</span>
                  <span className="sm:hidden">#</span>
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                    {formatDate(leave.appliedDate)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium ${getLeaveTypeColor(leave.leaveType)}`}>
                      {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                    {formatDateRange(leave.startDate, leave.endDate)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                    {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-700 max-w-xs">
                    <span title={leave.reason} className="block">
                      {truncateWords(leave.reason, 20)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                      {getStatusIcon(leave.status)}
                      <span className="ml-1">
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => onViewDetails?.(leave)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded transition-colors"
                        title="View Details"
                      >
                        <BoltIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      {leave.status === 'pending' && (
                        <button
                          onClick={() => handleCancelLeave(leave._id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                          title="Cancel Leave"
                        >
                          <XCircleIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Pagination or Load More */}
      {filteredLeaves.length > 0 && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-700">
            <span>
              Showing {filteredLeaves.length} of {leaves.length} leave records
            </span>
            {leaves.length > filteredLeaves.length && (
              <button className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 sm:px-3 rounded transition-colors text-xs sm:text-sm">
                Load More
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaveHistory
