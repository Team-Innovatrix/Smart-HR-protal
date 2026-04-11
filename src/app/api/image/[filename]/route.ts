import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/config'
import { getCachedImage } from '@/lib/imageCache'
import fs from 'fs'
import path from 'path'
// Note: Authentication imports removed as this endpoint serves public images

// Note: S3 client is now handled by the image cache system

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // requests per minute per IP

// Security: Validate and sanitize filename
function validateFilename(filename: string): { isValid: boolean; sanitizedFilename?: string; error?: string } {
  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return { isValid: false, error: 'Invalid filename: path traversal detected' }
  }

  // Check for null bytes
  if (filename.includes('\0')) {
    return { isValid: false, error: 'Invalid filename: null bytes detected' }
  }

  // Validate file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  const hasValidExtension = allowedExtensions.some(ext => 
    filename.toLowerCase().endsWith(ext)
  )

  if (!hasValidExtension) {
    return { isValid: false, error: 'Invalid file type: only images are allowed' }
  }

  // Sanitize filename (remove any potentially dangerous characters)
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '')
  
  if (sanitizedFilename.length === 0) {
    return { isValid: false, error: 'Invalid filename: no valid characters' }
  }

  return { isValid: true, sanitizedFilename }
}

// Rate limiting function
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  userLimit.count++
  return true
}

// Security: Validate origin
function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  const allowedDomains = [
    'localhost:3000',
    'portal.inovatrix.io',
    'www.portal.inovatrix.io',
    'inovatrix.io',
    'www.inovatrix.io',
    '.vercel.app',
    '.vercel.dev'
  ]

  // Check origin header
  if (origin) {
    const isAllowedOrigin = allowedDomains.some(domain => 
      origin.includes(domain) || origin.endsWith(domain)
    )
    if (isAllowedOrigin) return true
  }

  // Check referer header as fallback
  if (referer) {
    const isAllowedReferer = allowedDomains.some(domain => 
      referer.includes(domain) || referer.endsWith(domain)
    )
    if (isAllowedReferer) return true
  }

  return false
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const startTime = Date.now()
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'

  try {
    // Rate limiting
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`)
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Check if AWS S3 is configured (bypass in local mode)
    const isLocalMode = process.env.USE_LOCAL_MEM_DB === 'true' || env.AWS_ACCESS_KEY_ID === 'AKIARCBQR3FZLSKFJLGK';
    
    if (!isLocalMode && (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_REGION || !env.AWS_S3_BUCKET)) {
      console.error('❌ [API] AWS S3 configuration missing');
      return NextResponse.json(
        { error: 'Image service not configured' },
        { status: 503 }
      )
    }

    // Get and validate filename
    const { filename } = await params
    const filenameValidation = validateFilename(filename)
    
    if (!filenameValidation.isValid) {
      console.warn(`Invalid filename attempt: ${filename} from IP: ${clientIP}`)
      return NextResponse.json(
        { error: filenameValidation.error },
        { status: 400 }
      )
    }

    // Attempt to serve from local directory first if in local mode
    if (isLocalMode) {
      const localImagePath = path.join(process.cwd(), 'public', 'uploads', filename);
      
      if (fs.existsSync(localImagePath)) {
        const buffer = fs.readFileSync(localImagePath);
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'image/jpeg';
        if (ext === '.png') contentType = 'image/png';
        if (ext === '.webp') contentType = 'image/webp';
        if (ext === '.gif') contentType = 'image/gif';
        
        const response = new NextResponse(buffer as BodyInit, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=86400',
          },
        });
        return response;
      }
    }

    // Security: Validate origin (optional for public images, but good practice)
    if (!validateOrigin(request)) {
      console.warn(`Unauthorized origin attempt: ${request.headers.get('origin')} from IP: ${clientIP}`)
      // Note: We're not blocking here for public images, but logging for security monitoring
    }

    // Try to get image from cache or download from S3
    console.log(`🔍 [API] Attempting to get image: ${filename} from IP: ${clientIP}`)
    console.log(`🔍 [API] Environment check - NODE_ENV: ${env.NODE_ENV}, Bucket: ${env.AWS_S3_BUCKET}`)
    
    const imageData = await getCachedImage(filename)

    if (!imageData) {
      console.warn(`❌ [API] Image not found: ${filename} from IP: ${clientIP}`)
      console.warn(`❌ [API] This means either: 1) Image doesn't exist in S3, 2) S3 access denied, 3) Path mismatch`)
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }
    
    console.log(`✅ [API] Image found: ${filename} (${imageData.buffer.length} bytes, ${imageData.contentType}) from IP: ${clientIP}`)
    
    // Debug buffer content for troubleshooting
    console.log(`🔍 [DEBUG] First 20 bytes of buffer:`, Array.from(imageData.buffer.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '))
    console.log(`🔍 [DEBUG] PNG signature check:`, imageData.buffer.slice(0, 8).toString('hex'))
    console.log(`🔍 [DEBUG] Buffer length: ${imageData.buffer.length} bytes`)
    console.log(`🔍 [DEBUG] Content-Type: ${imageData.contentType}`)

    // Log successful access for monitoring
    const processingTime = Date.now() - startTime
    const cacheStatus = imageData.fromCache ? 'cache' : 'S3'
    console.log(`Image served from ${cacheStatus}: ${filename} to IP: ${clientIP} in ${processingTime}ms`)

    // Create response with image data
    const response = new NextResponse(imageData.buffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': imageData.contentType,
        'Content-Length': imageData.buffer.length.toString(),
      },
    })
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Add cache headers for performance (longer cache since we're serving from memory)
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400') // 24 hours
    response.headers.set('Expires', new Date(Date.now() + 86400000).toUTCString()) // 24 hours
    response.headers.set('ETag', `"${filename}-${imageData.buffer.length}"`)

    return response

  } catch (error: unknown) {
    const processingTime = Date.now() - startTime
    const { filename: errorFilename } = await params
    console.error(`Image serving error for ${errorFilename} from IP: ${clientIP} in ${processingTime}ms:`, error)

    // Handle specific AWS errors
    if ((error as any)?.name === 'NoSuchBucket') {
      return NextResponse.json(
        { error: 'Storage service unavailable' },
        { status: 503 }
      )
    }
    
    if ((error as any)?.name === 'AccessDenied') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    if ((error as any)?.name === 'InvalidAccessKeyId' || (error as any)?.name === 'SignatureDoesNotMatch') {
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 503 }
      )
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
