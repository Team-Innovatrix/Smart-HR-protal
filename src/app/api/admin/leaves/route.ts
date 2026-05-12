import { NextRequest, NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import connectDB from '@/lib/mongodb';
import Leave from '@/models/Leave';
import { createDateRangeQuery } from '@/lib/dateQueryUtils';
// import UserProfile from '@/models/UserProfile'; // Unused import removed

export async function GET(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // HR Managers have full access to leave data - no need for specific permission check
    // if (!hasPermission(adminUser.permissions, 'leaves:read')) {
    //   return NextResponse.json(
    //     { error: 'Insufficient permissions to read leaves.' },
    //     { status: 403 }
    //   );
    // }

    // Connect to database
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // Build query
    const query: Record<string, unknown> = {};
    
    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      const dateRange = createDateRangeQuery(startDate, endDate);
      if (typeof dateRange === 'object' && '$gte' in dateRange) {
        query.startDate = { $gte: dateRange.$gte };
        query.endDate = { $lte: dateRange.$lte };
      } else {
        query.startDate = { $gte: dateRange as Date };
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await Leave.countDocuments(query);
    
    // Get leaves with pagination and join user details using aggregation
    const leaves = await Leave.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'userprofiles',
          localField: 'userId',
          foreignField: 'clerkUserId',
          as: 'userProfile'
        }
      },
      { $unwind: { path: '$userProfile', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          userId: {
            _id: '$userProfile._id',
            firstName: '$userProfile.firstName',
            lastName: '$userProfile.lastName',
            employeeId: '$userProfile.employeeId',
            department: '$userProfile.department',
            position: '$userProfile.position'
          },
          leaveType: 1,
          startDate: 1,
          endDate: 1,
          totalDays: 1,
          reason: 1,
          status: 1,
          approvedBy: 1,
          appliedDate: 1,
          rejectionReason: 1,
          userTimezone: 1,
          isFullDay: 1,
          notes: 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get status counts for overview - always show all statuses even if 0
    const statusCountsRaw = await Leave.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Create a map of existing counts
    const statusCountsMap = statusCountsRaw.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);
    
    // Always include all possible statuses with their counts (0 if not found)
    const statusCounts = [
      { _id: 'pending', count: statusCountsMap['pending'] || 0 },
      { _id: 'approved', count: statusCountsMap['approved'] || 0 },
      { _id: 'rejected', count: statusCountsMap['rejected'] || 0 },
      { _id: 'cancelled', count: statusCountsMap['cancelled'] || 0 }
    ];
    
    // Calculate total applied (all non-cancelled leaves)
    const totalApplied = statusCounts
      .filter(status => status._id !== 'cancelled')
      .reduce((sum, status) => sum + status.count, 0);

    // Get department-wise leave counts
    const departmentLeaveCounts = await Leave.aggregate([
      {
        $lookup: {
          from: 'userprofiles',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $group: { _id: '$user.department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        leaves,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        overview: {
          statusCounts,
          departmentLeaveCounts,
          totalApplied
        }
      }
    });
  } catch (error) {
    console.error('Admin leaves GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // HR Managers have full access to approve leaves - no need for specific permission check
    // if (!hasPermission(adminUser.permissions, 'leaves:approve')) {
    //   return NextResponse.json(
    //     { error: 'Insufficient permissions to approve leaves.' },
    //     { status: 500 }
    //   );
    // }

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

    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Update multiple leaves
    const updateData: Record<string, unknown> = {
      status: action,
      adminApprovedBy: 'admin@innovatrix.com',
      adminApprovedAt: new Date()
    };

    if (action === 'rejected' && reason) {
      updateData.adminRejectionReason = reason;
    }

    const result = await Leave.updateMany(
      { _id: { $in: leaveIds } },
      updateData
    );

    // Get updated leaves for response with user details
    const updatedLeaves = await Leave.aggregate([
      { $match: { _id: { $in: leaveIds } } },
      {
        $lookup: {
          from: 'userprofiles',
          localField: 'userId',
          foreignField: 'clerkUserId',
          as: 'userProfile'
        }
      },
      { $unwind: { path: '$userProfile', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          userId: {
            _id: '$userProfile._id',
            firstName: '$userProfile.firstName',
            lastName: '$userProfile.lastName',
            employeeId: '$userProfile.employeeId',
            department: '$userProfile.department',
            position: '$userProfile.position'
          },
          leaveType: 1,
          startDate: 1,
          endDate: 1,
          totalDays: 1,
          reason: 1,
          status: 1,
          approvedBy: 1,
          appliedDate: 1,
          rejectionReason: 1,
          userTimezone: 1,
          isFullDay: 1,
          notes: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        updatedLeaves,
        message: `Successfully ${action} ${result.modifiedCount} leave request(s)`
      }
    });
  } catch (error) {
    console.error('Admin leaves PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
