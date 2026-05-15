'use client'

import { useState, useEffect } from 'react'
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';
import { ClockIcon, HandThumbUpIcon, HandThumbDownIcon, UserIcon } from '@heroicons/react/24/outline'
import { useTimezone } from '../../lib/hooks/useTimezone'

interface TeamMember {
  clerkUserId: string
  firstName?: string
  lastName?: string
  email?: string
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

interface PendingApprovalsProps {
  onActionCompleted?: () => void
}

const PendingApprovals = ({ onActionCompleted }: PendingApprovalsProps) => {
  const { user, isLoaded } = useUser()
  const { formatDateString } = useTimezone()
  const [pending, setPending] = useState<LeaveRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)

  useEffect(() => {
    if (user && isLoaded) {
      fetchPending()
    }
  }, [user, isLoaded])

  const fetchPending = async () => {
    if (!user || !isLoaded) return
    
    try {
      setLoading(true)
      const res = await fetch('/api/leaves/direct-reports?status=pending&limit=500')
      const data = await res.json()
      if (data.success) setPending(data.data)
    } catch (e) {
      console.error('Failed to load pending approvals', e)
    } finally {
      setLoading(false)
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

  const act = async (leaveId: string, action: 'approve' | 'reject') => {
    try {
      setWorking(leaveId)
      const res = await fetch(`/api/leaves/${leaveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, approverId: user?.id || 'manager' })
      })
      const data = await res.json()
      if (data.success) {
        await fetchPending()
        onActionCompleted?.()
      }
    } catch (e) {
      console.error(`Failed to ${action} leave`, e)
    } finally {
      setWorking(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending approvals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ClockIcon className="h-6 w-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
        </div>
        <span className="text-sm text-gray-600">{pending.length} pending</span>
      </div>

      {pending.length === 0 ? (
        <div className="px-6 py-10 text-center text-gray-500">No pending leave requests from your direct reports</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {pending.map(l => (
            <li key={l._id} className="px-6 py-4 flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {(l.user?.firstName || l.user?.lastName) ? `${l.user?.firstName || ''} ${l.user?.lastName || ''}`.trim() : (l.user?.email || l.userId)}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">{l.leaveType} • {safeFormatDate(l.startDate || '', 'MMM d, yyyy')} - {safeFormatDate(l.endDate || '', 'MMM d, yyyy')} • {l.totalDays} day{l.totalDays !== 1 ? 's' : ''}</div>
                  <div className="text-xs text-gray-500 mt-1">Reason: {l.reason}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={working === l._id}
                  onClick={() => act(l._id, 'reject')}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50"
                >
                  <HandThumbDownIcon className="h-4 w-4 mr-1" /> Reject
                </button>
                <button
                  disabled={working === l._id}
                  onClick={() => act(l._id, 'approve')}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50"
                >
                  <HandThumbUpIcon className="h-4 w-4 mr-1" /> Approve
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default PendingApprovals


