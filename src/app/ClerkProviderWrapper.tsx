import { ClerkProvider } from '@clerk/nextjs'
import { DEV_BYPASS_ENABLED } from '@/lib/devAuth'

export default function ClerkProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_Y2xlcmsuY2xlcmsuZGV2JA=='

  // Debug logging
  console.log('🔍 ClerkProviderWrapper Debug:', {
    hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    keyPrefix: publishableKey.substring(0, 7),
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })

  // We always render ClerkProvider with the fallback dummy key so that useAuth() inside pages doesn't throw.
  // The pages will see user = null, but our devAuth bypass will provide the mock user.

  console.log('✅ ClerkProvider initializing with key:', publishableKey.substring(0, 20) + '...')

  if (DEV_BYPASS_ENABLED) {
    return <>{children}</>
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        variables: {
          colorPrimary: '#2563eb',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
