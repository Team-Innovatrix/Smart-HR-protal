import { NextRequest, NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import UserProfile from '@/models/UserProfile';
import { calculateMonthlyAttendanceStats } from '@/lib/attendanceUtils';

export async function GET(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!await isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Calculate start and end dates for the month
    const startDate = `${month}-01`;
    // Get the last day of the month
    const year = parseInt(month.split('-')[0]);
    const monthNum = parseInt(month.split('-')[1]) - 1; // JavaScript months are 0-indexed
    const endDate = new Date(year, monthNum + 1, 0).toISOString().split('T')[0];

    // Get all users
    const users = await UserProfile.find({})
      .select('clerkUserId firstName lastName email employeeId department position timezone')
      .lean();

    // Get attendance data for the month
    const attendanceData = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).lean();

    // Process data to create payroll summary
    const payrollData = await Promise.all(users.map(async user => {
      const userAttendance = attendanceData.filter(att => att.userId === user.clerkUserId);
      
      // Use the user's timezone or default to UTC
      const userTimezone = user.timezone || 'UTC';
      
      // Calculate monthly attendance stats using the utility function
      const monthNum = parseInt(month.split('-')[1]);
      const yearNum = parseInt(month.split('-')[0]);
      const monthlyStats = await calculateMonthlyAttendanceStats(
        yearNum,
        monthNum,
        userTimezone,
        userAttendance
      );
      
      // Count additional statuses from attendance records
      const additionalCounts = {
        late: 0,
        earlyLeave: 0,
        clockOutMissing: 0
      };

      userAttendance.forEach(att => {
        switch (att.status) {
          case 'late':
            additionalCounts.late++;
            break;
          case 'early-leave':
            additionalCounts.earlyLeave++;
            break;
          case 'clock-out-missing':
            additionalCounts.clockOutMissing++;
            break;
        }
      });

      // Calculate worked days (holidays + weekends + present + full day + regularized)
      const workedDays = monthlyStats.holidayDays + monthlyStats.weeklyOffDays + 
                        monthlyStats.presentDays + monthlyStats.fullDays + monthlyStats.regularizedDays;

      return {
        employeeId: user.employeeId || user.clerkUserId,
        employeeName: `${user.firstName} ${user.lastName}`,
        department: user.department || 'N/A',
        position: user.position || 'N/A',
        present: monthlyStats.presentDays,
        regularized: monthlyStats.regularizedDays,
        holiday: monthlyStats.holidayDays,
        weekend: monthlyStats.weeklyOffDays,
        absent: monthlyStats.absentDays,
        halfDay: monthlyStats.halfDays,
        late: additionalCounts.late,
        earlyLeave: additionalCounts.earlyLeave,
        clockOutMissing: additionalCounts.clockOutMissing,
        workedDays,
        totalHours: monthlyStats.totalHours
      };
    }));

    return NextResponse.json({
      success: true,
      data: payrollData,
      message: `Payroll data for ${month} retrieved successfully`
    });

  } catch (error) {
    console.error('Admin payroll GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
