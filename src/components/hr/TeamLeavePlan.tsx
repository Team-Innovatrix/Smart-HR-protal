'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { CalendarIcon, UsersIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useTimezone } from '../../lib/hooks/useTimezone'

interface TeamMember {
  clerkUserId: string
  firstName?: string
  lastName?: string
  email?: string
  department?: string
  position?: string
}

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
  user?: TeamMember | null
}

interface TeamLeavePlanProps {
  onSelectLeave?: (leave: LeaveRecord) => void
}

const TeamLeavePlan = ({ onSelectLeave }: TeamLeavePlanProps) => {
  const { formatDateString, timezone, getTodayDateString, getToday } = useTimezone()
  const [currentDate, setCurrentDate] = useState(() => getToday())
  const [leaves, setLeaves] = useState<LeaveRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'approved' | 'pending' | 'all'>('all')

  const fetchTeamLeaves = useCallback(async () => {
    try {
      setLoading(true)
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const startDate = getTodayDateString()
      const endDate = getTodayDateString()
      const statusQuery = statusFilter === 'all' ? '' : `&status=${statusFilter}`
      const res = await fetch(`/api/leaves/direct-reports?startDate=${startDate}&endDate=${endDate}${statusQuery}`)
      const data = await res.json()
      if (data.success) {
        setLeaves(data.data)
      }
    } catch (e) {
      console.error('Failed to load team leaves', e)
    } finally {
      setLoading(false)
    }
  }, [currentDate, statusFilter])

  useEffect(() => {
    fetchTeamLeaves()
  }, [currentDate, statusFilter, fetchTeamLeaves])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return d
    })
  }



  const teamByUser = useMemo(() => {
    const map = new Map<string, { member: TeamMember | null, leaves: LeaveRecord[] }>()
    for (const l of leaves) {
      const key = l.userId
      if (!map.has(key)) map.set(key, { member: l.user || null, leaves: [] })
      map.get(key)!.leaves.push(l)
    }
    return Array.from(map.values())
  }, [leaves])

  const getLeaveColor = (type: string) => {
    switch (type) {
      case 'sick': return 'bg-red-500'
      case 'casual': return 'bg-blue-500'
      case 'annual': return 'bg-green-500'
      case 'maternity': return 'bg-pink-500'
      case 'paternity': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getLeaveStyle = (leave: LeaveRecord) => {
    const baseColor = getLeaveColor(leave.leaveType)
    if (leave.status === 'approved') {
      // Solid color for approved leaves
      return `${baseColor} opacity-100`
    } else if (leave.status === 'pending') {
      // Transparent color for pending leaves
      return `${baseColor} opacity-60`
    } else {
      // Other statuses (rejected, cancelled) - very transparent
      return `${baseColor} opacity-30`
    }
  }

  const safeFormatDate = (dateString: string, format: string) => {
    if (!dateString || dateString === 'Invalid Date') {
      return 'Invalid Date'
    }
    try {
      return formatDateString(dateString, format)
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'Invalid Date'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team leave plan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">TeamLeave Plan</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg w-full sm:w-auto"
            >
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>

            <div className="flex items-center space-x-2">
              <button onClick={() => navigateMonth('prev')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <span className="text-sm sm:text-lg font-medium text-gray-900 min-w-[120px] sm:min-w-[200px] text-center">
                {(() => {
                  try {
                    return formatDateString(getTodayDateString(), 'MMMM yyyy')
                  } catch (error) {
                    console.error('Error formatting month name:', error)
                    return 'Invalid Date'
                  }
                })()}
              </span>
              <button onClick={() => navigateMonth('next')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 overflow-x-auto">
        {teamByUser.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No direct reports with leaves in this period</p>
            <p className="text-sm text-gray-400">Only your direct reports are shown</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direct Report</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leaves</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamByUser.map(({ member, leaves }) => (
                <tr key={member?.clerkUserId || Math.random()} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(member?.firstName || member?.lastName) ? `${member?.firstName || ''} ${member?.lastName || ''}`.trim() : (member?.email || 'Unknown')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member?.department || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member?.position || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-wrap gap-2">
                      {leaves.map(l => (
                        <button
                          key={l._id}
                          onClick={() => onSelectLeave?.(l)}
                          className={`text-xs text-white px-2 py-1 rounded ${getLeaveStyle(l)}`}
                          title={`${safeFormatDate(l.startDate || '', 'MMM d, yyyy')} - ${safeFormatDate(l.endDate || '', 'MMM d, yyyy')} (${l.totalDays}d) - ${l.status}`}
                        >
                          {l.leaveType} • {l.status}
                        </button>
                      ))}
                    </div>
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

export default TeamLeavePlan


