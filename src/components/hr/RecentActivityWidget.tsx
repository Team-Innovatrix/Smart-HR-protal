'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  ClockIcon, 
  CalendarIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ClockIcon as Clock3Icon,
  ChartBarIcon,
  ChartBarIcon as TrendingUpIcon,
  BoltIcon,
  GiftIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { getHRPortalPath } from '../../lib/urlUtils'
import { useTimezone } from '../../lib/hooks/useTimezone'

interface ActivityItem {
  id: string
  type: 'attendance' | 'leave'
  title: string
  description: string
  time: string
  timestamp: number
  status: 'success' | 'warning' | 'error' | 'info'
  icon: React.ReactNode
}

interface RecentActivityWidgetProps {
  userId: string
}

const RecentActivityWidget = ({ userId }: RecentActivityWidgetProps) => {
  const { safeFormatDate, parseDateString, timezone, getTodayDateString, getToday } = useTimezone()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'absent':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'half-day':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'holiday':
        return <GiftIcon className="h-5 w-5 text-purple-500" />
      case 'weekly-off':
        return <GiftIcon className="h-5 w-5 text-white-500" />
      case 'late':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
      case 'early-leave':
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-white" />
    }
  }

  const getLeaveIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'pending':
        return <Clock3Icon className="h-5 w-5 text-yellow-500" />
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <CalendarIcon className="h-5 w-5 text-white-500" />
    }
  }

  const formatTimeAgo = useCallback((date: Date) => {
    const now = getToday()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }, [getToday])

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const timestamp = Date.now()
        
        // Fetch recent attendance records
        const attendanceResponse = await fetch(`/api/attendance?userId=${userId}&_t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        if (!attendanceResponse.ok) throw new Error(`Attendance API: ${attendanceResponse.status}`)
        const attendanceData = await attendanceResponse.json()

        // Fetch recent leave requests
        const leavesResponse = await fetch(`/api/leaves?userId=${userId}&_t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        if (!leavesResponse.ok) throw new Error(`Leaves API: ${leavesResponse.status}`)
        const leavesData = await leavesResponse.json()

        // Combine and format activities
        const formattedActivities: ActivityItem[] = []

        // Add attendance activities (only attendance type)
        if (attendanceData.data && attendanceData.data.length > 0) {
          attendanceData.data.forEach((attendance: any) => {
            const date = parseDateString(attendance.date)
            const status = attendance.status === 'present' ? 'success' : 
                          attendance.status === 'half-day' ? 'warning' : 'error'
            
            formattedActivities.push({
              id: attendance._id,
              type: 'attendance',
              title: `Attendance - ${attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}`,
              description: `${safeFormatDate(getTodayDateString(), 'MMM d, yyyy')} • ${attendance.totalHours ? attendance.totalHours.toFixed(1) + ' hours' : 'No clock out'}`,
              time: formatTimeAgo(date),
              timestamp: date.getTime(),
              status,
              icon: getStatusIcon(attendance.status)
            })
          })
        }

        // Add leave activities (only leave type)
        if (leavesData.data && leavesData.data.length > 0) {
          leavesData.data.forEach((leave: any) => {
            const appliedDate = new Date(leave.appliedDate)
            const status = leave.status === 'approved' ? 'success' : 
                          leave.status === 'pending' ? 'warning' : 'error'
            
            formattedActivities.push({
              id: leave._id,
              type: 'leave',
              title: `${leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave Request`,
              description: `${leave.startDate.split('T')[0]} to ${leave.endDate.split('T')[0]} • ${leave.totalDays} days`,
              time: formatTimeAgo(appliedDate),
              timestamp: appliedDate.getTime(),
              status,
              icon: getLeaveIcon(leave.status)
            })
          })
        }

        // Keep only attendance and leave items, sort by real timestamp, show top 2
        const filtered = formattedActivities.filter(a => a.type === 'attendance' || a.type === 'leave')
        filtered.sort((a, b) => b.timestamp - a.timestamp)
        setActivities(filtered.slice(0, 2))

      } catch (error) {
        console.error('Error fetching recent activities:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchRecentActivities()
    }
  }, [userId, formatTimeAgo, getTodayDateString, parseDateString, safeFormatDate])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'from-green-500 to-emerald-600'
      case 'warning':
        return 'from-yellow-500 to-amber-600'
      case 'error':
        return 'from-red-500 to-rose-600'
      default:
        return 'from-blue-500 to-indigo-600'
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'glass border-green-500/30'
      case 'warning':
        return 'glass border-yellow-500/30'
      case 'error':
        return 'glass border-red-500/30'
      default:
        return 'glass border-blue-500/30'
    }
  }

  if (loading) {
    return (
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <ChartBarIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Recent Activity</h3>
          </div>
          <div className="h-4 w-20 bg-[var(--glass-border)] rounded-lg animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="h-10 w-10 bg-[var(--glass-border)] rounded-xl"></div>
              <div className="flex-1">
                <div className="h-4 bg-[var(--glass-border)] rounded-lg mb-2"></div>
                <div className="h-3 bg-[var(--glass-border)] rounded-lg w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-5 rounded-full -translate-y-16 translate-x-16"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <ChartBarIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Recent Activity</h3>
              <p className="text-sm text-[var(--text-muted)]">Your latest updates and actions</p>
            </div>
          </div>
        </div>

        {/* Activity List */}
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 glass rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--glass-border)]">
              <ClockIcon className="h-8 w-8 text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-primary)] font-medium mb-2">No recent activity</p>
            <p className="text-sm text-[var(--text-muted)]">Your activities will appear here as you use the portal</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`group p-4 rounded-xl border ${getStatusBgColor(activity.status)} hover:shadow-md transition-all duration-200 cursor-pointer`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 bg-gradient-to-br ${getStatusColor(activity.status)} rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                      {activity.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors flex-1">
                        {activity.title}
                      </p>
                      {/* Show timestamp only on larger screens */}
                      <span className="hidden sm:block text-xs text-[var(--text-muted)] font-medium bg-white/10 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                        {activity.time}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mb-2">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 bg-gradient-to-r ${getStatusColor(activity.status)} rounded-full`}></div>
                        <span className="text-xs text-[var(--text-muted)] capitalize">
                          {activity.type} • {activity.status}
                        </span>
                      </div>
                      {/* Show timestamp on mobile below the status */}
                      <span className="sm:hidden text-xs text-[var(--text-muted)] font-medium">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[var(--glass-border)]">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-sm text-[var(--text-muted)]">
              <TrendingUpIcon className="h-4 w-4" />
              <span>Showing {activities.length} recent activities</span>
            </div>
            <Link
              href={getHRPortalPath('attendance')}
              className="flex items-center space-x-2 text-[var(--accent)] hover:text-white font-medium text-sm group transition-colors"
            >
              <BoltIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>View full history</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecentActivityWidget
