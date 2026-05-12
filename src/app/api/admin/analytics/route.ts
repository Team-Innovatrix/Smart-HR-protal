import { NextRequest, NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import connectDB from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';
import Leave from '@/models/Leave';
import Attendance from '@/models/Attendance';
import Team from '@/models/Team';
import SystemSettings from '@/models/SystemSettings';
import { createLastDaysStringQuery } from '@/lib/dateQueryUtils';

export async function GET(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!await isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // Connect to database
    await connectDB();

    // Get system timezone for consistent date calculations
    const systemSettings = await SystemSettings.findOne();
    const systemTimezone = systemSettings?.general?.timezone || 'UTC';

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30days';
    const department = searchParams.get('department') || '';

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30days
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build base query
    const baseQuery: Record<string, unknown> = {};
    if (department) {
      baseQuery.department = department;
    }

    // Get overview statistics
    const [
      totalUsers,
      activeUsers,
      totalLeaves,
      totalAttendance,
      totalTeams
    ] = await Promise.all([
      UserProfile.countDocuments({ ...baseQuery, isActive: true }),
      UserProfile.countDocuments({ ...baseQuery, isActive: true }),
      Leave.countDocuments({ 
        ...baseQuery,
        createdAt: { $gte: startDate }
      }),
      Attendance.countDocuments({ 
        ...baseQuery,
        date: createLastDaysStringQuery(30, systemTimezone)
      }),
      Team.countDocuments(baseQuery)
    ]);

    // Get department distribution
    const departmentDistribution = await UserProfile.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get position distribution
    const positionDistribution = await UserProfile.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$position', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get join date distribution (by year)
    const joinDateDistribution = await UserProfile.aggregate([
      { $match: { isActive: true, joinDate: { $exists: true } } },
      {
        $group: {
          _id: { $year: '$joinDate' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get leave type distribution
    const leaveTypeDistribution = await Leave.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$leaveType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get department leave trends
    const departmentLeaveTrends = await Leave.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $lookup: {
          from: 'userprofiles',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.department',
          leaves: { $sum: 1 },
          totalDays: { $sum: '$totalDays' }
        }
      },
      {
        $project: {
          department: '$_id',
          leaves: 1,
          avgDays: { $divide: ['$totalDays', '$leaves'] }
        }
      },
      { $sort: { leaves: -1 } }
    ]);

    // Get monthly attendance data
    const monthlyAttendance = await Attendance.aggregate([
      { $match: { date: createLastDaysStringQuery(30, systemTimezone) } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          late: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: '$_id.month' }
            ]
          },
          present: 1,
          absent: 1,
          late: 1
        }
      },
      { $sort: { month: 1 } }
    ]);

    // Get department attendance stats
    const departmentAttendance = await Attendance.aggregate([
      { $match: { date: createLastDaysStringQuery(30, systemTimezone) } },
      {
        $lookup: {
          from: 'userprofiles',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.department',
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          late: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          department: '$_id',
          present: 1,
          absent: 1,
          late: 1
        }
      },
      { $sort: { present: -1 } }
    ]);

    // Get average working hours by department
    const averageWorkingHours = await Attendance.aggregate([
      { $match: { date: createLastDaysStringQuery(30, systemTimezone), totalHours: { $exists: true } } },
      {
        $lookup: {
          from: 'userprofiles',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.department',
          totalHours: { $sum: '$totalHours' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          department: '$_id',
          hours: { $divide: ['$totalHours', '$count'] }
        }
      },
      { $sort: { hours: -1 } }
    ]);

    // Get monthly leaves data
    const monthlyLeaves = await Leave.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: '$_id.month' }
            ]
          },
          count: 1
        }
      },
      { $sort: { month: 1 } }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalLeaves,
          totalAttendance,
          totalTeams
        },
        leaveAnalytics: {
          monthlyLeaves,
          leaveTypeDistribution,
          departmentLeaveTrends
        },
        attendanceAnalytics: {
          monthlyAttendance,
          departmentAttendance,
          averageWorkingHours
        },
        userAnalytics: {
          departmentDistribution,
          positionDistribution,
          joinDateDistribution
        }
      }
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
