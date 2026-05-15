'use client'

import { useState } from 'react'
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';
import { useTimezone } from '../../lib/hooks/useTimezone'
import { logger } from '../../lib/logger'
import { useSystemSettings } from '../../lib/hooks/useSystemSettings'
import { useRegularizationRequestsForView } from './RegularizationRequestManager'
import { isWithinCutoffPeriodInTimezone } from '../../lib/dateUtils'
import { 
  ClockIcon, 
  CalendarIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon as Clock3Icon,
  PlayIcon,
  PauseIcon,
  UserIcon,
  PencilSquareIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { Button } from '../global/Button'
import { responsiveTextClasses } from '../../lib/utils/textUtils'
import RegularizationModal from './RegularizationModal'

interface AttendanceSession {
  _id: string
  clockIn: string
  clockOut?: string
  duration?: number
  notes?: string
}

interface AttendanceRecord {
  _id: string
  date: string
  clockIn: string
  clockOut?: string
  totalHours: number
  status: 'half-day' | 'full-day' | 'absent'
  notes?: string
  sessions: AttendanceSession[]
}

interface MyAttendanceProps {
  todayAttendance: AttendanceRecord | null
  attendanceHistory: AttendanceRecord[]
  loading: boolean
  clockingIn: boolean
  clockingOut: boolean
  notes: string
  setNotes: (notes: string) => void
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  onClockIn: () => void
  onClockOut: () => void
  onRefresh: () => void
  isRefreshing: boolean
  expandedRecords: Set<string>
  toggleRecordExpand: (recordId: string) => void
}

export default function MyAttendance({
  todayAttendance,
  attendanceHistory,
  loading,
  clockingIn,
  clockingOut,
  notes,
  setNotes,
  selectedMonth,
  setSelectedMonth,
  onClockIn,
  onClockOut,
  onRefresh,
  isRefreshing,
  expandedRecords,
  toggleRecordExpand
}: MyAttendanceProps) {
  const { user, isLoaded } = useUser()
  const { timezone, getToday, formatTime, formatDateString, parseDateString } = useTimezone()
  const { settings } = useSystemSettings()

  // Use centralized regularization request manager for my view
  const { 
    requests: regularizationRequests, 
    submitRequest,
    hasRequestForDate,
    getRequestForDate
  } = useRegularizationRequestsForView('my', 'pending')

  const [regularizationModal, setRegularizationModal] = useState<{
    isOpen: boolean
    attendanceDate: string
  }>({ isOpen: false, attendanceDate: '' })

  const safeFormatDate = (dateString: string, format: string) => {
    if (!dateString || dateString === 'Invalid Date' || dateString === 'null' || dateString === 'undefined') {
      console.error('MyAttendance: Invalid date string in safeFormatDate:', { dateString, type: typeof dateString });
      return 'Invalid Date'
    }
    
    let date: Date
    try {
      if (typeof dateString === 'string') {
        if (dateString.includes('T')) {
          date = new Date(dateString)
        } else if (dateString.includes('-')) {
          date = parseDateString(dateString)
        } else {
          date = new Date(dateString)
        }
      } else {
        date = new Date(dateString)
      }
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString)
        return 'Invalid Date'
      }
      
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

  // Handle regularization request submission
  const handleRegularizationSubmit = async (reason: string) => {
    if (!user) throw new Error('User not authenticated')
    
    const result = await submitRequest(regularizationModal.attendanceDate, reason)
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to submit regularization request')
    }
  }


  // Check if regularization is allowed for a date (within cutoff period)
  const canRegularize = (date: string, status: string) => {
    if (!settings?.attendance?.regularizationCutoffDays) return false
    
    // Check if within cutoff period (use user timezone)
    if (!isWithinCutoffPeriodInTimezone(date, settings.attendance.regularizationCutoffDays, timezone)) return false
    
    // Don't show regularization option if status is regularized, present, full day, holiday, or weekly-off
    if (status === 'regularized' || status === 'present' || status === 'full-day' || status === 'holiday' || status === 'weekly-off') return false
    
    // Don't show regularization option for today's date (use user timezone)
    const todayInUserTimezone = getToday()
    const today = todayInUserTimezone.toISOString().split('T')[0]
    const recordDate = parseDateString(date).toISOString().split('T')[0]
    if (recordDate === today) return false
    
    return true
  }

  const getCurrentSessionStatus = () => {
    if (!todayAttendance || todayAttendance.sessions.length === 0) {
      return { hasOpenSession: false, currentSession: null }
    }
    
    const lastSession = todayAttendance.sessions[todayAttendance.sessions.length - 1]
    const hasOpenSession = !lastSession.clockOut
    
    return { hasOpenSession, currentSession: hasOpenSession ? lastSession : null }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'full-day':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'half-day':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'absent':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'late':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
      case 'early-leave':
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-500" />
      case 'holiday':
        return <CalendarIcon className="h-5 w-5 text-purple-500" />
      case 'weekly-off':
        return <CalendarIcon className="h-5 w-5 text-indigo-500" />
      case 'clock-out-missing':
        return <ClockIcon className="h-5 w-5 text-gray-500" />
      case 'clocked-in':
        return <PlayIcon className="h-5 w-5 text-blue-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full-day':
        return 'bg-green-100 text-green-800'
      case 'half-day':
        return 'bg-yellow-100 text-yellow-800'
      case 'absent':
        return 'bg-red-100 text-red-800'
      case 'late':
        return 'bg-orange-100 text-orange-800'
      case 'early-leave':
        return 'bg-blue-100 text-blue-800'
      case 'holiday':
        return 'bg-purple-100 text-purple-800'
      case 'weekly-off':
        return 'bg-indigo-100 text-indigo-800'
      case 'clock-out-missing':
        return 'bg-gray-100 text-gray-800'
      case 'clocked-in':
        return 'bg-blue-100 text-blue-800'
      case 'present':
        return 'bg-green-100 text-green-800'
      case 'regularized':
        return 'bg-emerald-100 text-emerald-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    if (wholeHours === 0) {
      return `${minutes}m`
    }
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`
  }

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'full-day':
        return 'Full Day'
      case 'half-day':
        return 'Half Day'
      case 'absent':
        return 'Absent'
      case 'late':
        return 'Late'
      case 'early-leave':
        return 'Early Leave'
      case 'holiday':
        return 'Holiday'
      case 'weekly-off':
        return 'Weekly Off'
      case 'clock-out-missing':
        return 'Clock-out Missing'
      case 'clocked-in':
        return 'Clocked In'
      case 'present':
        return 'Present'
      case 'regularized':
        return 'Regularized'
      default:
        return 'Unknown'
    }
  }

  const { hasOpenSession, currentSession } = getCurrentSessionStatus()

  return (
    <>
      {/* Current Time and Clock In/Out Section */}
      <div className="card p-4 sm:p-6 mb-4 sm:mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Current Time and Date */}
          <div className="text-center lg:text-left">
            {/* Time and Date - Mobile: below, Desktop: top */}
            <div className="mb-4 order-2 lg:order-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                  {(() => {
                    const today = getToday()
                    const timeFormatted = formatTime(today, 'hh:mm a')
                    return timeFormatted
                  })()}
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-base sm:text-lg text-gray-600">
                    {(() => {
                      const today = getToday()
                      const dateFormatted = formatTime(today, 'EEEE, MMMM d, yyyy')
                      return dateFormatted
                    })()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {timezone}
                  </p>
                </div>
              </div>
            </div>

            {/* Clock In/Out Controls */}
            <div className="space-y-4 order-1 lg:order-2">
              {!hasOpenSession ? (
                <Button
                  onClick={onClockIn}
                  disabled={clockingIn}
                  variant="success"
                  size="lg"
                  fullWidth
                  loading={clockingIn}
                  leftIcon={!clockingIn ? <PlayIcon className="h-5 w-5" /> : undefined}
                >
                  {clockingIn ? 'Clocking In...' : 'Clock In'}
                </Button>
              ) : (
                <Button
                  onClick={onClockOut}
                  disabled={clockingOut}
                  variant="danger"
                  size="lg"
                  fullWidth
                  loading={clockingOut}
                  leftIcon={!clockingOut ? <PauseIcon className="h-5 w-5" /> : undefined}
                >
                  {clockingOut ? 'Clocking Out...' : 'Clock Out'}
                </Button>
              )}

              {/* Notes Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about your attendance..."
                  className="form-input resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Today's Status */}
            {!hasOpenSession && (
              <div className="mt-4 order-3">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  todayAttendance ? getStatusColor(todayAttendance.status) : 'bg-gray-100 text-gray-800'
                }`}>
                  {todayAttendance ? (
                    <>
                      {getStatusIcon(todayAttendance.status)}
                      <span className="ml-2">
                        {todayAttendance.status === 'full-day' ? 'Full Day' : 
                         todayAttendance.status === 'half-day' ? 'Half Day' : 
                         todayAttendance.status === 'absent' ? 'Absent' : 
                         todayAttendance.status === 'weekly-off' ? 'Weekly Off' : 'Unknown'}
                      </span>
                    </>
                  ) : (
                    <>
                      <ClockIcon className="h-4 w-4 mr-2" />
                      <span>Not Clocked In</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current Session Info and Today's Summary */}
          <div className="text-center lg:text-left space-y-4">
            {hasOpenSession && currentSession && (
              <div className="p-3 glass rounded-lg border border-blue-500/30">
                <div className="flex items-center text-blue-700">
                  <PlayIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Currently Working</span>
                </div>
                <div className="mt-2 text-sm text-blue-600">
                  <div>Started: {currentSession.clockIn}</div>
                  <div>Today&apos;s Total: {formatDuration(todayAttendance?.totalHours || 0)}</div>
                </div>
              </div>
            )}

            {/* Main Branch Summary */}
            {todayAttendance && (
              <div className="p-3 glass rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Today&apos;s Summary:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1 text-xs text-gray-500">
                    <div>First Clock-in: {todayAttendance.clockIn}</div>
                    {todayAttendance.clockOut && (
                      <div>Last Clock-out: {todayAttendance.clockOut}</div>
                    )}
                    <div>Total Hours: {formatDuration(todayAttendance.totalHours)}</div>
                  </div>
                  {todayAttendance.sessions.length > 0 && (
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="space-y-1">
                        {todayAttendance.sessions.map((session, index) => (
                          <div key={session._id || index} className="flex items-center">
                            <UserIcon className="h-3 w-3 mr-2" />
                            <span>
                              {session.clockIn} - {session.clockOut || 'Active'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <h2 className={responsiveTextClasses.title + " mb-3 sm:mb-0"}>Attendance History</h2>
          
          {/* Month Selector */}
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="form-input py-1 px-2 text-sm sm:px-3 sm:py-2"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading attendance history...</p>
          </div>
        ) : attendanceHistory.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No attendance records found</p>
            <p className="text-sm text-gray-400">Your attendance history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {attendanceHistory.map((record) => (
              <div key={record._id} className="card-glass p-3 sm:p-4">
                {/* Date Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 pb-2 border-b border-gray-100 gap-2 sm:gap-0">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    <span className="font-medium text-gray-900 text-sm sm:text-base">
                      {safeFormatDate(record.date, 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                      <span className="ml-1">
                        {getStatusDisplayText(record.status)}
                      </span>
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                      Total: {formatDuration(record.totalHours)}
                    </span>
                    {canRegularize(record.date, record.status) && !hasRequestForDate(user?.id || '', record.date) && (
                      <button
                        onClick={() => {
                          console.log('Opening regularization modal for date:', { 
                            date: record.date, 
                            type: typeof record.date,
                            isValid: !isNaN(new Date(record.date).getTime())
                          });
                          setRegularizationModal({ isOpen: true, attendanceDate: record.date });
                        }}
                        className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <PencilSquareIcon className="h-3 w-3 mr-1" />
                        Regularize
                      </button>
                    )}
                    {hasRequestForDate(user?.id || '', record.date) && (
                      <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Regularization Pending
                      </span>
                    )}
                    <button
                      onClick={() => toggleRecordExpand(record._id)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      title={expandedRecords.has(record._id) ? 'Collapse sessions' : 'Expand sessions'}
                    >
                      <ChevronDownIcon 
                        className={`h-4 w-4 text-gray-500 transition-transform ${
                          expandedRecords.has(record._id) ? 'rotate-180' : ''
                        }`} 
                      />
                    </button>
                  </div>
                </div>

                {/* Main Branch Summary */}
                <div className="mb-3 p-3 sm:p-4 glass rounded-lg">
                  <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Daily Summary:</div>
                  
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                    <div className="text-gray-600">
                      <span className="font-medium">{record.sessions.length}</span>
                      <span className="text-gray-500 ml-1">session{record.sessions.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="text-gray-600">
                      <span className="text-gray-500">First:</span>
                      <span className="font-medium ml-1">
                        {record.clockIn}
                      </span>
                    </div>
                    <div className="text-gray-600">
                      <span className="text-gray-500">Last:</span>
                      <span className="font-medium ml-1">
                        {record.clockOut ? (
                          record.clockOut
                        ) : (
                          <span className="text-orange-500">Active</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sessions - Conditionally rendered based on expand state */}
                {expandedRecords.has(record._id) && (
                  <div className="space-y-2">
                    {record.sessions.map((session, index) => (
                      <div key={session._id || index} className="flex items-center justify-between p-3 glass rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-700">
                              {session.clockIn}
                            </span>
                          </div>
                          <span className="text-gray-400">→</span>
                          <div className="flex items-center space-x-2">
                            <Clock3Icon className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-gray-700">
                              {session.clockOut ? (
                                session.clockOut
                              ) : (
                                <span className="text-orange-500">Active</span>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {session.duration && (
                            <span className="text-sm text-gray-600">
                              {formatDuration(session.duration)}
                            </span>
                          )}
                          {session.notes && (
                            <span className="text-sm text-gray-500 max-w-xs truncate">
                              {session.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Regularization Modal */}
      <RegularizationModal
        isOpen={regularizationModal.isOpen}
        onClose={() => setRegularizationModal({ isOpen: false, attendanceDate: '' })}
        attendanceDate={regularizationModal.attendanceDate}
        onSubmit={handleRegularizationSubmit}
      />
    </>
  )
}
