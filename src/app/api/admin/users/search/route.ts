import { NextRequest, NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import connectDB from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';

export async function GET(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // Connect to database
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const excludeId = searchParams.get('excludeId') || '';

    // Build query
    const query: Record<string, unknown> = { isActive: true };
    
    // Exclude the current user being edited
    if (excludeId) {
      // Exclude by either Mongo _id or Clerk user ID
      query.$and = [
        {
          $or: [
            { _id: { $ne: excludeId } },
            { clerkUserId: { $ne: excludeId } }
          ]
        }
      ];
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users with search results
    const users = await UserProfile.find(query)
      .select('_id clerkUserId employeeId firstName lastName email department position')
      .sort({ firstName: 1, lastName: 1 })
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
