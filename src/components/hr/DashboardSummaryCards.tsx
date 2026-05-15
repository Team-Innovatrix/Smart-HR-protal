'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  ExclamationTriangleIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  BoltIcon,
  TagIcon,
  GiftIcon,
  ClockIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline'
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';
import { useRealTimeUpdates } from '@/lib/contexts/RealTimeUpdateContext'
import { useRouter } from 'next/navigation'
import { getLocationWithAddress, isGeolocationAvailable } from '@/lib/geolocationUtils'
import { useSystemSettings } from '@/lib/hooks/useSystemSettings'
import { requestLocationPermission, showLocationPermissionMessage } from '@/lib/locationPermissionUtils'
import { useTimezone } from '@/lib/hooks/useTimezone'
import { Button } from '../global/Button'
import { responsiveTextClasses } from '@/lib/utils/textUtils'
import { layoutSpacing } from '@/lib/utils/spacingUtils'
import { iconContextSizes } from '@/lib/utils/iconUtils'

interface SummaryData {
  todayStatus: 'present' | 'absent' | 'half-day' | 'not-clocked-in' | 'clocked-in' | 'clock-out-missing' | 'late' | 'early-leave' | 'holiday'
  monthlyStats: {
    presentDays: number
    absentDays: number
    totalHours: number
    totalDays: number
    daysElapsed: number
  }
    leaveBalance: {
      sick: number
      casual: number
      annual: number
      maternity?: number
      paternity?: number
    }
  pendingRequests: number
  pendingRegularizationRequests: number
}

interface DashboardSummaryCardsProps {
  userId: string
}

