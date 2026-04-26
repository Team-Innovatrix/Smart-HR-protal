'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Dev bypass: active when no real Clerk key is set
const DEV_BYPASS = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

import { useAuth } from '@clerk/nextjs'

function PortalRootPageWithClerk() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        router.replace('/portal/dashboard')
      } else {
        router.replace('/portal/auth/sign-in')
      }
    }
  }, [isLoaded, isSignedIn, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading HR Portal...</p>
      </div>
    </div>
  )
}

function PortalRootPageDev() {
  const router = useRouter()

  useEffect(() => {
    // Dev mode: skip auth, go straight to dashboard
    router.replace('/portal/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading HR Portal (Dev Mode)...</p>
      </div>
    </div>
  )
}

export default function PortalRootPage() {
  if (DEV_BYPASS) {
    return <PortalRootPageDev />
  }
  return <PortalRootPageWithClerk />
}
