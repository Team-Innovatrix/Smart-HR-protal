/**
 * Utility functions for handling URLs and routing
 */

/**
 * Get the base URL for the current environment
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return window.location.origin
  }
  
  // Server-side: use environment variable or default
  return process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

/**
 * Get the appropriate portal URL based on the current host
 * This handles both subdomain and main domain routing
 */
export function getPortalUrl(path: string = ''): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    
    // Check if we're on the portal subdomain
    if (hostname === 'portal.inovatrix.io' || hostname.includes('portal.inovatrix')) {
      // Portal subdomain: use relative path
      return path.startsWith('/') ? path : `/${path}`
    } else {
      // Main domain: use /portal prefix
      return `/portal${path.startsWith('/') ? path : `/${path}`}`
    }
  }
  
  // Server-side: default to main domain structure
  return `/portal${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Get the appropriate auth URL based on the current host
 */
export function getAuthUrl(path: string = ''): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    
    // Check if we're on the portal subdomain
    if (hostname === 'portal.inovatrix.io' || hostname.includes('portal.inovatrix')) {
      // Portal subdomain: use relative auth path
      return `/auth${path.startsWith('/') ? path : `/${path}`}`
    } else {
      // Main domain: use /portal/auth prefix
      return `/portal/auth${path.startsWith('/') ? path : `/${path}`}`
    }
  }
  
  // Server-side: default to main domain structure
  return `/portal/auth${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Check if the current host is a subdomain
 */
export function isSubdomain(): boolean {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    return hostname === 'portal.inovatrix.io' || 
           hostname.includes('portal.inovatrix')
  }
  return false
}

/**
 * Check if the current host is the portal subdomain
 */
export function isPortalSubdomain(): boolean {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    return hostname === 'portal.inovatrix.io' || hostname.includes('portal.inovatrix')
  }
  return false
}

/**
 * Get the current subdomain type
 */
export function getSubdomainType(): 'portal' | 'main' {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    
    if (hostname === 'portal.inovatrix.io' || hostname.includes('portal.inovatrix')) {
      return 'portal'
    }
  }
  return 'main'
}

/**
 * Get the correct path for portal routes based on the current subdomain
 * @param path - The path without the /portal prefix
 * @returns The correct path for the current subdomain
 */
export function getHRPortalPath(path: string = ''): string {
  if (typeof window === 'undefined') {
    // Server-side, default to full path
    return `/portal${path ? `/${path}` : ''}`
  }
  
  const isPortalSubdomain = window.location.hostname === 'portal.inovatrix.io'
  if (isPortalSubdomain) {
    return path ? `/${path}` : '/dashboard'
  }
  
  return `/portal${path ? `/${path}` : ''}`
}


