import { useDevSafeUser } from './useDevSafeClerk'
import { useState, useEffect, useCallback, useRef } from 'react'

interface ProfileData {
  clerkUserId: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  department: string
  position: string
  joinDate: string
  organization?: string
  contactNumber?: string
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
  }
  address?: string
  leaveBalance: {
    sick: number
    casual: number
    annual: number
    maternity: number
    paternity: number
  }
  isActive: boolean
  managerId?: string
}

interface UseProfileSyncReturn {
  profile: ProfileData | null
  loading: boolean
  error: string | null
  syncProfile: () => Promise<void>
  refreshProfile: () => Promise<boolean>
  retry: () => Promise<void>
}

// Production-ready configuration
const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  AUTH_TIMEOUT: 2000,
  DEBOUNCE_DELAY: 300,
} as const

// Custom error types for better error handling
class ProfileSyncError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'ProfileSyncError'
  }
}

export function useProfileSync(): UseProfileSyncReturn {
  const { user, isLoaded, isSignedIn } = useDevSafeUser()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Refs for production-ready features
  const retryCountRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastSyncTimeRef = useRef<number>(0)
  const isMountedRef = useRef(true)
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current)
      }
    }
  }, [])

  // Production-ready API call with retry logic
  const makeApiCall = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> => {
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new ProfileSyncError(
          'Invalid response format: expected JSON',
          'INVALID_RESPONSE_FORMAT',
          response.status,
          false
        )
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ProfileSyncError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          'HTTP_ERROR',
          response.status,
          response.status >= 500 || response.status === 429 // Retry on server errors or rate limits
        )
      }

      return response
    } catch (error) {
      if (error instanceof ProfileSyncError) {
        throw error
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProfileSyncError('Request cancelled', 'ABORTED', undefined, false)
      }

      throw new ProfileSyncError(
        error instanceof Error ? error.message : 'Network error',
        'NETWORK_ERROR',
        undefined,
        true
      )
    }
  }, [])

  // Retry logic with exponential backoff
  const retryWithBackoff = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = CONFIG.MAX_RETRIES
  ): Promise<T> => {
    try {
      return await operation()
    } catch (error) {
      if (retryCountRef.current >= maxRetries || !(error instanceof ProfileSyncError) || !error.retryable) {
        throw error
      }

      retryCountRef.current++
      const delay = CONFIG.RETRY_DELAY * Math.pow(2, retryCountRef.current - 1)
      
      await new Promise(resolve => setTimeout(resolve, delay))
      return retryWithBackoff(operation, maxRetries)
    }
  }, [])

  // Wait for authentication to be fully established
  const waitForAuth = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (isLoaded && isSignedIn) {
        resolve(true)
        return
      }

      // Wait for authentication with timeout
      const checkAuth = () => {
        if (isLoaded && isSignedIn) {
          resolve(true)
        } else if (isLoaded && !isSignedIn) {
          resolve(false)
        } else {
          // Still loading, check again
          authTimeoutRef.current = setTimeout(checkAuth, 100)
        }
      }

      authTimeoutRef.current = setTimeout(checkAuth, 100)
    })
  }, [isLoaded, isSignedIn])

  const syncProfile = useCallback(async () => {
    if (!user || !isLoaded || !isSignedIn) return

    // Prevent rapid successive calls
    const now = Date.now()
    if (now - lastSyncTimeRef.current < CONFIG.DEBOUNCE_DELAY) {
      return
    }
    lastSyncTimeRef.current = now

    try {
      setLoading(true)
      setError(null)
      retryCountRef.current = 0

      const response = await retryWithBackoff(() => 
        makeApiCall('/api/profile/sync', { method: 'POST' })
      )

      const data = await response.json()

      if (data.success && isMountedRef.current) {
        setProfile(data.data)
        // Production logging - only in development
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Profile synced successfully from Clerk')
        }
      } else {
        throw new ProfileSyncError(
          data.message || 'Failed to sync profile',
          'SYNC_FAILED',
          undefined,
          false
        )
      }
    } catch (err) {
      if (!isMountedRef.current) return

      const errorMessage = err instanceof ProfileSyncError 
        ? err.message 
        : 'Failed to sync profile'
      
      setError(errorMessage)
      
      // Production logging - only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error syncing profile:', err)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [user, isLoaded, isSignedIn, makeApiCall, retryWithBackoff])

  const refreshProfile = useCallback(async (): Promise<boolean> => {
    if (!user || !isLoaded || !isSignedIn) return false

    try {
      setLoading(true)
      setError(null)
      retryCountRef.current = 0

      const response = await retryWithBackoff(() => 
        makeApiCall(`/api/profile?userId=${user.id}`)
      )

      const data = await response.json()

      if (data.success && isMountedRef.current) {
        setProfile(data.data)
        // Production logging - only in development
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Profile refreshed successfully')
        }
        return true
      } else {
        throw new ProfileSyncError(
          data.message || 'Failed to refresh profile',
          'REFRESH_FAILED',
          undefined,
          false
        )
      }
    } catch (err) {
      if (!isMountedRef.current) return false

      const errorMessage = err instanceof ProfileSyncError 
        ? err.message 
        : 'Failed to refresh profile'
      
      setError(errorMessage)
      
      // Production logging - only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error refreshing profile:', err)
      }
      return false
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [user, isLoaded, isSignedIn, makeApiCall, retryWithBackoff])

  // Retry function for manual retry
  const retry = useCallback(async () => {
    if (error) {
      setError(null)
      await syncProfile()
    }
  }, [error, syncProfile])

  // Auto-sync profile when user loads with proper authentication waiting
  useEffect(() => {
    if (isLoaded && user && isSignedIn) {
      // Wait for authentication to be fully established
      waitForAuth().then((isAuthenticated) => {
        if (isAuthenticated && isMountedRef.current) {
          // Always sync from Clerk to ensure roles, names, and organization are up to date
          syncProfile()
        }
      })
    } else if (isLoaded && !isSignedIn) {
      // User is not signed in, reset loading state
      setLoading(false)
      setProfile(null)
      setError(null)
    }
  }, [isLoaded, user, isSignedIn, refreshProfile, syncProfile, waitForAuth])

  // Auto-sync profile after successful authentication
  useEffect(() => {
    if (isLoaded && user && isSignedIn) {
      // Wait for authentication to be fully established
      waitForAuth().then((isAuthenticated) => {
        if (isAuthenticated && isMountedRef.current && !profile) {
          syncProfile()
        }
      })
    }
  }, [isLoaded, user, isSignedIn, syncProfile, profile, waitForAuth])

  return {
    profile,
    loading,
    error,
    syncProfile,
    refreshProfile,
    retry,
  }
}
