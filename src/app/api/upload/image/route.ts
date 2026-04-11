export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'
import path from 'path'
import { authenticateRequest, createUnauthorizedResponse } from '../../../../lib/auth'
import { env } from '../../../../lib/config'

// Initialize S3 client
const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
  },
})

// Generate unique filename based on image type
function generateUniqueFilename(originalName: string, userId: string, imageType: string = 'profile'): string {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  
  // Determine folder structure based on image type
  switch (imageType.toLowerCase()) {
    case 'company-logo':
    case 'logo':
      // For company logos, use a consistent filename: logo.{ext}
      // This ensures only one company logo
      return `company-logos/logo.${extension}`
    case 'profile':
    case 'avatar':
    case 'user':
    default:
      // For profile photos, use a consistent filename: profile.{ext}
      // This ensures only one profile photo per user
      return `profile-images/${userId}/profile.${extension}`
  }
}

// Validate file type
function isValidImageType(mimeType: string): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  return allowedTypes.includes(mimeType)
}

// Validate file size (5MB max)
function isValidFileSize(size: number): boolean {
  const maxSize = 5 * 1024 * 1024 // 5MB
  return size <= maxSize
}

// Delete existing image for a user (only one exists)
async function deleteExistingImage(userId: string, extension: string, imageType: string): Promise<void> {
  try {
    let key: string
    
    if (imageType === 'company-logo' || imageType === 'logo') {
      // Delete existing company logo
      const filename = `logo.${extension}`
      key = `company-logos/${filename}`
    } else {
      // Delete existing profile photo
      const filename = `profile.${extension}`
      key = `profile-images/${userId}/${filename}`
    }
    
    const deleteCommand = new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key
    })
    
    await s3Client.send(deleteCommand)
    console.log(`Deleted existing ${imageType} for user ${userId}`)
  } catch (error: any) {
    // If file doesn't exist, that's fine - continue with upload
    if (error.name !== 'NoSuchKey' && error.name !== 'NotFound') {
      console.error(`Error deleting existing ${imageType}:`, error)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    let authenticatedUser
    try {
      authenticatedUser = await authenticateRequest(request)
    } catch {
      return createUnauthorizedResponse('Please sign in to upload images')
    }

    // Check if AWS S3 is configured (only if not strictly in local mode)
    const isLocalMode = process.env.USE_LOCAL_MEM_DB === 'true' || env.AWS_ACCESS_KEY_ID === 'AKIARCBQR3FZLSKFJLGK'
    if (!isLocalMode && (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_REGION || !env.AWS_S3_BUCKET)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Image upload service is not configured'
        },
        { status: 500 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('image') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: 'No image file provided'
        },
        { status: 400 }
      )
    }

    // Validate file type
    if (!isValidImageType(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        {
          success: false,
          message: 'File size too large. Please upload an image smaller than 5MB.'
        },
        { status: 400 }
      )
    }

    // Generate unique filename based on image type
    const filename = generateUniqueFilename(file.name, authenticatedUser.userId, type)

    // Delete existing image first to ensure only one exists (bypass if local mode)
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    if (!isLocalMode) {
      await deleteExistingImage(authenticatedUser.userId, extension, type || 'profile')
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    const filenameOnly = filename.split('/').pop() || filename

    if (isLocalMode) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      const fullPath = path.join(uploadDir, filenameOnly);
      
      if (!fs.existsSync(uploadDir)) {
         fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, buffer);
      
      const localImageUrl = `/uploads/${filenameOnly}`;
      
      return NextResponse.json({
        success: true,
        message: 'Image uploaded successfully (Local Mode)',
        data: {
          imageUrl: localImageUrl,
          filename: filenameOnly,
          fullPath: filename,
          size: file.size,
          type: file.type,
          etag: 'local-etag-' + Date.now(),
        }
      });
    }

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        'uploaded-by': authenticatedUser.userId,
        'upload-type': type || 'profile',
        'original-name': file.name,
        'upload-timestamp': new Date().toISOString(),
      },
    })

    const uploadResult = await s3Client.send(uploadCommand)

    // Return the secure image URL that goes through our API
    const secureImageUrl = `/api/image/${filenameOnly}`

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: secureImageUrl,
        filename: filenameOnly,
        fullPath: filename,
        size: file.size,
        type: file.type,
        etag: uploadResult.ETag,
      }
    })

  } catch (error) {
    console.error('Image upload error:', error)
    
    // Handle specific AWS errors
    if (error instanceof Error) {
      if (error.name === 'NoSuchBucket') {
        return NextResponse.json(
          {
            success: false,
            message: 'Storage bucket not found. Please contact support.'
          },
          { status: 500 }
        )
      }
      
      if (error.name === 'AccessDenied') {
        return NextResponse.json(
          {
            success: false,
            message: 'Access denied. Please contact support.'
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to upload image. Please try again.'
      },
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
