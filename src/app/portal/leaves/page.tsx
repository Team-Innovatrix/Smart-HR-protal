'use client'

import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTimezone } from '../../../lib/hooks/useTimezone'
import { toggles } from '../../../lib/utils'
import HRPortalLayout from '../../../components/hr/HRPortalLayout'
import LeaveRequestForm from '../../../components/hr/LeaveRequestForm'
import LeaveCalendar from '../../../components/hr/LeaveCalendar'
import LeaveHistory from '../../../components/hr/LeaveHistory'
import TeamLeaveCalendar from '../../../components/hr/TeamLeaveCalendar'
import PendingApprovals from '../../../components/hr/PendingApprovals'
import ApprovedLeaves from '../../../components/hr/ApprovedLeaves'
import UpcomingLeave from '../../../components/hr/UpcomingLeave'
import LeaveBalanceCharts from '../../../components/hr/LeaveBalanceCharts'
import SmartRiskCalendar from '../../../components/hr/SmartRiskCalendar'
import LeaveRiskDashboard from '../../../components/hr/LeaveRiskDashboard'
import { 
  CalendarIcon, 
  ClockIcon, 
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

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

export default function LeavesPage() {
  const { user, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const { timezone, formatTime } = useTimezone()
  const [activeView, setActiveView] = useState<'my' | 'team'>('my')
  const [activeTab, setActiveTab] = useState<'calendar' | 'history' | 'ai-risk'>('calendar')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [stats, setStats] = useState<{ totalLeaveBalance: number; pendingRequests: number; approvedThisYear: number; daysRemaining: number } | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [isTeamMember, setIsTeamMember] = useState<boolean>(false)
  const [userTeams, setUserTeams] = useState<Array<{ id: string; name: string; memberCount: number }>>([])
  const [viewMode, setViewMode] = useState<'today' | 'month'>('today')
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  // Handle query parameters for auto-selecting view mode, month, and tab
  useEffect(() => {
    const view = searchParams.get('view')
    const month = searchParams.get('month')
    const tab = searchParams.get('tab')
    
    // Handle tab parameter for switching between 'my' and 'team' view
    if (tab === 'team') {
      console.log('🔄 Auto-switching to team view from query params')
      setActiveView('team')
    } else if (tab === 'my') {
      console.log('🔄 Auto-switching to my view from query params')
      setActiveView('my')
    }
    
    // Handle view mode and month for calendar display
    if (view === 'month') {
      console.log('🔄 Auto-selecting month view from query params', { month })
      setViewMode('month')
      if (month) {
        setSelectedMonth(month)
      } else {
        // Default to current month
        const currentMonth = new Date().toLocaleString('en-US', { month: 'long' })
        setSelectedMonth(currentMonth)
      }
    }
  }, [searchParams])


  const handleLeaveSubmitted = () => {
    setShowRequestForm(false)
    setRefreshTrigger(prev => prev + 1)
    // You could show a success message here
  }

  const handleViewLeaveDetails = (leave: LeaveRecord) => {
    setSelectedLeave(leave)
    setActiveTab('history')
  }

  const handleDateClick = () => {
    // Navigate to history tab and potentially filter by date
    setActiveTab('history')
    // You could implement date filtering here
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
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


  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return
      try {
        setStatsLoading(true)
        const res = await fetch(`/api/leaves/stats?userId=${user.id}`)
        const data = await res.json()
        if (data.success) {
          setStats(data.data)
        }
      } catch {
        console.error('Failed to load leave stats')
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [user?.id, refreshTrigger])

  useEffect(() => {
    const checkTeamMembership = async () => {
      try {
        const res = await fetch('/api/profile/team-membership')
        
        if (res.status === 401) {
          setIsTeamMember(false)
          return
        }
        
        const data = await res.json()
        const isMember = data.success && data.data.isTeamMember
        setIsTeamMember(isMember)
        
        // Store team data for filtering
        if (data.success && data.data.teams) {
          setUserTeams(data.data.teams)
        }
        
        // If user is not a team member but is on team view, switch to my view
        if (!isMember && activeView === 'team') {
          setActiveView('my')
        }
      } catch (error) {
        console.error('Error checking team membership:', error)
        setIsTeamMember(false)
        if (activeView === 'team') {
          setActiveView('my')
        }
      }
    }
    if (user) checkTeamMembership()
  }, [user, activeView])

  if (!isLoaded) {
    return (
      <HRPortalLayout currentPage="leaves">
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
      <HRPortalLayout currentPage="leaves">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Please sign in to access the leaves page</p>
          </div>
        </div>
      </HRPortalLayout>
    )
  }

  return (
    <HRPortalLayout currentPage="leaves">
      <div className="min-h-screen p-4 sm:p-6 relative">
        <div className="ambient-bg"></div>
        <div className="mesh-overlay"></div>
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8 relative z-10">

        {/* Leave Balance Charts */}
        <LeaveBalanceCharts userId={user.id} className="mb-8" />

        {/* Leave Request Form Modal */}
        {showRequestForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Request Leave</h3>
                    <button
                      onClick={() => setShowRequestForm(false)}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <LeaveRequestForm
                    userId={user.id}
                    onSubmit={handleLeaveSubmitted}
                    onCancel={() => setShowRequestForm(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Switcher */}
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
                  <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="text-lg sm:text-xl font-semibold text-gray-900">
                  Leave Management
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                <div className={toggles.twoOption.container}>
                  <button
                    onClick={() => setActiveView('my')}
                    className={`${toggles.twoOption.button} ${
                      activeView === 'my' 
                        ? toggles.twoOption.active 
                        : toggles.twoOption.inactive
                    }`}
                  >
                    My Leave
                  </button>
                  {isTeamMember && (
                    <button
                      onClick={() => setActiveView('team')}
                      className={`${toggles.twoOption.button} ${
                        activeView === 'team' 
                          ? toggles.twoOption.active 
                          : toggles.twoOption.inactive
                      }`}
                    >
                      Team Leave
                    </button>
                  )}
                </div>

                {/* Date Range Selector */}
                <div className="flex items-center gap-2">
                  <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as 'today' | 'month')}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="today">Today</option>
                    <option value="month">Month</option>
                  </select>
                  {viewMode === 'month' && (
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="January">January</option>
                      <option value="February">February</option>
                      <option value="March">March</option>
                      <option value="April">April</option>
                      <option value="May">May</option>
                      <option value="June">June</option>
                      <option value="July">July</option>
                      <option value="August">August</option>
                      <option value="September">September</option>
                      <option value="October">October</option>
                      <option value="November">November</option>
                      <option value="December">December</option>
                    </select>
                  )}
                </div>
                
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="flex items-center justify-center px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl text-xs sm:text-sm"
                >
                  <PlusIcon className="h-3 w-3 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  Request Leave
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-tabs for My Leave */}
        {activeView === 'my' && (
          <div className="glass-strong p-4 sm:p-6 relative overflow-hidden group">
            {/* Modern geometric pattern decoration - hidden on mobile */}
            <div className="absolute top-0 right-0 w-40 h-40 opacity-5 hidden sm:block">
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg rotate-45"></div>
              <div className="absolute top-8 right-8 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full"></div>
              <div className="absolute top-12 right-12 w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full"></div>
            </div>
            
            <div className="relative z-10">
              <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`flex items-center justify-center gap-2 sm:gap-3 py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
                    activeTab === 'calendar'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-500 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                  }`}
                >
                  <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Calendar View</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center justify-center gap-2 sm:gap-3 py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
                    activeTab === 'history'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-500 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                  }`}
                >
                  <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Leave History</span>
                </button>

                <button
                  onClick={() => setActiveTab('ai-risk')}
                  className={`flex items-center justify-center gap-2 sm:gap-3 py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
                    activeTab === 'ai-risk'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-500 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                  }`}
                >
                  <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>AI Risk Analysis</span>
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="glass-strong p-4 sm:p-8 relative overflow-hidden group">
          {/* Modern diagonal pattern decoration - hidden on mobile */}
          <div className="absolute top-0 right-0 w-40 h-40 opacity-5 hidden sm:block">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 transform rotate-12 rounded-lg"></div>
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 transform -rotate-12 rounded-lg"></div>
            <div className="absolute top-8 right-8 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 transform rotate-45 rounded-lg"></div>
          </div>
          
          <div className="relative z-10">
            {activeView === 'my' && activeTab === 'calendar' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                <div className="xl:col-span-2">
                  <LeaveCalendar
                    userId={user.id}
                    onDateClick={handleDateClick}
                  />
                </div>
                <div>
                  <UpcomingLeave onActionCompleted={() => setRefreshTrigger(prev => prev + 1)} />
                </div>
              </div>
            )}

            {activeView === 'my' && activeTab === 'history' && (
              <div>
                <LeaveHistory
                  userId={user.id}
                  onViewDetails={handleViewLeaveDetails}
                  key={refreshTrigger} // Force refresh when new leave is submitted
                />
              </div>
            )}

            {activeView === 'my' && activeTab === 'ai-risk' && (
              <div className="space-y-6">
                <SmartRiskCalendar />
                <LeaveRiskDashboard />
              </div>
            )}

            {activeView === 'team' && isTeamMember && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                  <div className="xl:col-span-2">
                    <TeamLeaveCalendar 
                      onSelectLeave={(l) => setSelectedLeave(l)} 
                      teams={userTeams}
                    />
                  </div>
                  <div className="space-y-6">
                    <PendingApprovals onActionCompleted={() => setRefreshTrigger(prev => prev + 1)} />
                    <ApprovedLeaves onActionCompleted={() => setRefreshTrigger(prev => prev + 1)} />
                  </div>
                </div>
              </div>
            )}

            {activeView === 'team' && !isTeamMember && (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <CalendarIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Not a Team Member</h3>
                  <p className="text-gray-600 mb-6">
                    You are not currently part of any teams. The team view will be available when you are added to a team.
                  </p>
                  <button
                    onClick={() => setActiveView('my')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Switch to My Leave
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leave Details Modal */}
        {selectedLeave && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Leave Details</h3>
                    <button
                      onClick={() => setSelectedLeave(null)}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Leave Type:</span>
                      <span className="text-sm text-gray-900 capitalize">{selectedLeave.leaveType}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Date Range:</span>
                      <span className="text-sm text-gray-900">
                        {formatTime(new Date(selectedLeave.startDate), 'MMM d, yyyy')} - {formatTime(new Date(selectedLeave.endDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Total Days:</span>
                      <span className="text-sm text-gray-900">{selectedLeave.totalDays} days</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedLeave.status)}`}>
                        {getStatusIcon(selectedLeave.status)}
                        <span className="ml-1">
                          {selectedLeave.status.charAt(0).toUpperCase() + selectedLeave.status.slice(1)}
                        </span>
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Applied Date:</span>
                      <span className="text-sm text-gray-900">
                        {formatTime(new Date(selectedLeave.appliedDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                    
                    {selectedLeave.reason && (
                      <div>
                        <span className="text-sm font-medium text-gray-500 block mb-2">Reason:</span>
                        <p className="text-sm text-gray-900 glass p-3 rounded-lg">
                          {selectedLeave.reason}
                        </p>
                      </div>
                    )}
                    
                    {selectedLeave.rejectionReason && (
                      <div>
                        <span className="text-sm font-medium text-gray-500 block mb-2">Rejection Reason:</span>
                        <p className="text-sm text-red-400 glass p-3 rounded-lg border border-red-500/20">
                          {selectedLeave.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </HRPortalLayout>
  )
}
