import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Helper function to determine auth URL based on host
function getAuthUrl(host: string): string {
  const isPortalSubdomain = host === 'portal.inovatrix.io' || host.includes('portal.inovatrix')
  return isPortalSubdomain ? '/auth' : '/portal/auth'
}

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/portal/dashboard(.*)',
  '/portal/attendance(.*)',
  '/portal/leaves(.*)',
  '/portal/documents(.*)',
  '/portal/profile(.*)',
  '/portal/reports(.*)',
  '/portal/settings(.*)',
  '/portal/team(.*)',
  '/portal/user(.*)',
  '/portal/notifications(.*)',
  // Subdomain protected routes (when accessed via portal.inovatrix.io)
  '/dashboard(.*)',
  '/attendance(.*)',
  '/leaves(.*)',
  '/documents(.*)',
  '/profile(.*)',
  '/reports(.*)',
  '/settings(.*)',
  '/team(.*)',
  '/user(.*)',
  '/admin(.*)',
  '/notifications(.*)',
  // Protected API routes
  '/api/voice-commands(.*)',
  '/api/attendance(.*)',
  '/api/profile(.*)',
  '/api/settings(.*)',
])

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/services',
  '/careers',
  '/contact',
  '/blogs(.*)',
  '/case-studies',
  '/pricing',
  '/hr', // HR landing page
  '/api/health', // Health check API
  '/api/webhooks(.*)', // Webhook APIs
  // Subdomain public routes (when accessed via portal.inovatrix.io)
  '/auth(.*)', // Auth routes for subdomain
  // Portal root on subdomain should be public (it handles redirects)
  '/portal$', // This will match subdomain root only
])

// If Clerk publishable key is not configured, use a simple passthrough middleware
// to avoid MIDDLEWARE_INVOCATION_FAILED on Vercel when key is not set
const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

function passthroughMiddleware(_req: NextRequest) {
  return NextResponse.next()
}

const REQUIRED_ORG_ID = 'org_3Ct1snEHEPxFYUqZpmQRvYFwPUa';

export default hasClerkKey
  ? clerkMiddleware(async (auth, req: NextRequest) => {
      if (isProtectedRoute(req)) {
        const authObj = await auth();
        
        // 1. Force Sign In if not logged in
        if (!authObj.userId) {
          return authObj.redirectToSignIn();
        }
        
        // 2. Enforce Organization Restriction
        // If they are not actively in the organization, redirect them out
        if (authObj.orgId !== REQUIRED_ORG_ID) {
          // You could redirect to a specific "Unauthorized" page. 
          // For now, redirect to the home page.
          return NextResponse.redirect(new URL('/', req.url));
        }
      }
      return NextResponse.next();
    })
  : passthroughMiddleware

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
