/**
 * In-Memory Image Cache System
 * 
 * This module provides a session-based image caching system that:
 * 1. Downloads images from S3 on first request
 * 2. Stores them in memory for fast access
 * 3. Serves images directly from cache to avoid repeated S3 calls
 * 4. Automatically cleans up expired cache entries
 */

import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { env } from './config'

// Initialize S3 client
const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
  },
})

// Log S3 client configuration
console.log(`🔧 [imageCache] S3 Client initialized with:`, {
  region: env.AWS_REGION,
  bucket: env.AWS_S3_BUCKET,
  accessKeyId: env.AWS_ACCESS_KEY_ID ? 'SET' : 'MISSING',
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'MISSING'
})

// Cache entry interface
interface CacheEntry {
  buffer: Buffer
  contentType: string
  lastAccessed: number
  size: number
}

// In-memory cache store
const imageCache = new Map<string, CacheEntry>()

// Cache configuration
const CACHE_CONFIG = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB total cache size
  MAX_AGE: 60 * 60 * 1000, // 1 hour cache age
  CLEANUP_INTERVAL: 10 * 60 * 1000, // Cleanup every 10 minutes
  MAX_ENTRIES: 1000, // Maximum number of cached images
}

// Track total cache size
let totalCacheSize = 0

/**
 * Clean up expired and oversized cache entries
 */