const DashboardSummaryCards = ({ userId }: DashboardSummaryCardsProps) => {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const { subscribeToAttendanceUpdates, isUpdating } = useRealTimeUpdates()
  const { settings, loading: settingsLoading } = useSystemSettings()
  const { timezone, getToday, getTodayDateString, formatDateString, formatTime, timezoneReady } = useTimezone()
  const [summaryData, setSummaryData] = useState<SummaryData>({
    todayStatus: 'not-clocked-in',
    monthlyStats: {
      presentDays: 0,
      absentDays: 0,
      totalHours: 0,
      totalDays: 0,
      daysElapsed: 0
    },
    leaveBalance: {
      sick: 0,
      casual: 0,
      annual: 0,
      maternity: 0,
      paternity: 0
    },
    pendingRequests: 0,
    pendingRegularizationRequests: 0
  })
  const [loading, setLoading] = useState(true)
  const [clockingIn, setClockingIn] = useState(false)
  const [clockingOut, setClockingOut] = useState(false)
  const [clockError, setClockError] = useState<string | null>(null)

  const fetchSummaryData = useCallback(async () => {
    if (!user?.id || !isLoaded) return
    
    try {
      // Add timestamp to force fresh data
      const timestamp = Date.now()
      
      // Fetch today's attendance - use user timezone date
      const today = getTodayDateString()
      console.log('🕐 Fetching today\'s attendance with date:', today, 'timezone:', timezone)
      const attendanceResponse = await fetch(`/api/attendance?userId=${userId}&date=${today}&_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (!attendanceResponse.ok) {
        throw new Error(`Failed to fetch today's attendance: ${attendanceResponse.status}`)
      }
      
      let attendanceData
      try {
        const responseText = await attendanceResponse.text()
        if (!responseText.trim()) {
          throw new Error('Empty response from attendance API')
        }
        attendanceData = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Error parsing attendance response:', parseError)
        throw new Error('Invalid response from attendance API')
      }
      console.log('🕐 Today\'s attendance API response:', attendanceData)

      // Fetch monthly attendance - use user timezone
      const now = getToday()
      const year = now.getFullYear()
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      const monthlyResponse = await fetch(`/api/attendance?userId=${userId}&month=${month}&year=${year}&_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (!monthlyResponse.ok) {
        throw new Error(`Failed to fetch monthly attendance: ${monthlyResponse.status}`)
      }
      
      let monthlyData
      try {
        const responseText = await monthlyResponse.text()
        if (!responseText.trim()) {
          throw new Error('Empty response from monthly attendance API')
        }
        monthlyData = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Error parsing monthly attendance response:', parseError)
        throw new Error('Invalid response from monthly attendance API')
      }
      
      // Debug logging
      console.log('Monthly attendance API response:', monthlyData)
      console.log('Current month:', month, 'year:', year)
      console.log('API success:', monthlyData.success)
      console.log('API data:', monthlyData.data)

      // Determine role from Clerk publicMetadata
      const role = (user?.publicMetadata as any)?.role as string | undefined
      const isManagerOrHR = role === 'manager' || role === 'hr'

      // Pending count: managers/HR see direct reports pending; employees see own pending
      let pendingCount = 0
      if (isManagerOrHR) {
        const directReportsPendingResponse = await fetch(`/api/leaves/direct-reports?status=pending&limit=500&_t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        let directReportsPendingData
        try {
          const responseText = await directReportsPendingResponse.text()
          if (!responseText.trim()) {
            throw new Error('Empty response from direct reports API')
          }
          directReportsPendingData = JSON.parse(responseText)
        } catch (parseError) {
          console.error('Error parsing direct reports response:', parseError)
          directReportsPendingData = { data: [] }
        }
        pendingCount = Array.isArray(directReportsPendingData.data) ? directReportsPendingData.data.length : 0
      } else {
        const leavesResponse = await fetch(`/api/leaves?userId=${userId}&status=pending&_t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        let leavesData
        try {
          const responseText = await leavesResponse.text()
          if (!responseText.trim()) {
            throw new Error('Empty response from leaves API')
          }
          leavesData = JSON.parse(responseText)
        } catch (parseError) {
          console.error('Error parsing leaves response:', parseError)
          leavesData = { data: [] }
        }
        pendingCount = Array.isArray(leavesData.data) ? leavesData.data.length : 0
      }

      // Fetch pending regularization requests
      let pendingRegularizationCount = 0
      if (isManagerOrHR) {
        // HR/Managers see all pending regularization requests
        const regularizationResponse = await fetch(`/api/regularization/admin?status=pending&limit=500&_t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        let regularizationData
        try {
          const responseText = await regularizationResponse.text()
          if (!responseText.trim()) {
            throw new Error('Empty response from regularization admin API')
          }
          regularizationData = JSON.parse(responseText)
        } catch (parseError) {
          console.error('Error parsing regularization admin response:', parseError)
          regularizationData = { data: { requests: [] } }
        }
        pendingRegularizationCount = Array.isArray(regularizationData.data?.requests) ? regularizationData.data.requests.length : 0
      } else {
        // Regular users see their own pending regularization requests
        const regularizationResponse = await fetch(`/api/regularization/my?status=pending&_t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        let regularizationData
        try {
          const responseText = await regularizationResponse.text()
          if (!responseText.trim()) {
            throw new Error('Empty response from regularization my API')
          }
          regularizationData = JSON.parse(responseText)
        } catch (parseError) {
          console.error('Error parsing regularization my response:', parseError)
          regularizationData = { data: { requests: [] } }
        }
        pendingRegularizationCount = Array.isArray(regularizationData.data?.requests) ? regularizationData.data.requests.length : 0
      }

      // Fetch user profile for leave balance
      const profileResponse = await fetch(`/api/profile?userId=${userId}&_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      let profileData
      try {
        const responseText = await profileResponse.text()
        if (!responseText.trim()) {
          throw new Error('Empty response from profile API')
        }
        profileData = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Error parsing profile response:', parseError)
        profileData = { data: { leaveBalance: { sick: 0, casual: 0, annual: 0, maternity: 0, paternity: 0 } } }
      }

      setSummaryData({
        todayStatus: (() => {
          if (!attendanceData.data) return 'not-clocked-in'
          
          // Check if there's an open session (clocked in but not clocked out)
          const hasOpenSession = attendanceData.data.sessions && 
            attendanceData.data.sessions.some((session: any) => !session.clockOut)
          
          if (hasOpenSession) {
            return 'clocked-in'
          }
          
          // Handle clock-out-missing status (user clocked in but hasn't clocked out)
          if (attendanceData.data.status === 'clock-out-missing') {
            return 'clocked-in'
          }
          
          // If there are completed sessions but no open session, 
          // we still allow clocking in again, so return the status
          return attendanceData.data.status || 'not-clocked-in'
        })(),
        monthlyStats: (() => {
          const summary = monthlyData.data?.summary
          if (!summary) {
            return {
              presentDays: 0,
              absentDays: 0,
              totalHours: 0,
              totalDays: 0,
              daysElapsed: 0
            }
          }
          
          // Use successfulDays which now includes holidays and weekends up to today only
          // This gives a more accurate attendance rate that includes past holidays/weekends
          const presentDays = summary.successfulDays || 0
          
          return {
            presentDays,
            absentDays: summary.absentDays || 0,
            totalHours: summary.totalHours || 0,
            totalDays: summary.totalDays || 0,
            daysElapsed: summary.daysElapsed || 0
          }
        })(),
        leaveBalance: profileData.data?.leaveBalance || {
          sick: 0,
          casual: 0,
          annual: 0,
          maternity: 0,
          paternity: 0
        },
        pendingRequests: pendingCount,
        pendingRegularizationRequests: pendingRegularizationCount
      })
    } catch (error) {
      console.error('Error fetching summary data:', error)
      // Set fallback data to prevent complete failure
      setSummaryData(prev => ({
        ...prev,
        todayStatus: 'not-clocked-in',
        monthlyStats: {
          presentDays: 0,
          absentDays: 0,
          totalHours: 0,
          totalDays: 0,
          daysElapsed: 0
        },
        leaveBalance: {
          sick: 0,
          casual: 0,
          annual: 0,
          maternity: 0,
          paternity: 0
        },
        pendingRequests: 0,
        pendingRegularizationRequests: 0
      }))
    } finally {
      setLoading(false)
    }
  }, [userId, user?.publicMetadata, getToday, getTodayDateString, timezone])

  const handleClockIn = async () => {
    if (!user || !timezoneReady) return
    
    try {
      setClockingIn(true)
      setClockError(null)
      
      let location = null
      
      // Check if location is required based on system settings
      const isLocationRequired = settings?.attendance?.geoLocationRequired || false
      
      if (isLocationRequired) {
        // Location is required - request permission and get location
        const locationResult = await requestLocationPermission({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000 // 5 minutes
        })
        
        if (!locationResult.granted) {
          // Show user-friendly message and stop clock-in
          showLocationPermissionMessage(locationResult.error || 'Location access is required to clock in', locationResult.userDeclined)
          setClockError(locationResult.error || 'Location access is required to clock in')
          return
        }
        
        location = locationResult.location
      } else {
        // Location is optional - try to get it but don't block clock-in
        if (isGeolocationAvailable()) {
          try {
            location = await getLocationWithAddress({
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000 // 5 minutes
            })
          } catch (locationError) {
            console.warn('Failed to get location for clock in:', locationError)
            // Continue without location - don't block clock in
          }
        }
      }
      
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'clock-in',
          notes: '',
          location: location
        }),
      })
      
      if (response.status === 401) {
        router.replace('/auth')
        return
      }
      
      const data = await response.json()
      if (data.success) {
        // Refresh data to update the status
        await fetchSummaryData()
      } else {
        setClockError(data.message || 'Failed to clock in')
      }
    } catch (error) {
      console.error('Error clocking in:', error)
      setClockError('Failed to clock in')
    } finally {
      setClockingIn(false)
    }
  }

  const handleClockOut = async () => {
    if (!user) return
    
    try {
      setClockingOut(true)
      setClockError(null)
      
      // Try to get location if geolocation is available
      let location = null
      if (isGeolocationAvailable()) {
        try {
          location = await getLocationWithAddress({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          })
        } catch (locationError) {
          console.warn('Failed to get location for clock out:', locationError)
          // Continue without location - don't block clock out
        }
      }
      
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'clock-out',
          notes: '',
          location: location
        }),
      })
      
      if (response.status === 401) {
        router.replace('/auth')
        return
      }
      
      const data = await response.json()
      if (data.success) {
        // Refresh data to update the status
        await fetchSummaryData()
      } else {
        setClockError(data.message || 'Failed to clock out')
      }
    } catch (error) {
      console.error('Error clocking out:', error)
      setClockError('Failed to clock out')
    } finally {
      setClockingOut(false)
    }
  }


  useEffect(() => {
    if (userId && isLoaded) {
      fetchSummaryData()
    }
  }, [userId, isLoaded, user?.publicMetadata, fetchSummaryData, timezone, getToday, getTodayDateString])

  // Subscribe to real-time attendance updates
  useEffect(() => {
    if (userId && isLoaded) {
      const unsubscribe = subscribeToAttendanceUpdates(() => {
        console.log('Attendance update received, refreshing dashboard data...')
        fetchSummaryData()
      })
      
      return unsubscribe
    }
  }, [userId, isLoaded, subscribeToAttendanceUpdates, fetchSummaryData])

  const getStatusIcon = (status: string) => {
    const iconSize = iconContextSizes.card.header
    switch (status) {
      case 'present':
        return <CheckCircleIcon className={`${iconSize} text-green-500`} />
      case 'absent':
        return <XCircleIcon className={`${iconSize} text-red-500`} />
      case 'half-day':
        return <ExclamationTriangleIcon className={`${iconSize} text-yellow-500`} />
      case 'late':
        return <ExclamationTriangleIcon className={`${iconSize} text-orange-500`} />
      case 'early-leave':
        return <ExclamationTriangleIcon className={`${iconSize} text-blue-500`} />
      case 'holiday':
        return <GiftIcon className={`${iconSize} text-purple-500`} />
      case 'weekly-off':
        return <GiftIcon className={`${iconSize} text-indigo-500`} />
      case 'clocked-in':
      case 'clock-out-missing':
        return <ClockIcon className={`${iconSize} text-blue-500`} />
      default:
        return <ClockIcon className={`${iconSize} text-blue-500`} />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Present'
      case 'absent':
        return 'Absent'
      case 'half-day':
        return 'Half Day'
      case 'late':
        return 'Late'
      case 'early-leave':
        return 'Early Leave'
      case 'holiday':
        return 'Holiday'
      case 'weekly-off':
        return 'Weekly Off'
      case 'clocked-in':
      case 'clock-out-missing':
        return 'Clocked In'
      default:
        return 'Not Clocked In'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'from-green-500 to-emerald-600'
      case 'absent':
        return 'from-red-500 to-rose-600'
      case 'half-day':
        return 'from-yellow-500 to-amber-600'
      case 'late':
        return 'from-orange-500 to-red-600'
      case 'early-leave':
        return 'from-blue-500 to-indigo-600'
      case 'holiday':
        return 'from-purple-500 to-violet-600'
      case 'weekly-off':
        return 'from-indigo-500 to-blue-600'
      case 'clocked-in':
      case 'clock-out-missing':
        return 'from-blue-500 to-indigo-600'
      default:
        return 'from-blue-500 to-indigo-600'
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-50 border-green-200'
      case 'absent':
        return 'bg-red-50 border-red-200'
      case 'half-day':
        return 'bg-yellow-50 border-yellow-200'
      case 'late':
        return 'bg-orange-50 border-orange-200'
      case 'early-leave':
        return 'bg-blue-50 border-blue-200'
      case 'holiday':
        return 'bg-purple-50 border-purple-200'
      case 'weekly-off':
        return 'bg-indigo-50 border-indigo-200'
      case 'clocked-in':
      case 'clock-out-missing':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 ${layoutSpacing.card} animate-pulse`}>
            <div className="h-6 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-8 bg-gray-200 rounded-lg mb-2"></div>
            <div className="h-4 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${layoutSpacing.grid} mb-8`}>
      {/* Today's Status */}
      <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border ${getStatusBgColor(summaryData.todayStatus)} ${layoutSpacing.card} relative overflow-hidden group hover:shadow-xl transition-all duration-300`}>
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity duration-300 ${getStatusColor(summaryData.todayStatus)} rounded-full -translate-y-16 translate-x-16`}></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Today&apos;s Status</h3>
            {getStatusIcon(summaryData.todayStatus)}
          </div>
          
          <div className="mb-3">
            <p className={`text-3xl font-bold bg-gradient-to-r ${getStatusColor(summaryData.todayStatus)} bg-clip-text text-transparent`}>
              {getStatusText(summaryData.todayStatus)}
            </p>
          </div>
          
          <p className="text-sm text-gray-500 font-medium mb-4">
            {formatTime(getToday(), 'EEEE, MMMM d, yyyy')}
          </p>
          
          {/* Clock In/Out Buttons */}
          <div className="space-y-2">
            {summaryData.todayStatus === 'clocked-in' || summaryData.todayStatus === 'clock-out-missing' ? (
              <Button
                onClick={handleClockOut}
                disabled={clockingOut}
                variant="danger"
                size="md"
                fullWidth
                loading={clockingOut}
                leftIcon={!clockingOut ? <StopIcon className="w-4 h-4" /> : undefined}
              >
                {clockingOut ? 'Clocking Out...' : 'Clock Out'}
              </Button>
            ) : (
              <Button
                onClick={handleClockIn}
                disabled={clockingIn}
                variant="success"
                size="md"
                fullWidth
                loading={clockingIn}
                leftIcon={!clockingIn ? <PlayIcon className="w-4 h-4" /> : undefined}
              >
                {clockingIn ? 'Clocking In...' : 'Clock In'}
              </Button>
            )}
            
            {/* Error Message */}
            {clockError && (
              <div className="text-red-500 text-xs text-center bg-red-50 border border-red-200 rounded-lg p-2">
                {clockError}
              </div>
            )}
          </div>
          
          {/* Real-time update indicator */}
          {isUpdating && (
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Attendance */}
      <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 ${layoutSpacing.card} relative overflow-hidden group hover:shadow-xl transition-all duration-300`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-10 group-hover:opacity-20 transition-opacity duration-300 rounded-full -translate-y-16 translate-x-16"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Monthly Progress</h3>
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <TagIcon className={`${iconContextSizes.card.header} text-white`} />
            </div>
          </div>
          
          <div className="mb-3">
            <p className="text-3xl font-bold text-gray-900">
              {summaryData.monthlyStats.presentDays}
            </p>
            <span className="text-sm text-gray-500 font-medium">/ {summaryData.monthlyStats.totalDays} days</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ChartBarIcon className={`${iconContextSizes.status.success} text-green-500 mr-2`} />
              <p className="text-sm font-semibold text-green-600">
                {summaryData.monthlyStats.totalHours.toFixed(1)}h
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Attendance Rate</p>
              <p className="text-sm font-bold text-gray-900">
                {summaryData.monthlyStats.daysElapsed > 0 ? Math.round((summaryData.monthlyStats.presentDays / summaryData.monthlyStats.daysElapsed) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Balance */}
      <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 ${layoutSpacing.card} relative overflow-hidden group hover:shadow-xl transition-all duration-300`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-600 opacity-10 group-hover:opacity-20 transition-opacity duration-300 rounded-full -translate-y-16 translate-x-16"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Leave Balance</h3>
            <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <GiftIcon className={`${iconContextSizes.card.header} text-white`} />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-700">Sick Leave</span>
              <span className="text-sm font-bold text-purple-900">{summaryData.leaveBalance.sick} days</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-700">Casual Leave</span>
              <span className="text-sm font-bold text-blue-900">{summaryData.leaveBalance.casual} days</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-700">Annual Leave</span>
              <span className="text-sm font-bold text-green-900">{summaryData.leaveBalance.annual} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 ${layoutSpacing.card} relative overflow-hidden group hover:shadow-xl transition-all duration-300`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500 to-red-600 opacity-10 group-hover:opacity-20 transition-opacity duration-300 rounded-full -translate-y-16 translate-x-16"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending Requests</h3>
            <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <ExclamationTriangleIcon className={`${iconContextSizes.card.header} text-white`} />
            </div>
          </div>
          
          <div className="mb-3">
            <p className="text-3xl font-bold text-gray-900">
              {summaryData.pendingRequests + summaryData.pendingRegularizationRequests}
            </p>
            <span className="text-sm text-gray-500 font-medium">requests</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 font-medium">
                Leave Requests
              </p>
              <span className="text-sm font-bold text-gray-900">
                {summaryData.pendingRequests}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 font-medium">
                Regularization
              </p>
              <span className="text-sm font-bold text-gray-900">
                {summaryData.pendingRegularizationRequests}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-gray-600 font-medium">
              Awaiting approval
            </p>
            <div className="flex items-center">
              <BoltIcon className={`${iconContextSizes.status.warning} text-orange-500 mr-1`} />
              <span className="text-xs text-orange-600 font-semibold">Action Required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardSummaryCards
