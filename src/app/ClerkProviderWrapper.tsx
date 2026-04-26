import { ClerkProvider } from '@clerk/nextjs'

export default function ClerkProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    // This should never happen in production if env vars are set correctly.
    // Render children anyway so the app doesn't hard-crash — Clerk components
    // will simply show an "invalid key" warning instead of a full crash.
    console.warn('[ClerkProviderWrapper] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set.')
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey || ''}
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
