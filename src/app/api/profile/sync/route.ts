export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createUnauthorizedResponse } from '../../../../lib/auth'
import { ProfileSyncService } from '../../../../lib/profileSyncService'
import { DEV_BYPASS_ENABLED, DEV_USER } from '../../../../lib/devAuth'

// Sync user profile from Clerk to MongoDB
export async function POST(request: NextRequest) {
  // In dev bypass mode (no Clerk key set), return a mock profile immediately
  // without touching MongoDB or Clerk — avoids 500 errors in local dev.
  if (DEV_BYPASS_ENABLED) {
    return NextResponse.json({
      success: true,
      data: {
        clerkUserId: DEV_USER.userId,
        employeeId: 'EMP001',
        firstName: DEV_USER.firstName,
        lastName: DEV_USER.lastName,
        email: DEV_USER.email,
        department: 'Executive',
        position: 'Chief Executive Officer',
        joinDate: new Date().toISOString(),
        organization: 'Innovatrix',
        leaveBalance: { sick: 0, casual: 0, annual: 0, maternity: 0, paternity: 0 },
        isActive: true,
        managerName: null,
      }
    })
  }

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
    console.error('❌ Error in profile sync API:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to sync user profile' },
      { status: 500 }
    )
  }
}
