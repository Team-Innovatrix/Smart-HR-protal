import { NextRequest, NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import connectDB from '@/lib/mongodb';
import Leave from '@/models/Leave';

export async function PUT(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // Connect to database
    await connectDB();

    const body = await req.json();
    const { leaveIds, action, reason } = body;

    if (!leaveIds || !Array.isArray(leaveIds) || leaveIds.length === 0) {
      return NextResponse.json(
        { error: 'Leave IDs array is required' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action is required (approve or reject)' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    let updateResult;
    let message;

    if (action === 'approve') {
      updateResult = await Leave.updateMany(
        { _id: { $in: leaveIds } },
        { 
          $set: { 
            status: 'approved',
            approvedBy: 'admin@innovatrix.com',
            approvedAt: new Date()
          } 
        }
      );
      message = `${updateResult.modifiedCount} leave(s) approved successfully`;
    } else {
      updateResult = await Leave.updateMany(
        { _id: { $in: leaveIds } },
        { 
          $set: { 
            status: 'rejected',
            rejectedBy: 'admin@innovatrix.com',
            rejectedAt: new Date(),
            rejectionReason: reason
          } 
        }
      );
      message = `${updateResult.modifiedCount} leave(s) rejected successfully`;
    }

    return NextResponse.json({
      success: true,
      message,
      data: {
        action,
        affectedCount: updateResult.modifiedCount
      }
    });
  } catch (error) {
    console.error('Admin bulk leaves error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
