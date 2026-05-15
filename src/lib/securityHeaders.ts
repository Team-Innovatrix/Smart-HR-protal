import { NextResponse } from 'next/server';

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Strict Transport Security (HTTPS only)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy for admin routes
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.inovatrix.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.clerk.dev; frame-src 'self' https://clerk.inovatrix.io;"
  );
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self "https://portal.inovatrix.io" "https://portal.inovatrix.io"), geolocation=(self "https://portal.inovatrix.io" "https://portal.inovatrix.io")');
  
  return response;
}
