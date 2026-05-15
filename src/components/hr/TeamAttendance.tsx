'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { UsersIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, GiftIcon } from '@heroicons/react/24/outline'
import { useRealTimeUpdates } from '@/lib/contexts/RealTimeUpdateContext'
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';
import { useTimezone } from '@/lib/contexts/TimezoneContext'
import { TimezoneService } from '@/lib/timezoneService'
import { useRegularizationRequestsForView } from './RegularizationRequestManager'
import { ResponsiveTable, TableHeader, TableBody, TableRow, TableCell, TableHeaderCell } from '../global/ResponsiveTable'
import { responsiveTextClasses } from '@/lib/utils/textUtils'

interface TeamMember {
  clerkUserId: string
  firstName?: string
  lastName?: string
  email?: string
  department?: string
  position?: string
}

interface AttendanceRecord {
  _id: string
  userId: string
  date: string
  clockIn?: string
  clockOut?: string
  totalHours?: number
  status: 'absent' | 'half-day' | 'full-day' | 'late' | 'early-leave' | 'holiday' | 'weekly-off' | 'clock-out-missing' | 'present' | 'regularized'
  notes?: string
  user?: TeamMember | null
  sessions?: Array<{
    _id: string
    clockIn: string
    clockOut?: string
    duration?: number
    notes?: string
  }>
  regularizationRequest?: {
    _id: string
    reason: string
    status: 'pending' | 'approved' | 'rejected'
    requestDate: string
    reviewedBy?: string
    reviewedAt?: string
    reviewNotes?: string
  }
}

type ViewMode = 'today' | 'month'

interface TeamAttendanceProps {
  initialViewMode?: ViewMode;
  initialMonth?: string; // Month name like "September"
}

