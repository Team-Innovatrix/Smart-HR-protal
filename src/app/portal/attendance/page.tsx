'use client'

import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toggles } from '../../../lib/utils'
import HRPortalLayout from '../../../components/hr/HRPortalLayout'
import TeamAttendance from '../../../components/hr/TeamAttendance'
import MyAttendance from '../../../components/hr/MyAttendance'
import { useRealTimeUpdates } from '../../../lib/contexts/RealTimeUpdateContext'
import { useTimezone } from '../../../lib/hooks/useTimezone'
import { useSystemSettings } from '../../../lib/hooks/useSystemSettings'
import { requestLocationPermission, showLocationPermissionMessage } from '../../../lib/locationPermissionUtils'
import { isGeolocationAvailable, getLocationWithAddress } from '../../../lib/geolocationUtils'
import { RegularizationRequestManagerProvider } from '../../../components/hr/RegularizationRequestManager'
import { 
  ClockIcon
} from '@heroicons/react/24/outline'

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
  // Main branch fields
  clockIn: string // First clock-in of the day
  clockOut?: string // Last clock-out of the day
  totalHours: number // Effective clocked-in hours so far
  status: 'half-day' | 'full-day' | 'absent'
  notes?: string // Last notes
  // Detailed sessions
  sessions: AttendanceSession[]
}

