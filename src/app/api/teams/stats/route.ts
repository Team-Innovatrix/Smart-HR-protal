import { NextRequest, NextResponse } from 'next/server';
import { checkHRManagerAccess } from '@/lib/adminAuth';
import { authenticateRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';
import RegularizationRequest from '@/models/RegularizationRequest';
import UserProfile from '@/models/UserProfile';
import { TimezoneService } from '@/lib/timezoneService';

interface TeamStats {
  teamId: string;
  teamName: string;
  totalMembers: number;
  checkInsToday: number;
  leavesNextWeek: number;
  regularizationRequestsMTD: number;
}

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const authUser = await authenticateRequest(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Access denied. Please sign in.' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if user is HR Manager or team member
    const adminUser = await checkHRManagerAccess(req);
    const isHRManager = !!adminUser;

    let teams;
    
    if (isHRManager) {
      // HR Managers can see all teams
      console.log('🔍 Team Stats: HR Manager - fetching all teams');
      teams = await Team.find({ isActive: true });
    } else {
      // Regular users can only see teams they are part of
      console.log('🔍 Team Stats: Regular user - fetching user teams for userId:', authUser.userId);
      teams = await Team.find({
        $or: [
          { members: authUser.userId },
          { teamLeaderId: authUser.userId }
        ],
        isActive: true
      });
      console.log('✅ Team Stats: Found', teams.length, 'teams for user');
    }

    if (!teams || teams.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Get current date and next week range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(today.getDate() + 7);
    
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 7);

    // Get start of current month for MTD calculations
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const teamStats: TeamStats[] = [];

    // Batch fetch all team leaders' timezones for better performance
    const teamLeaderIds = teams.filter(team => team.teamLeaderId).map(team => team.teamLeaderId);
    const teamLeaders = await UserProfile.find(
      { clerkUserId: { $in: teamLeaderIds } },
      { clerkUserId: 1, timezone: 1 }
    );
    const timezoneMap = new Map(teamLeaders.map(leader => [leader.clerkUserId, leader.timezone || 'UTC']));

    // Batch fetch all team member IDs
    const allTeamMemberIds = teams.flatMap(team => team.members || []);
    const uniqueMemberIds = [...new Set(allTeamMemberIds)];

    // Batch fetch attendance data for all teams
    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          userId: { $in: uniqueMemberIds },
          status: { $in: ['present', 'full-day', 'half-day', 'late', 'early-leave', 'regularized'] }
        }
      },
      {
        $group: {
          _id: '$userId',
          dates: { $addToSet: '$date' }
        }
      }
    ]);

    // Batch fetch leave data
    const leaveData = await Leave.aggregate([
      {
        $match: {
          userId: { $in: uniqueMemberIds },
          status: 'approved',
          startDate: { $gte: nextWeekStart, $lt: nextWeekEnd }
        }
      },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 }
        }
      }
    ]);

    // Batch fetch regularization data
    const regularizationData = await RegularizationRequest.aggregate([
      {
        $match: {
          userId: { $in: uniqueMemberIds },
          status: 'pending',
          createdAt: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 }
        }
      }
    ]);

    // Create lookup maps for better performance
    const attendanceMap = new Map(attendanceData.map(item => [item._id, item.dates]));
    const leaveMap = new Map(leaveData.map(item => [item._id, item.count]));
    const regularizationMap = new Map(regularizationData.map(item => [item._id, item.count]));

    for (const team of teams) {
      // Members are stored as Clerk user IDs (strings)
      const teamMemberIds: string[] = team.members || [];
      
      // Get team leader's timezone for consistent date calculations
      const teamTimezone = timezoneMap.get(team.teamLeaderId) || 'UTC';
      const todayDateString = TimezoneService.getTodayDateStringInTimezone(teamTimezone);
      
      // Calculate check-ins today using pre-fetched data
      let checkInsToday = 0;
      for (const memberId of teamMemberIds) {
        const memberDates = attendanceMap.get(memberId) || [];
        if (memberDates.includes(todayDateString)) {
          checkInsToday++;
        }
      }

      // Calculate leaves next week using pre-fetched data
      const leavesNextWeek = teamMemberIds.reduce((sum, memberId) => {
        return sum + (leaveMap.get(memberId) || 0);
      }, 0);

      // Calculate regularization requests MTD using pre-fetched data
      const regularizationRequestsMTD = teamMemberIds.reduce((sum, memberId) => {
        return sum + (regularizationMap.get(memberId) || 0);
      }, 0);

      teamStats.push({
        teamId: team._id.toString(),
        teamName: team.name,
        totalMembers: teamMemberIds.length,
        checkInsToday,
        leavesNextWeek,
        regularizationRequestsMTD
      });
    }

    return NextResponse.json({
      success: true,
      data: teamStats
    });

  } catch (error) {
    console.error('❌ Error fetching team stats:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch team statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
