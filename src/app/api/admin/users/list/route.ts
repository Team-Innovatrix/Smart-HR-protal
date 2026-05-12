import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const department = searchParams.get('department') || '';

    // Build query
    const query: Record<string, unknown> = { isActive: true };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    // Fetch users with pagination
    const users = await UserProfile.find(query)
      .select('clerkUserId firstName lastName employeeId department position email')
      .sort({ firstName: 1, lastName: 1 })
      .limit(limit);

    // Transform data to include both clerkUserId and display name
    const transformedUsers = users.map(user => ({
      clerkUserId: user.clerkUserId,
      displayName: `${user.firstName} ${user.lastName}`,
      employeeId: user.employeeId,
      department: user.department,
      position: user.position,
      email: user.email
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: transformedUsers,
        total: transformedUsers.length
      }
    });

  } catch (error) {
    console.error('Admin users list GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
