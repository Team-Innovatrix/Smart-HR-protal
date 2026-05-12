import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
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
  '/hr',
  '/api/health',
  '/api/webhooks(.*)',
  '/portal/admin(.*)',   // Admin portal uses its own cookie auth — not Clerk
  '/api/admin/auth/(.*)', // Admin auth APIs
  '/auth(.*)',
  '/portal$',
])

// If Clerk publishable key is not configured, use a simple passthrough middleware
const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

function passthroughMiddleware(_req: NextRequest) {
  return NextResponse.next()
}

const REQUIRED_ORG_ID = process.env.REQUIRED_ORG_ID || 'org_3Ct1snEHEPxFYUqZpmQRvYFwPUa';

export default hasClerkKey
  ? clerkMiddleware(async (auth, req: NextRequest) => {
      // Public routes — always allow through, no auth check
      if (isPublicRoute(req)) {
        return NextResponse.next();
      }

      if (isProtectedRoute(req)) {
        const authObj = await auth();

        // 1. Force Sign In if not logged in
        if (!authObj.userId) {
          return authObj.redirectToSignIn();
        }

        // 2. Enforce Organization Restriction
        if (authObj.orgId !== REQUIRED_ORG_ID) {
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
