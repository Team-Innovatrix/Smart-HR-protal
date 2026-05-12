import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';
import Leave from '@/models/Leave';
import Attendance from '@/models/Attendance';
import Team from '@/models/Team';
import { createTodayStringQuery } from '@/lib/dateQueryUtils';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: 'Access denied. Authentication required.' },
        { status: 401 }
      );
    }

    const role = user.publicMetadata?.role as string;
    if (role !== 'admin' && role !== 'owner') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

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
          name: `${user.firstName} ${user.lastName}`,
          employeeId: user.id,
          department: 'Administration',
          permissions: ['all']
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
