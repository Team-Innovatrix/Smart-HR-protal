'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

export default function PortalRootPage() {
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
        <p className="text-gray-600">Loading Innovatrix Portal...</p>
      </div>
    </div>
  )
}
