'use client'

import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';
import HRPortalLayout from '../../../components/hr/HRPortalLayout'
import UserProfileManagement from '../../../components/hr/UserProfileManagement'

export default function ProfilePage() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <HRPortalLayout currentPage="profile">
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
      <HRPortalLayout currentPage="profile">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">Please sign in to access the profile page</p>
          </div>
        </div>
      </HRPortalLayout>
    )
  }

  return (
    <HRPortalLayout currentPage="profile">
      <div className="min-h-screen p-4 sm:p-6 relative">
        <div className="ambient-bg"></div>
        <div className="mesh-overlay"></div>
        <div className="relative z-10">
          {/* Profile Management Component with Education */}
          <UserProfileManagement userId={user.id} />
        </div>
      </div>
    </HRPortalLayout>
  )
}
