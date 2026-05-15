'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';
import { CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline'
import { useTimezone } from '@/lib/hooks/useTimezone'
import { formatInTimeZone } from 'date-fns-tz'

interface LeaveRecord {
  _id: string
  userId: string
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

interface UpcomingLeaveProps {
  onActionCompleted?: () => void
}

const UpcomingLeave = ({ onActionCompleted }: UpcomingLeaveProps) => {
  const { user, isLoaded } = useUser()
  const { timezone, getToday, formatTime, getTodayDateString } = useTimezone()
  const [upcoming, setUpcoming] = useState<LeaveRecord[]>([])
  const [loading, setLoading] = useState(true)


  const fetchUpcoming = useCallback(async () => {
    if (!user?.id || !isLoaded) return
    
    try {
      setLoading(true)
      // Use user timezone for today's date and end-of-year range
      const todayInUserTimezone = getToday()
      const endOfYearLocal = new Date(todayInUserTimezone.getFullYear(), 11, 31)
      const startDateString = formatInTimeZone(todayInUserTimezone, timezone, 'yyyy-MM-dd')
      const endDateString = formatInTimeZone(endOfYearLocal, timezone, 'yyyy-MM-dd')
      
      // Fetch approved leaves within [today .. end of year] in user's timezone
      const res = await fetch(`/api/leaves?userId=${user.id}&status=approved&startDate=${startDateString}&endDate=${endDateString}`)
      const data = await res.json()
      
      if (data.success) {
        // Filter to only show leaves that start today or later in user's timezone (date-only compare)
        const todayDateOnly = formatInTimeZone(todayInUserTimezone, timezone, 'yyyy-MM-dd')
        const futureLeaves = data.data.filter((leave: LeaveRecord) => {
          const leaveStartDateOnly = formatInTimeZone(new Date(leave.startDate), timezone, 'yyyy-MM-dd')
          return leaveStartDateOnly >= todayDateOnly
        })
        
        // Sort by start date
        futureLeaves.sort((a: LeaveRecord, b: LeaveRecord) => 
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        )
        
        setUpcoming(futureLeaves)
      }
    } catch (e) {
      console.error('Failed to load upcoming leaves', e)
    } finally {
      setLoading(false)
    }
  }, [user?.id, isLoaded, getToday, getTodayDateString])

  useEffect(() => {
    if (user && isLoaded) {
      fetchUpcoming()
    }
  }, [user, isLoaded, timezone, fetchUpcoming])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return formatTime(date, 'MMM d, yyyy')
  }

  const getDaysUntilLeave = (startDate: string) => {
    const todayInUserTimezone = getToday()
    const leaveDate = new Date(startDate)
    const diffTime = leaveDate.getTime() - todayInUserTimezone.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading upcoming leaves...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Leave</h3>
        </div>
        <span className="text-sm text-gray-600">{upcoming.length} upcoming</span>
      </div>

      {upcoming.length === 0 ? (
        <div className="px-6 py-10 text-center text-gray-500">No upcoming approved leave requests</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {upcoming.map(leave => {
            const daysUntil = getDaysUntilLeave(leave.startDate)
            return (
              <li key={leave._id} className="px-6 py-4">
                <div className="flex items-start space-x-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {leave.leaveType} Leave
                      </div>
                      <div className="text-xs text-gray-500">
                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)} • {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                    </div>
                    {leave.reason && (
                      <div className="text-xs text-gray-500 mt-1">Reason: {leave.reason}</div>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default UpcomingLeave
