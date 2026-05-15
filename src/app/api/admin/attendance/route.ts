import { NextRequest, NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import UserProfile from '@/models/UserProfile';
import { CachedAttendanceService } from '@/lib/cachedServices';
import { EnhancedCache } from '@/lib/enhancedCache';
import { calculateMonthlyAttendanceStats } from '@/lib/attendanceUtils';

export async function GET(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!await isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // HR Managers have full access to attendance data - no need for specific permission check
    // if (!hasPermission(['all'], 'attendance:read')) {
    //   return NextResponse.json(
    //     { error: 'Insufficient permissions to read attendance.' },
    //     { status: 403 }
    //   );
    // }

    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';

    // Build query
    const query: Record<string, unknown> = {};
    
    if (startDate && endDate) {
      // Since date field is stored as string (YYYY-MM-DD), filter using string comparison
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      // If only start date is provided, use it as a single day
      query.date = startDate;
    }

    if (status) {
      query.status = status;
    }

    // Note: Department filtering will be handled after fetching user profiles
    // since we need to join with UserProfile collection

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Use MongoDB aggregation for better performance - single query instead of multiple
    const matchStage: Record<string, unknown> = { ...query };

    if (department) {
      // If department filter is applied, add it to the aggregation pipeline
      matchStage.userDepartment = department;
    }

    const aggregationPipeline = [
      {
        $lookup: {
          from: 'userprofiles',
          localField: 'userId',
          foreignField: 'clerkUserId',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: department ? { 'user.department': department } : {}
      },
      {
        $sort: { date: -1 }
      },
      {
        $facet: {
          // Get paginated results
          attendance: [
            { $skip: skip },
            { $limit: limit }
          ],
          // Get total count
          count: [
            { $count: 'total' }
          ]
        }
      }
    ];

    const result = await Attendance.aggregate(aggregationPipeline as any);
    const attendanceData = result[0];

    // Extract attendance records and total count
    const enrichedAttendance = attendanceData.attendance.map((record: any) => ({
      ...record,
      user: record.user || {
        firstName: 'Unknown',
        lastName: 'User',
        email: 'N/A',
        employeeId: 'N/A',
        department: 'N/A',
        position: 'N/A'
      }
    }));

    const total = attendanceData.count[0]?.total || 0;

    // Get all filtered attendance records for overview statistics using aggregation
    const statsAggregationPipeline = [
      {
        $lookup: {
          from: 'userprofiles',
          localField: 'userId',
          foreignField: 'clerkUserId',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: department ? { 'user.department': department } : {}
      }
    ];

    const allAttendanceResult = await Attendance.aggregate(statsAggregationPipeline);
    const allFilteredAttendance = allAttendanceResult.map(record => ({
      ...record,
      user: record.user || {
        firstName: 'Unknown',
        lastName: 'User',
        email: 'N/A',
        employeeId: 'N/A',
        department: 'N/A',
        position: 'N/A'
      }
    }));

    const overview = {
      totalPresent: 0,
      totalAbsent: 0,
      totalLate: 0,
      totalOnLeave: 0,
      averageHours: 0
    };

    // If we have a full month view, use calendar-based calculation for holidays and weekends
    let isFullMonthView = false;
    let monthStats = null;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const startOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
      const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      
      // Check if the date range covers a full month
      if (start.getTime() === startOfMonth.getTime() && end.getTime() === endOfMonth.getTime()) {
        isFullMonthView = true;
        // Calculate calendar-based stats for the month
        const year = start.getFullYear();
        const month = start.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
        const userTimezone = 'UTC'; // Default timezone for admin view
        
        // Get all unique users from the attendance data
        const uniqueUserIds = [...new Set(allFilteredAttendance.map((record: any) => record.userId))];
        
        // Calculate stats for each user and aggregate
        let totalHolidays = 0;
        let totalWeekends = 0;
        
        for (const userId of uniqueUserIds) {
          const userAttendance = allFilteredAttendance.filter((record: any) => record.userId === userId);
          const userStats = await calculateMonthlyAttendanceStats(year, month, userTimezone, userAttendance);
          totalHolidays += userStats.holidayDays;
          totalWeekends += userStats.weeklyOffDays;
        }
        
        monthStats = {
          holidayDays: totalHolidays,
          weeklyOffDays: totalWeekends
        };
      }
    }

    // Count statuses from all filtered attendance data
    allFilteredAttendance.forEach((record: any) => {
      switch (record.status) {
        case 'full-day':
        case 'present':
          overview.totalPresent++;
          break;
        case 'half-day':
          overview.totalPresent++; // Count half-day as present
          break;
        case 'absent':
          overview.totalAbsent++;
          break;
        case 'late':
          overview.totalLate++;
          break;
        case 'holiday':
        case 'weekly-off':
          // Only count from attendance records if not using calendar-based calculation
          if (!isFullMonthView) {
            overview.totalOnLeave++;
          }
          break;
        case 'early-leave':
        case 'clock-out-missing':
          // These could be considered present but with issues
          overview.totalPresent++;
          break;
        default:
          // Handle any other statuses - count as absent by default
          overview.totalAbsent++;
          break;
      }
    });

    // If we have calendar-based stats, use them for holidays and weekends
    if (isFullMonthView && monthStats) {
      overview.totalOnLeave = monthStats.holidayDays + monthStats.weeklyOffDays;
    }

    // Get department-wise statistics from all filtered attendance data
    const departmentStatsMap = new Map();
    
    allFilteredAttendance.forEach((record: any) => {
      if (record.user && record.user.department) {
        const dept = record.user.department;
        if (!departmentStatsMap.has(dept)) {
          departmentStatsMap.set(dept, { present: 0, absent: 0, late: 0 });
        }
        
        const stats = departmentStatsMap.get(dept);
        switch (record.status) {
          case 'full-day':
          case 'present':
          case 'half-day':
          case 'early-leave':
          case 'clock-out-missing':
            stats.present++;
            break;
          case 'absent':
            stats.absent++;
            break;
          case 'late':
            stats.late++;
            break;
          case 'holiday':
          case 'weekly-off':
            // These are not counted in department stats as they're not work days
            break;
          default:
            // Count unknown statuses as absent
            stats.absent++;
            break;
        }
      }
    });

    const departmentStats = Array.from(departmentStatsMap.entries()).map(([dept, stats]) => ({
      _id: dept,
      ...stats
    }));

    // If no department stats, provide a default
    if (departmentStats.length === 0) {
      departmentStats.push({
        _id: 'All Departments',
        present: overview.totalPresent,
        absent: overview.totalAbsent,
        late: 0
      });
    }

    // Calculate average hours from all filtered attendance data
    const presentRecords = allFilteredAttendance.filter((record: any) => 
      (record.status === 'full-day' || record.status === 'half-day') && 
      record.totalHours && record.totalHours > 0
    );

    if (presentRecords.length > 0) {
      const totalHours = presentRecords.reduce((sum: number, record: any) => sum + (record.totalHours || 0), 0);
      overview.averageHours = Math.round((totalHours / presentRecords.length) * 100) / 100; // Keep 2 decimal places
    }


    const response = NextResponse.json({
      success: true,
      data: {
        attendance: enrichedAttendance,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        overview,
        departmentStats
      }
    });

    // Add cache-busting headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Admin attendance GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!await isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // HR Managers have full access to modify attendance - no need for specific permission check
    // if (!hasPermission(['all'], 'attendance:write')) {
    //   return NextResponse.json(
    //     { error: 'Insufficient permissions to modify attendance.' },
    //     { status: 403 }
    //   );
    // }

    // Connect to database
    await connectDB();

    const body = await req.json();
    const { attendanceId, updates } = body;

    if (!attendanceId || !updates) {
      return NextResponse.json(
        { error: 'Attendance ID and updates are required' },
        { status: 400 }
      );
    }

    // Update attendance record
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      {
        ...updates,
        adminModifiedBy: 'admin@innovatrix.com',
        adminModifiedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'firstName lastName employeeId department position');

    if (!updatedAttendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    // Invalidate attendance cache after successful update
    try {
      await CachedAttendanceService.invalidateUserAttendance(updatedAttendance.userId);
      await EnhancedCache.invalidateByTags(['attendance', 'user']);
      // Clear specific cache keys for the updated date
      const dateKey = `attendance:${updatedAttendance.userId}:${updatedAttendance.date}`;
      const todayKey = `attendance:${updatedAttendance.userId}:today`;
      await EnhancedCache.invalidate(dateKey);
      await EnhancedCache.invalidate(todayKey);
      console.log('✅ Cache invalidated for admin attendance update:', { 
        userId: updatedAttendance.userId, 
        date: updatedAttendance.date,
        status: updatedAttendance.status 
      });
    } catch (cacheError) {
      console.warn('⚠️ Cache invalidation failed for admin attendance update:', cacheError);
      // Don't fail the request if cache invalidation fails
    }

    return NextResponse.json({
      success: true,
      data: updatedAttendance,
      message: 'Attendance record updated successfully'
    });
  } catch (error) {
    console.error('Admin attendance PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