const TeamAttendance = ({ initialViewMode = 'today', initialMonth }: TeamAttendanceProps = {}) => {
  const { subscribeToAttendanceUpdates, isUpdating } = useRealTimeUpdates()
  const { user, isLoaded } = useUser()
  const { timezone, getToday, getTodayDateString, formatTime, formatDateString, parseDateString } = useTimezone()
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  
  // Initialize currentDate with the provided month or default to today
  const getInitialDate = () => {
    if (initialMonth && initialViewMode === 'month') {
      // Convert month name to a date in that month
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = monthNames.indexOf(initialMonth);
      if (monthIndex !== -1) {
        const today = getToday();
        return new Date(today.getFullYear(), monthIndex, 1);
      }
    }
    return getToday();
  };
  
  const [currentDate, setCurrentDate] = useState<Date>(getInitialDate())

  // Watch for changes to initialMonth and update currentDate when it changes
  useEffect(() => {
    if (initialMonth && initialViewMode === 'month') {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = monthNames.indexOf(initialMonth);
      if (monthIndex !== -1) {
        const today = getToday();
        const newDate = new Date(today.getFullYear(), monthIndex, 1);
        console.log(' TeamAttendance: Updating month from query param', { 
          initialMonth, 
          monthIndex,
          newDateStr: newDate.toISOString()
        });
        setCurrentDate(newDate);
      }
    }
  }, [initialMonth, initialViewMode])

  // Watch for changes to initialViewMode and update viewMode
  useEffect(() => {
    console.log(' TeamAttendance: View mode changed', { initialViewMode });
    setViewMode(initialViewMode);
  }, [initialViewMode])

  // Use centralized regularization request manager for team view
  const { 
    requests: regularizationRequests, 
    loading: regularizationLoading,
    reviewRequest,
    getRequestForDate 
  } = useRegularizationRequestsForView('team', 'pending')

  const safeFormatDate = (dateString: string, format: string) => {
    if (!dateString || dateString === 'Invalid Date' || dateString === 'null' || dateString === 'undefined') {
      return 'Invalid Date'
    }
    
    // Try to parse the date string
    let date: Date
    try {
      if (typeof dateString === 'string') {
        // Handle various date formats
        if (dateString.includes('T')) {
          // ISO string
          date = new Date(dateString)
        } else if (dateString.includes('-')) {
          // Date string (YYYY-MM-DD)
          date = parseDateString(dateString)
        } else {
          // Try parsing as is
          date = new Date(dateString)
        }
      } else {
        date = new Date(dateString)
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString)
        return 'Invalid Date'
      }
      
      // Double-check the ISO string is valid
      const isoString = date.toISOString()
      if (!isoString || isoString === 'Invalid Date') {
        console.error('Invalid ISO string generated:', { dateString, date, isoString })
        return 'Invalid Date'
      }
      
      return formatDateString(isoString, format)
    } catch (error) {
      console.error('Error in safeFormatDate:', { dateString, error })
      return 'Invalid Date'
    }
  }
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingRequest, setReviewingRequest] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  const fetchData = useCallback(async () => {
    if (!user?.id || !isLoaded) return
    
    try {
      setLoading(true)
      const timestamp = Date.now()
      
      if (viewMode === 'today') {
        // Use user timezone for today's date
        const date = getTodayDateString()
        const res = await fetch(`/api/attendance/team?date=${date}&_t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        const data = await res.json()
        if (data.success) setRecords(data.data)
      } else {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        // Get the first and last day of the selected month
        const startDate = new Date(year, month, 1)
        const endDate = new Date(year, month + 1, 0) // Last day of the month
        
        // Convert to YYYY-MM-DD format
        const startDateString = startDate.toISOString().split('T')[0]
        const endDateString = endDate.toISOString().split('T')[0]
        
        const res = await fetch(`/api/attendance/team?startDate=${startDateString}&endDate=${endDateString}&_t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        const data = await res.json()
        if (data.success) setRecords(data.data)
      }
    } catch {
      // Handle error silently
    } finally {
      setLoading(false)
    }
  }, [viewMode, currentDate, timezone])

  const handleReviewRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const result = await reviewRequest(requestId, status, reviewNotes.trim() || undefined)
      
      if (result.success) {
        // Refresh attendance data
        await fetchData()
        setReviewingRequest(null)
        setReviewNotes('')
      } else {
        alert(result.error || 'Failed to review request')
      }
    } catch (error) {
      console.error('Error reviewing request:', error)
      alert('Failed to review request')
    }
  }

  useEffect(() => {
    if (isLoaded) {
      fetchData()
    }
  }, [isLoaded, viewMode, currentDate, fetchData])


  // Subscribe to real-time attendance updates
  useEffect(() => {
    if (isLoaded) {
      const unsubscribe = subscribeToAttendanceUpdates(() => {
        fetchData()
      })
      
      return unsubscribe
    }
  }, [isLoaded, subscribeToAttendanceUpdates, fetchData])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return d
    })
  }

  const groupedByUser = useMemo(() => {
    const map = new Map<string, { member: TeamMember | null, logs: AttendanceRecord[] }>()
    for (const r of records) {
      const key = r.userId
      if (!map.has(key)) map.set(key, { member: r.user || null, logs: [] })
      map.get(key)!.logs.push(r)
    }
    return Array.from(map.values())
  }, [records])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'absent':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      case 'half-day':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
      case 'late':
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
      case 'early-leave':
        return <ExclamationTriangleIcon className="h-4 w-4 text-blue-500" />
      case 'holiday':
        return <GiftIcon className="h-4 w-4 text-purple-500" />
      case 'weekly-off':
        return <GiftIcon className="h-4 w-4 text-indigo-500" />
      case 'regularized':
        return <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
      case 'clocked-in':
        return <ClockIcon className="h-4 w-4 text-blue-500" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusDisplay = (record: AttendanceRecord) => {
    // Return the calculated status from MongoDB with proper display text
    const statusText = record.status === 'weekly-off' ? 'Weekly Off' : 
                      record.status === 'holiday' ? 'Holiday' :
                      record.status === 'full-day' ? 'Present' :
                      record.status === 'regularized' ? 'Regularized' :
                      record.status.charAt(0).toUpperCase() + record.status.slice(1)
    
    return { 
      status: record.status, 
      text: statusText
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800'
      case 'absent':
        return 'bg-red-100 text-red-800'
      case 'half-day':
        return 'bg-yellow-100 text-yellow-800'
      case 'late':
        return 'bg-orange-100 text-orange-800'
      case 'early-leave':
        return 'bg-blue-100 text-blue-800'
      case 'holiday':
        return 'bg-purple-100 text-purple-800'
      case 'weekly-off':
        return 'bg-indigo-100 text-indigo-800'
      case 'regularized':
        return 'bg-emerald-100 text-emerald-800'
      case 'clocked-in':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMonthName = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return `${monthNames[month]} ${year}`
  }

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UsersIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Team Attendance</h3>
          {/* Real-time update indicator */}
          {isUpdating && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600 font-medium">Updating...</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value as ViewMode)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg">
            <option value="today">Today</option>
            <option value="month">Month</option>
          </select>
          {viewMode === 'month' && (
            <div className="flex items-center space-x-2">
              <button onClick={() => navigateMonth('prev')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-gray-900 min-w-[160px] text-center">{getMonthName(currentDate)}</span>
              <button onClick={() => navigateMonth('next')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600">Loading team attendance...</p>
          </div>
        ) : groupedByUser.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No attendance records for your team</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByUser.map(({ member, logs }) => (
              <div key={(member?.clerkUserId) || logs[0]._id} className="card-glass border border-gray-200 rounded-lg">
                <div className="px-4 py-3 glass border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() : 'Unknown Member'}</div>
                    <div className="text-xs text-gray-500">{member?.position || ''} {member?.department ? ` ${member.department}` : ''}</div>
                  </div>
                </div>
                <ResponsiveTable>
                  <TableHeader>
                    <tr>
                      <TableHeaderCell>Date</TableHeaderCell>
                      <TableHeaderCell>Clock In</TableHeaderCell>
                      <TableHeaderCell>Clock Out</TableHeaderCell>
                      <TableHeaderCell>Hours</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Regularize</TableHeaderCell>
                      <TableHeaderCell>Notes</TableHeaderCell>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {logs.map(log => {
                      const regRequest = getRequestForDate(log.userId, log.date)
                      return (
                        <TableRow key={log._id}>
                          <TableCell className={responsiveTextClasses.subtitle}>
                            {safeFormatDate(log.date, 'EEE, MMM d')}
                          </TableCell>
                          <TableCell className={responsiveTextClasses.subtitle}>
                            {log.clockIn ? formatTime(new Date(log.clockIn), 'hh:mm a') : '-'}
                          </TableCell>
                          <TableCell className={responsiveTextClasses.subtitle}>
                            {log.clockOut ? formatTime(new Date(log.clockOut), 'hh:mm a') : '-'}
                          </TableCell>
                          <TableCell className={responsiveTextClasses.subtitle}>
                            {typeof log.totalHours === 'number' ? `${log.totalHours.toFixed(1)}h` : '-'}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(getStatusDisplay(log).status)}`}>
                              {getStatusIcon(getStatusDisplay(log).status)}
                              <span className="ml-1">{getStatusDisplay(log).text}</span>
                            </span>
                          </TableCell>
                          <TableCell>
                            {regRequest ? (
                              <div className="space-y-1">
                                <div className={responsiveTextClasses.caption}>
                                  <strong>Reason:</strong> {regRequest.reason}
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleReviewRequest(regRequest._id, 'approved')}
                                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors touch-target"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => handleReviewRequest(regRequest._id, 'rejected')}
                                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors touch-target"
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className={responsiveTextClasses.caption + " max-w-xs"}>
                            {log.notes || '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </ResponsiveTable>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamAttendance


