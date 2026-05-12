import { NextRequest, NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import connectDB from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';

export async function PUT(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!await isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // Connect to database
    await connectDB();

    const body = await req.json();
    const { userIds, action } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      );
    }

    if (!action || !['activate', 'deactivate', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action is required (activate, deactivate, or delete)' },
        { status: 400 }
      );
    }

    let updateResult: any;
    let message;

    switch (action) {
      case 'activate':
        updateResult = await UserProfile.updateMany(
          { _id: { $in: userIds } },
          { $set: { isActive: true } }
        );
        message = `${updateResult.modifiedCount} user(s) activated successfully`;
        break;

      case 'deactivate':
        updateResult = await UserProfile.updateMany(
          { _id: { $in: userIds } },
          { $set: { isActive: false } }
        );
        message = `${updateResult.modifiedCount} user(s) deactivated successfully`;
        break;

      case 'delete':
        updateResult = await UserProfile.deleteMany({ _id: { $in: userIds } });
        message = `${(updateResult as any).deletedCount} user(s) deleted successfully`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message,
      data: {
        action,
        affectedCount: action === 'delete' ? updateResult.deletedCount : updateResult.modifiedCount
      }
    });
  } catch (error) {
    console.error('Admin bulk users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