function cleanupCache(): void {
  const now = Date.now()
  const entriesToDelete: string[] = []
  
  // Find expired entries
  for (const [key, entry] of imageCache.entries()) {
    if (now - entry.lastAccessed > CACHE_CONFIG.MAX_AGE) {
      entriesToDelete.push(key)
    }
  }
  
  // Remove expired entries
  entriesToDelete.forEach(key => {
    const entry = imageCache.get(key)
    if (entry) {
      totalCacheSize -= entry.size
      imageCache.delete(key)
    }
  })
  
  // If still over size limit, remove oldest entries
  if (totalCacheSize > CACHE_CONFIG.MAX_SIZE || imageCache.size > CACHE_CONFIG.MAX_ENTRIES) {
    const sortedEntries = Array.from(imageCache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
    
    const entriesToRemove = Math.max(
      Math.ceil(imageCache.size * 0.2), // Remove 20% of entries
      imageCache.size - CACHE_CONFIG.MAX_ENTRIES
    )
    
    for (let i = 0; i < entriesToRemove && i < sortedEntries.length; i++) {
      const [key, entry] = sortedEntries[i]
      totalCacheSize -= entry.size
      imageCache.delete(key)
    }
  }
  
  console.log(`Cache cleanup completed. Entries: ${imageCache.size}, Size: ${(totalCacheSize / 1024 / 1024).toFixed(2)}MB`)
}

// Set up periodic cleanup - DISABLED per user request
// setInterval(cleanupCache, CACHE_CONFIG.CLEANUP_INTERVAL)

/**
 * Generate possible S3 keys for an image filename
 */
function generatePossibleKeys(filename: string): string[] {
  console.log(`🔍 [generatePossibleKeys] Processing filename: ${filename}`)
  
  const keys = [
    filename, // Full path from upload (most likely to be correct)
  ]
  
  // For profile photos (consistent filename: profile.{ext})
  if (filename === 'profile.jpg' || filename === 'profile.png' || filename === 'profile.webp' || filename === 'profile.jpeg') {
    console.log(`📸 [generatePossibleKeys] Detected profile photo: ${filename}`)
    keys.push(`profile-images/user_*/${filename}`)
  } 
  // For company logos (consistent filename: logo.{ext})
  else if (filename === 'logo.jpg' || filename === 'logo.png' || filename === 'logo.webp' || filename === 'logo.jpeg') {
    console.log(`🏢 [generatePossibleKeys] Detected company logo: ${filename}`)
    keys.push(`company-logos/${filename}`)
  }
  // For legacy timestamped files (backward compatibility)
  else if (filename.includes('-') && /^\d+-/.test(filename)) {
    console.log(`🕰️ [generatePossibleKeys] Detected legacy timestamped file: ${filename}`)
    keys.push(`company-logos/${filename}`)
    keys.push(`profile-images/user_*/${filename}`)
  }
  // For other files, try standard locations
  else {
    console.log(`❓ [generatePossibleKeys] Unknown file type, trying standard locations: ${filename}`)
    keys.push(`profile-images/${filename}`)
    keys.push(`company-logos/${filename}`)
  }
  
  console.log(`🔑 [generatePossibleKeys] Generated keys for ${filename}:`, keys)
  return keys
}

/**
 * Search for image in user-specific folders and company logos
 */
async function searchForImageInUserFolders(filename: string): Promise<string | null> {
  console.log(`🔍 [searchForImageInUserFolders] Starting search for: ${filename}`)
  const searchPrefixes = ['profile-images/', 'company-logos/']
  
  for (const prefix of searchPrefixes) {
    console.log(`📁 [searchForImageInUserFolders] Searching in prefix: ${prefix}`)
    try {
      const command = new ListObjectsV2Command({
        Bucket: env.AWS_S3_BUCKET,
        Prefix: prefix,
        MaxKeys: 1000
      })
      
      console.log(`📡 [searchForImageInUserFolders] Sending ListObjectsV2Command for prefix: ${prefix}`)
      const response = await s3Client.send(command)
      
      if (response.Contents) {
        console.log(`📋 [searchForImageInUserFolders] Found ${response.Contents.length} objects in ${prefix}`)
        for (const obj of response.Contents) {
          console.log(`🔍 [searchForImageInUserFolders] Checking object: ${obj.Key}`)
          if (obj.Key && (obj.Key.endsWith(`/${filename}`) || obj.Key === `${prefix}${filename}`)) {
            console.log(`✅ [searchForImageInUserFolders] Found image in ${prefix} folder: ${obj.Key}`)
            return obj.Key
          }
        }
      } else {
        console.log(`📭 [searchForImageInUserFolders] No objects found in ${prefix}`)
      }
    } catch (error) {
      console.error(`❌ [searchForImageInUserFolders] Error searching for image in ${prefix} folders:`, error)
    }
  }
  
  console.log(`❌ [searchForImageInUserFolders] No image found for: ${filename}`)
  return null
}

/**
 * Download image from S3 and cache it
 */
async function downloadAndCacheImage(filename: string): Promise<CacheEntry | null> {
  console.log(`⬇️ [downloadAndCacheImage] Starting download for: ${filename}`)
  const possibleKeys = generatePossibleKeys(filename)
  
  // First try the standard possible keys
  for (const key of possibleKeys) {
    console.log(`🔑 [downloadAndCacheImage] Trying key: ${key}`)
    try {
      console.log(`📡 [downloadAndCacheImage] Sending GetObjectCommand for key: ${key} in bucket: ${env.AWS_S3_BUCKET}`)
      
      const command = new GetObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
      })
      
      const response = await s3Client.send(command)
      
      if (response.Body) {
        console.log(`📦 [downloadAndCacheImage] Got response body for key: ${key}`)
        // Convert stream to buffer
        const chunks: Uint8Array[] = []
        const stream = response.Body as any
        
        for await (const chunk of stream) {
          chunks.push(chunk)
        }
        
        const buffer = Buffer.concat(chunks)
        const contentType = response.ContentType || 'image/jpeg'
        
        // Debug: Log buffer info for troubleshooting
        console.log(`🔍 [downloadAndCacheImage] Buffer created: ${buffer.length} bytes, Content-Type: ${contentType}`)
        console.log(`🔍 [downloadAndCacheImage] First 8 bytes:`, buffer.slice(0, 8).toString('hex'))
        
        const cacheEntry: CacheEntry = {
          buffer,
          contentType,
          lastAccessed: Date.now(),
          size: buffer.length,
        }
        
        // Check if adding this entry would exceed cache limits
        if (totalCacheSize + buffer.length > CACHE_CONFIG.MAX_SIZE) {
          cleanupCache()
        }
        
        // Add to cache using the original filename as the key (not the S3 key)
        // This ensures that future requests for "logo.png" will find the cached image
        imageCache.set(filename, cacheEntry)
        totalCacheSize += buffer.length
        
        console.log(`✅ [downloadAndCacheImage] Image cached successfully: ${filename} (${(buffer.length / 1024).toFixed(2)}KB) from S3 key: ${key}`)
        return cacheEntry
      }
    } catch (error: any) {
      if (error.name !== 'NoSuchKey' && error.name !== 'NotFound') {
        console.error(`❌ [downloadAndCacheImage] Error downloading image ${key}:`, error)
      } else {
        console.log(`🔍 [downloadAndCacheImage] Key not found: ${key} (${error.name})`)
      }
      // Continue to next possible key
    }
  }
  
  // If not found in standard locations, search in user folders
  console.log(`Searching for image in user folders: ${filename}`)
  const userFolderKey = await searchForImageInUserFolders(filename)
  
  if (userFolderKey) {
    try {
      const command = new GetObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: userFolderKey,
      })
      
      const response = await s3Client.send(command)
      
      if (response.Body) {
        // Convert stream to buffer
        const chunks: Uint8Array[] = []
        const stream = response.Body as any
        
        for await (const chunk of stream) {
          chunks.push(chunk)
        }
        
        const buffer = Buffer.concat(chunks)
        const contentType = response.ContentType || 'image/jpeg'
        
        const cacheEntry: CacheEntry = {
          buffer,
          contentType,
          lastAccessed: Date.now(),
          size: buffer.length,
        }
        
        // Check if adding this entry would exceed cache limits
        if (totalCacheSize + buffer.length > CACHE_CONFIG.MAX_SIZE) {
          cleanupCache()
        }
        
        // Add to cache
        imageCache.set(filename, cacheEntry)
        totalCacheSize += buffer.length
        
        console.log(`✅ Image cached successfully from user folder: ${filename} (${(buffer.length / 1024).toFixed(2)}KB)`)
        return cacheEntry
      }
    } catch (error: any) {
      console.error(`Error downloading image from user folder ${userFolderKey}:`, error)
    }
  }
  
  console.warn(`❌ Image not found in S3: ${filename}`)
  return null
}