export default function AttendancePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { subscribeToAttendanceUpdates } = useRealTimeUpdates()
  const { settings } = useSystemSettings()
  const { timezone, getToday, getTodayDateString, parseDateString, timezoneReady } = useTimezone()

  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [clockingIn, setClockingIn] = useState(false)
  const [clockingOut, setClockingOut] = useState(false)
  const [notes, setNotes] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(() => getToday().toISOString().slice(0, 7))
  const [activeView, setActiveView] = useState<'my' | 'team'>('my')
  const [hasReportees, setHasReportees] = useState<boolean>(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set())

  // Toggle expand state for a record
  const toggleRecordExpand = (recordId: string) => {
    setExpandedRecords(prev => {
      const newSet = new Set(prev)
      if (newSet.has(recordId)) {
        newSet.delete(recordId)
      } else {
        newSet.add(recordId)
      }
      return newSet
    })
  }

  // Handle query parameters for auto-switching to team view and setting month for my view
  const [teamViewMode, setTeamViewMode] = useState<'today' | 'month'>('today')
  const [teamInitialMonth, setTeamInitialMonth] = useState<string | undefined>(undefined)
  
  useEffect(() => {
    const view = searchParams.get('view')
    const range = searchParams.get('range')
    const month = searchParams.get('month')
    
    if (view === 'team') {
      console.log(' Auto-switching to team view from query params', { range, month })
      setActiveView('team')
      
      // Set the date range mode for TeamAttendance
      if (range === 'month' || range === 'today') {
        setTeamViewMode(range as 'today' | 'month')
      }
      
      // Set the initial month if provided (e.g., "September")
      if (month) {
        setTeamInitialMonth(month)
      }
    } else if (view === 'my' && month) {
      // Handle "my" view with month parameter (YYYY-MM format)
      console.log(' Setting month for my attendance view from query params', { month })
      setActiveView('my')
      setSelectedMonth(month)
    }
  }, [searchParams])




  const fetchAttendanceData = useCallback(async (retryCount = 0, isBackgroundRefresh = false) => {
    if (!user?.id || !isLoaded) return
    
    try {
      if (!isBackgroundRefresh) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }
      
      // Fetch today's attendance - use user timezone date to match stored data
      const today = getTodayDateString()
      const cacheBuster = `t=${Date.now()}`
      
      console.log(' Fetching attendance data:', {
        timezone,
        today,
        userId: user?.id
      })
      
      const todayResponse = await fetch(`/api/attendance?userId=${user?.id}&date=${today}&${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (todayResponse.status === 401) {
        router.replace('/auth')
        return
      }
      
      if (!todayResponse.ok) {
        throw new Error(`Failed to fetch today's attendance: ${todayResponse.status}`)
      }
      
      const todayData = await todayResponse.json()
      console.log(' Attendance data received:', {
        success: todayData.success,
        hasData: !!todayData.data,
        data: todayData.data,
        sessions: todayData.data?.sessions?.length || 0
      })
      setTodayAttendance(todayData.data)

      // Fetch monthly attendance
      const [year, month] = selectedMonth.split('-')
      const monthlyResponse = await fetch(`/api/attendance?userId=${user?.id}&month=${month}&year=${year}&${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (monthlyResponse.status === 401) {
        router.replace('/auth')
        return
      }
      
      if (!monthlyResponse.ok) {
        throw new Error(`Failed to fetch monthly attendance: ${monthlyResponse.status}`)
      }
      
      const monthlyData = await monthlyResponse.json()
      const records: AttendanceRecord[] = Array.isArray(monthlyData.data?.records)
        ? monthlyData.data.records.slice()
        : []
      
      // Debug: Log the dates we're receiving
      console.log('AttendancePage: Received attendance records:', records.map(r => ({ 
        id: r._id, 
        date: r.date, 
        type: typeof r.date,
        isValid: !isNaN(new Date(r.date).getTime())
      })));
      
      // Sort records by date descending (most recent first)
      records.sort((a, b) => parseDateString(b.date).getTime() - parseDateString(a.date).getTime())
      setAttendanceHistory(records)

    } catch (error) {
      console.error('Error fetching attendance data:', error)
      
      // Retry logic for network errors
      if (retryCount < 2 && error instanceof Error && error.message.includes('Failed to fetch')) {
        console.log(`Retrying fetchAttendanceData (attempt ${retryCount + 1})...`)
        setTimeout(() => fetchAttendanceData(retryCount + 1), 1000 * (retryCount + 1))
        return
      }
      
      // Show user-friendly error message
      if (retryCount >= 2) {
        console.error('Failed to fetch attendance data after multiple retries')
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [user?.id, selectedMonth, router, timezone, getTodayDateString, parseDateString])

  // Periodic refresh to ensure UI stays up-to-date (every 30 seconds)
  useEffect(() => {
    if (!user || !isLoaded) return

    const refreshInterval = setInterval(() => {
      console.log('Periodic attendance refresh...')
      fetchAttendanceData(0, true) // Background refresh
    }, 30000) // 30 seconds

    return () => clearInterval(refreshInterval)
  }, [user, isLoaded, fetchAttendanceData])

  useEffect(() => {
    if (user && isLoaded && timezone) {
      fetchAttendanceData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoaded, timezone, selectedMonth])

  // Subscribe to real-time attendance updates
  useEffect(() => {
    if (!user || !isLoaded) return

    const unsubscribe = subscribeToAttendanceUpdates(() => {
      console.log('Real-time attendance update triggered, refreshing data...')
      fetchAttendanceData()
    })

    return unsubscribe
  }, [user, isLoaded, subscribeToAttendanceUpdates, fetchAttendanceData])

  // Listen for custom attendance update events
  useEffect(() => {
    const handleAttendanceUpdate = (event: CustomEvent) => {
      const { action, userId } = event.detail
      if (userId === user?.id) {
        console.log(`Attendance ${action} detected, refreshing data...`)
        fetchAttendanceData()
      }
    }

    window.addEventListener('attendanceUpdated', handleAttendanceUpdate as EventListener)
    return () => {
      window.removeEventListener('attendanceUpdated', handleAttendanceUpdate as EventListener)
    }
  }, [user?.id, fetchAttendanceData])

  useEffect(() => {
    const checkReportees = async () => {
      if (!user || !isLoaded) return
      
      try {
        const res = await fetch('/api/profile/reportees?limit=1')
        
        if (res.status === 401) {
          setHasReportees(false)
          return
        }
        
        const data = await res.json()
        const hasTeam = Array.isArray(data.data) && data.data.length > 0
        setHasReportees(hasTeam)
        
        // If user doesn't have reportees but is on team view, switch to my view
        if (!hasTeam && activeView === 'team') {
          setActiveView('my')
        }
      } catch (error) {
        setHasReportees(false)
        if (activeView === 'team') {
          setActiveView('my')
        }
      }
    }
    checkReportees()
  }, [user, isLoaded, activeView])

  const handleClockIn = async () => {
    if (!user || !timezoneReady) return
    
    try {
      setClockingIn(true)
      
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
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'clock-in',
          notes,
          location
        }),
      })
      if (response.status === 401) {
        router.replace('/auth')
        return
      }
      const data = await response.json()
      // If server enforces location and it was missing, request and retry once
      if (!response.ok && data?.code === 'LOCATION_REQUIRED') {
        try {
          const retryPermission = await requestLocationPermission({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000
          })
          if (!retryPermission.granted) {
            showLocationPermissionMessage(retryPermission.error || 'Location access is required to clock in', retryPermission.userDeclined)
            return
          }
          const retryRes = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            body: JSON.stringify({
              userId: user.id,
              action: 'clock-in',
              notes,
              location: retryPermission.location
            }),
          })
          const retryData = await retryRes.json()
          if (retryRes.ok && retryData.success) {
            setTodayAttendance(retryData.data)
            setNotes('')
            await fetchAttendanceData()
            window.dispatchEvent(new CustomEvent('attendanceUpdated', { detail: { action: 'clock-in', userId: user.id } }))
            return
          }
          alert(retryData.message || 'Failed to clock in')
          return
        } catch (retryErr) {
          console.error('Retry clock-in failed:', retryErr)
          return
        }
      }
      if (data.success) {
        setTodayAttendance(data.data)
        setNotes('')
        // Refresh data immediately and trigger real-time update
        await fetchAttendanceData()
        
        // Trigger real-time update for other components
        window.dispatchEvent(new CustomEvent('attendanceUpdated', { 
          detail: { action: 'clock-in', userId: user.id } 
        }))
      } else {
        alert(data.message || 'Failed to clock in')
      }
    } catch (error) {
      console.error('Error clocking in:', error)
      alert('Failed to clock in')
    } finally {
      setClockingIn(false)
    }
  }

  const handleClockOut = async () => {
    if (!user) return
    
    try {
      setClockingOut(true)
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'clock-out',
          notes
        }),
      })
      if (response.status === 401) {
        router.replace('/auth')
        return
      }
      const data = await response.json()
      // If server enforces location and it was missing, request and retry once
      if (!response.ok && data?.code === 'LOCATION_REQUIRED') {
        try {
          const retryPermission = await requestLocationPermission({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000
          })
          if (!retryPermission.granted) {
            showLocationPermissionMessage(retryPermission.error || 'Location access is required to clock out', retryPermission.userDeclined)
            return
          }
          const retryRes = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            body: JSON.stringify({
              userId: user.id,
              action: 'clock-out',
              notes,
              location: retryPermission.location
            }),
          })
          const retryData = await retryRes.json()
          if (retryRes.ok && retryData.success) {
            setTodayAttendance(retryData.data)
            setNotes('')
            await fetchAttendanceData()
            window.dispatchEvent(new CustomEvent('attendanceUpdated', { detail: { action: 'clock-out', userId: user.id } }))
            return
          }
          alert(retryData.message || 'Failed to clock out')
          return
        } catch (retryErr) {
          console.error('Retry clock-out failed:', retryErr)
          return
        }
      }
      if (data.success) {
        setTodayAttendance(data.data)
        setNotes('')
        // Refresh data immediately and trigger real-time update
        await fetchAttendanceData()
        
        // Trigger real-time update for other components
        window.dispatchEvent(new CustomEvent('attendanceUpdated', { 
          detail: { action: 'clock-out', userId: user.id } 
        }))
      } else {
        alert(data.message || 'Failed to clock out')
      }
    } catch (error) {
      console.error('Error clocking out:', error)
      alert('Failed to clock out')
    } finally {
      setClockingOut(false)
    }
  }




  if (!isLoaded) {
    return (
      <HRPortalLayout currentPage="attendance">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </HRPortalLayout>
    )
  }

  if (!user) {
    return (
      <HRPortalLayout currentPage="attendance">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Please sign in to access the attendance page</p>
          </div>
        </div>
      </HRPortalLayout>
    )
  }


  return (
    <RegularizationRequestManagerProvider>
      <HRPortalLayout currentPage="attendance">
        <div className="min-h-screen p-4 sm:p-6 relative">
          <div className="ambient-bg"></div>
          <div className="mesh-overlay"></div>
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8 relative z-10">
            {/* Header */}
            <div className="glass-strong p-4 sm:p-6 relative overflow-hidden group">
              {/* Modern wave pattern decoration - hidden on mobile */}
              <div className="absolute top-0 right-0 w-40 h-40 opacity-5 hidden sm:block">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full"></div>
                <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full"></div>
                <div className="absolute top-8 right-8 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full"></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                      <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="text-lg sm:text-xl font-semibold text-gray-900">
                      Attendance
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className={toggles.twoOption.container}>
                      <button
                        className={`${toggles.twoOption.button} ${
                          activeView === 'my' 
                            ? toggles.twoOption.active 
                            : toggles.twoOption.inactive
                        }`}
                        onClick={() => setActiveView('my')}
                      >
                        My Attendance
                      </button>
                      {hasReportees && (
                        <button
                          className={`${toggles.twoOption.button} ${
                            activeView === 'team' 
                              ? toggles.twoOption.active 
                              : toggles.twoOption.inactive
                          }`}
                          onClick={() => setActiveView('team')}
                        >
                          My Team
                        </button>
                      )}
                    </div>
                    
                    {/* Refresh indicator */}
                    {isRefreshing && (
                      <div className="flex items-center text-xs sm:text-sm text-gray-500 bg-white/60 backdrop-blur-sm px-2 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200/50">
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600 mr-1 sm:mr-2"></div>
                        <span className="hidden sm:inline">Refreshing...</span>
                        <span className="sm:hidden">...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
                {activeView === 'my' && (
                  <MyAttendance
                    todayAttendance={todayAttendance}
                    attendanceHistory={attendanceHistory}
                    loading={loading}
                    clockingIn={clockingIn}
                    clockingOut={clockingOut}
                    notes={notes}
                    setNotes={setNotes}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    onClockIn={handleClockIn}
                    onClockOut={handleClockOut}
                    onRefresh={fetchAttendanceData}
                    isRefreshing={isRefreshing}
                    expandedRecords={expandedRecords}
                    toggleRecordExpand={toggleRecordExpand}
                  />
                )}

                {activeView === 'team' && hasReportees && (
                  <div className="space-y-6">
                    <TeamAttendance 
                      key={`team-${teamViewMode}-${teamInitialMonth || 'default'}`}
                      initialViewMode={teamViewMode}
                      initialMonth={teamInitialMonth}
                    />
                  </div>
                )}

                {activeView === 'team' && !hasReportees && (
                  <div className="text-center py-12">
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <ClockIcon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">No Team Members</h3>
                      <p className="text-gray-600 mb-6">
                        You don&apos;t have any direct reports assigned to you. The team view will be available when you have team members to manage.
                      </p>
                      <button
                        onClick={() => setActiveView('my')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Switch to My Attendance
                      </button>
                    </div>
                  </div>
                )}
          </div>
        </div>
      </HRPortalLayout>
    </RegularizationRequestManagerProvider>
  )
}
