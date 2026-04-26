'use client'

import { useProfileSync } from '../../lib/hooks/useProfileSync'
import { createContext, useContext, ReactNode, useEffect } from 'react'

interface ProfileContextType {
  profile: any
  loading: boolean
  error: string | null
  syncProfile: () => Promise<void>
  refreshProfile: () => Promise<boolean>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    // Return safe defaults instead of throwing — prevents crash when
    // a component renders outside the provider tree on initial hydration.
    return {
      profile: null,
      loading: false,
      error: null,
      syncProfile: async () => {},
      refreshProfile: async () => false,
    } as ProfileContextType
  }
  return context
}

interface ProfileSyncProviderProps {
  children: ReactNode
}

export function ProfileSyncProvider({ children }: ProfileSyncProviderProps) {
  const profileData = useProfileSync()

  return (
    <ProfileContext.Provider value={profileData}>
      {children}
    </ProfileContext.Provider>
  )
}

// Component to log sync status to console (no visual display)
export function ProfileSyncStatus() {
  const { loading, error, profile } = useProfile()

  // Log status changes to console only
  useEffect(() => {
    if (loading) {
      console.log('🔄 Profile sync in progress...')
    } else if (error) {
      console.log('❌ Profile sync error:', error)
    } else if (profile) {
      console.log(`✅ Profile synced: ${profile.firstName} ${profile.lastName}`)
    }
  }, [loading, error, profile])

  // Return null - no visual display
  return null
}