/**
 * Get image from cache or download from S3
 */
export async function getCachedImage(filename: string): Promise<{
  buffer: Buffer
  contentType: string
  fromCache: boolean
} | null> {
  console.log(`🔍 [getCachedImage] Starting request for: ${filename}`)
  
  // Check cache first - try both filename and possible S3 paths
  const possibleCacheKeys = [filename]
  
  // For company logos, also check the S3 path
  if (filename === 'logo.jpg' || filename === 'logo.png' || filename === 'logo.webp' || filename === 'logo.jpeg') {
    possibleCacheKeys.push(`company-logos/${filename}`)
  }
  
  // For profile photos, also check the S3 path
  if (filename === 'profile.jpg' || filename === 'profile.png' || filename === 'profile.webp' || filename === 'profile.jpeg') {
    possibleCacheKeys.push(`profile-images/user_*/${filename}`)
  }
  
  // Check all possible cache keys
  for (const cacheKey of possibleCacheKeys) {
    const cachedEntry = imageCache.get(cacheKey)
    if (cachedEntry) {
      // Update last accessed time
      cachedEntry.lastAccessed = Date.now()
      console.log(`📦 [getCachedImage] Image served from cache: ${filename} (key: ${cacheKey})`)
      return {
        buffer: cachedEntry.buffer,
        contentType: cachedEntry.contentType,
        fromCache: true,
      }
    }
  }
  
  // Download from S3 and cache
  console.log(`⬇️ [getCachedImage] Downloading image from S3: ${filename}`)
  console.log(`⬇️ [getCachedImage] Will try these possible S3 keys:`, generatePossibleKeys(filename))
  const entry = await downloadAndCacheImage(filename)
  
  if (entry) {
    console.log(`✅ [getCachedImage] Successfully retrieved image: ${filename}`)
    return {
      buffer: entry.buffer,
      contentType: entry.contentType,
      fromCache: false,
    }
  }
  
  console.log(`❌ [getCachedImage] Failed to retrieve image: ${filename}`)
  return null
}

/**
 * Preload images into cache (useful for batch operations)
 */
export async function preloadImages(filenames: string[]): Promise<void> {
  console.log(`🔄 Preloading ${filenames.length} images into cache...`)
  
  const promises = filenames.map(async (filename) => {
    try {
      await getCachedImage(filename)
    } catch (error) {
      console.error(`Failed to preload image ${filename}:`, error)
    }
  })
  
  await Promise.allSettled(promises)
  console.log(`✅ Preloading completed`)
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  entries: number
  totalSize: string
  totalSizeBytes: number
  hitRate?: number
} {
  return {
    entries: imageCache.size,
    totalSize: `${(totalCacheSize / 1024 / 1024).toFixed(2)}MB`,
    totalSizeBytes: totalCacheSize,
  }
}

/**
 * Clear cache (useful for testing or memory management)
 */
export function clearCache(): void {
  imageCache.clear()
  totalCacheSize = 0
  console.log('🗑️ Image cache cleared')
}

/**
 * Remove specific image from cache
 */
export function removeFromCache(filename: string): boolean {
  const entry = imageCache.get(filename)
  if (entry) {
    totalCacheSize -= entry.size
    imageCache.delete(filename)
    console.log(`🗑️ Removed ${filename} from cache`)
    return true
  }
  return false
}
