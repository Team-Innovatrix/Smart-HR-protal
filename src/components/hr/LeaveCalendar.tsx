'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GiftIcon
} from '@heroicons/react/24/outline'
import { 
  getMonthBoundaries, 
  isToday, 
  formatForDisplay
} from '../../lib/timezoneUtils'
import { TimezoneService } from '../../lib/timezoneService'
import { useTimezone } from '../../lib/hooks/useTimezone'
import { useSystemSettings } from '../../lib/hooks/useSystemSettings'

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
  userTimezone?: string
}

interface Holiday {
  name: string
  date: string
}

interface LeaveCalendarProps {
  userId: string
  onDateClick?: (date: Date) => void
}

const LeaveCalendar = ({ userId, onDateClick }: LeaveCalendarProps) => {
  const { timezone, formatDateString, getTodayDateString, getToday } = useTimezone()
  const { settings } = useSystemSettings()
  const [currentDate, setCurrentDate] = useState(() => getToday())
  const [leaves, setLeaves] = useState<LeaveRecord[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredLeave, setHoveredLeave] = useState<LeaveRecord | null>(null)

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true)
      
      // Request the full current month range in the viewer's timezone
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const firstOfMonthLocal = new Date(year, month, 1)
      const lastOfMonthLocal = new Date(year, month + 1, 0)
      const startDateString = formatInTimeZone(firstOfMonthLocal, timezone, 'yyyy-MM-dd')
      const endDateString = formatInTimeZone(lastOfMonthLocal, timezone, 'yyyy-MM-dd')
      
      const response = await fetch(`/api/leaves?userId=${userId}&startDate=${startDateString}&endDate=${endDateString}`)
      const data = await response.json()
      
      if (data.success) {
        // Only show approved leaves on the calendar
        const approvedLeaves = data.data.filter((leave: LeaveRecord) => leave.status === 'approved')
        setLeaves(approvedLeaves)
      }
    } catch (error) {
      console.error('Error fetching leaves:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, currentDate])

  const fetchHolidays = useCallback(async () => {
    try {
      const year = currentDate.getFullYear()
      const response = await fetch(`/api/holidays?year=${year}`)
      const data = await response.json()
      
      if (data.success && data.data[year]) {
        setHolidays(data.data[year])
      }
    } catch (error) {
      console.error('Error fetching holidays:', error)
    }
  }, [currentDate])

  useEffect(() => {
    fetchLeaves()
    fetchHolidays()
  }, [userId, currentDate, fetchLeaves, fetchHolidays])

  const getMonthName = (date: Date) => {
    try {
      return formatForDisplay(date, timezone, 'MMMM yyyy')
    } catch (error) {
      console.error('Error formatting month name:', error)
      return 'Invalid Date'
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    // Convert Sunday (0) to 6, Monday (1) to 0, etc. to make Monday the first day
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7
    
    return { daysInMonth, startingDayOfWeek }
  }

  const getLeavesForDate = (date: Date) => {
    // Use timezone-aware date comparison
    const targetDateString = formatInTimeZone(date, timezone, 'yyyy-MM-dd')
    
    return leaves.filter(leave => {
      try {
        if (!leave.startDate || !leave.endDate) return false
        
        // Parse leave dates in the user's timezone
        const startDate = TimezoneService.parseDateStringInTimezone(leave.startDate, timezone)
        const endDate = TimezoneService.parseDateStringInTimezone(leave.endDate, timezone)
        
        // Get date strings in the user's timezone for comparison
        const leaveStartDateString = formatInTimeZone(startDate, timezone, 'yyyy-MM-dd')
        const leaveEndDateString = formatInTimeZone(endDate, timezone, 'yyyy-MM-dd')
        
        // Check if the target date falls within the leave range (inclusive)
        return targetDateString >= leaveStartDateString && targetDateString <= leaveEndDateString
      } catch (error) {
        console.error('Error processing leave dates:', error, leave)
        return false
      }
    })
  }

  const getHolidaysForDate = (date: Date) => {
    const targetDateString = formatInTimeZone(date, timezone, 'yyyy-MM-dd')
    return holidays.filter(holiday => holiday.date === targetDateString)
  }

  const isWeekend = (date: Date) => {
    if (!settings?.general?.workingDays) return false
    
    const dayName = formatInTimeZone(date, timezone, 'EEEE') // Get full day name (e.g., "Monday")
    return !settings.general.workingDays.includes(dayName)
  }

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'sick':
        return 'bg-red-500'
      case 'casual':
        return 'bg-blue-500'
      case 'annual':
        return 'bg-green-500'
      case 'maternity':
        return 'bg-pink-500'
      case 'paternity':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getLeaveTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    // Format date in user's timezone for display
    return formatForDisplay(date, timezone, 'PPP')
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(getToday())
  }

  const checkIfToday = (date: Date) => {
    return isToday(date)
  }

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 text-gray-300"></div>)
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const leavesForDate = getLeavesForDate(date)
      const holidaysForDate = getHolidaysForDate(date)
      const isTodayDate = checkIfToday(date)
      const isWeekendDate = isWeekend(date)
      
      days.push(
        <div
          key={day}
          className={`p-2 min-h-[80px] border border-gray-200 transition-colors ${
            isWeekendDate 
              ? 'bg-gray-100 opacity-60 cursor-not-allowed' 
              : 'hover:bg-gray-50 cursor-pointer'
          } ${
            isTodayDate ? 'bg-blue-50 border-blue-300' : ''
          } ${holidaysForDate.length > 0 ? 'bg-orange-50 border-orange-200' : ''}`}
          onClick={isWeekendDate ? undefined : () => onDateClick?.(date)}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium ${
              isTodayDate ? 'text-blue-600' : 
              holidaysForDate.length > 0 ? 'text-orange-600' : 
              isWeekendDate ? 'text-gray-500' : 'text-gray-900'
            }`}>
              {day}
            </span>
            <div className="flex items-center space-x-1">
              {holidaysForDate.length > 0 && (
                <GiftIcon className="h-3 w-3 text-orange-500" />
              )}
              {leavesForDate.length > 0 && (
                <span className="text-xs text-gray-500">
                  {leavesForDate.length} leave{leavesForDate.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          
          {/* Holiday indicators */}
          {holidaysForDate.length > 0 && (
            <div className="space-y-1 mb-1">
              {holidaysForDate.slice(0, 2).map((holiday, index) => (
                <div
                  key={`holiday-${index}`}
                  className="text-xs text-orange-800 bg-orange-200 px-2 py-1 rounded truncate"
                  title={holiday.name}
                >
                  {holiday.name}
                </div>
              ))}
              {holidaysForDate.length > 2 && (
                <div className="text-xs text-orange-600 text-center">
                  +{holidaysForDate.length - 2} more
                </div>
              )}
            </div>
          )}
          
          {/* Leave indicators */}
          <div className="space-y-1">
            {leavesForDate.slice(0, holidaysForDate.length > 0 ? 2 : 3).map((leave) => (
              <div
                key={leave._id}
                className={`text-xs text-white px-2 py-1 rounded truncate ${getLeaveTypeColor(leave.leaveType)}`}
                onMouseEnter={() => setHoveredLeave(leave)}
                onMouseLeave={() => setHoveredLeave(null)}
                title={`${getLeaveTypeLabel(leave.leaveType)} Leave`}
              >
                {getLeaveTypeLabel(leave.leaveType)}
              </div>
            ))}
            {leavesForDate.length > (holidaysForDate.length > 0 ? 2 : 3) && (
              <div className="text-xs text-gray-500 text-center">
                +{leavesForDate.length - (holidaysForDate.length > 0 ? 2 : 3)} more
              </div>
            )}
          </div>
        </div>
      )
    }
    
    return days
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Calendar Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Leave Calendar</h3>
          </div>
          
          {/* Month Navigation - Responsive Layout */}
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Month Navigation Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <span className="text-sm sm:text-lg font-medium text-gray-900 min-w-[120px] sm:min-w-[200px] text-center">
                {getMonthName(currentDate)}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            
            {/* Today Button */}
            <button 
              onClick={goToToday} 
              className="px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendar()}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Legend:</span>
            <div className="hidden sm:block text-xs text-gray-500">
              Click on a date to view details
            </div>
          </div>
          
          {/* Legend items - responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            <div className="flex items-center space-x-2">
              <GiftIcon className="h-3 w-3 text-orange-500 flex-shrink-0" />
              <span className="text-xs text-gray-600">Holiday</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded flex-shrink-0"></div>
              <span className="text-xs text-gray-600">Sick</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded flex-shrink-0"></div>
              <span className="text-xs text-gray-600">Casual</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded flex-shrink-0"></div>
              <span className="text-xs text-gray-600">Annual</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-pink-500 rounded flex-shrink-0"></div>
              <span className="text-xs text-gray-600">Maternity</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded flex-shrink-0"></div>
              <span className="text-xs text-gray-600">Paternity</span>
            </div>
          </div>
          
          {/* Mobile instruction text */}
          <div className="block sm:hidden text-xs text-gray-500 text-center">
            Click on a date to view details
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredLeave && (
        <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start space-x-3">
            <div className={`w-3 h-3 ${getLeaveTypeColor(hoveredLeave.leaveType)} rounded-full mt-1`}></div>
            <div>
              <h4 className="font-medium text-gray-900">
                {getLeaveTypeLabel(hoveredLeave.leaveType)} Leave
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(hoveredLeave.startDate)} - {formatDate(hoveredLeave.endDate)}
              </p>
              <p className="text-sm text-gray-600">
                {hoveredLeave.totalDays} day{hoveredLeave.totalDays !== 1 ? 's' : ''}
              </p>
              {hoveredLeave.reason && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Reason:</span> {hoveredLeave.reason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaveCalendar