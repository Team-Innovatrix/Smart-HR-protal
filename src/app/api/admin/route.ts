import { NextRequest, NextResponse } from 'next/server';
import { isAdminSessionValid, ADMIN_IDENTITY } from '@/lib/adminCookieAuth';
import connectDB from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';
import Leave from '@/models/Leave';
import Attendance from '@/models/Attendance';
import Team from '@/models/Team';
import { createTodayStringQuery } from '@/lib/dateQueryUtils';

export async function GET(req: NextRequest) {
  try {
    if (!isAdminSessionValid(req)) {
      return NextResponse.json(
        { error: 'Access denied. Admin session required.' },
        { status: 403 }
      );
    }
    const adminUser = ADMIN_IDENTITY;

    // Connect to database
    await connectDB();

    // Get dashboard overview data
    const [
      totalUsers,
      activeUsers,
      pendingLeaves,
      todayAttendance,
      totalTeams
    ] = await Promise.all([
      UserProfile.countDocuments({ isActive: true }),
      UserProfile.countDocuments({ isActive: true }),
      Leave.countDocuments({ status: 'pending' }),
      Attendance.countDocuments({ 
        date: createTodayStringQuery('UTC')
      }),
      Team.countDocuments()
    ]);

    // Get department-wise user count
    const departmentStats = await UserProfile.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent leave requests
    const recentLeaves = await Leave.find({ status: 'pending' })
      .populate('userId', 'firstName lastName employeeId department')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get attendance overview for today
    const todayAttendanceStats = await Attendance.aggregate([
      {
        $match: {
          date: createTodayStringQuery('UTC')
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          pendingLeaves,
          todayAttendance,
          totalTeams
        },
        departmentStats,
        recentLeaves,
        todayAttendanceStats,
        adminUser: {
          name: `Innovatrix Admin`,
          employeeId: adminUser.employeeId,
          department: adminUser.department,
          permissions: adminUser.permissions
        }
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
