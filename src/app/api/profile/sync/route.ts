export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createUnauthorizedResponse } from '../../../../lib/auth'
import { ProfileSyncService } from '../../../../lib/profileSyncService'

// Sync user profile from Clerk to MongoDB
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    try {
      await authenticateRequest(request)
    } catch {
      return createUnauthorizedResponse('Please sign in to access this feature')
    }

    // Use the ProfileSyncService to sync the profile
    const syncResult = await ProfileSyncService.syncUserProfile()

    if (syncResult.success) {
      return NextResponse.json({
        success: true,
        message: syncResult.message,
        data: syncResult.data,
        isNew: syncResult.isNew,
      })
    } else {
      return NextResponse.json(
        { success: false, message: syncResult.message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error(' Error in profile sync API:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to sync user profile' },
      { status: 500 }
    )
  }
}
