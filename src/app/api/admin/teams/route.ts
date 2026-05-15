import { NextRequest, NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
// import UserProfile from '@/models/UserProfile'; // Unused import removed

// Simple health check endpoint
export async function HEAD() {
  return NextResponse.json({ status: 'ok' });
}

export async function GET(req: NextRequest) {
  try {
    if (!await isAdminSessionValid(req)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const department = searchParams.get('department') || '';

    const query: Record<string, unknown> = {};
    if (department) {
      query.department = department;
    }

    const skip = (page - 1) * limit;

    const [teams, total] = await Promise.all([
      Team.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Team.countDocuments(query)
    ]);

    // Get overview statistics
    const overview = await Team.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalTeams: { $sum: 1 },
          totalMembers: { $sum: { $size: '$members' } }
        }
      }
    ]);

    // Get department-wise team counts
    const departmentStats = await Team.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          memberCount: { $sum: { $size: '$members' } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get unique departments
    const departments = await Team.distinct('department');

    const overviewData = overview[0] || { totalTeams: 0, totalMembers: 0 };
    const averageTeamSize = overviewData.totalTeams > 0 
      ? Math.round(overviewData.totalMembers / overviewData.totalTeams * 10) / 10 
      : 0;

    const responseData = {
      success: true,
      data: {
        teams,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        overview: {
          totalTeams: overviewData.totalTeams,
          totalMembers: overviewData.totalMembers,
          averageTeamSize,
          departments
        },
        departmentStats
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(' Teams API: Error occurred:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!await isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // Connect to database
    await connectDB();

    const body = await req.json();
    const { name, description, department, managerId, members } = body;

    // Validate required fields
    if (!name || !department || !managerId) {
      return NextResponse.json(
        { error: 'Name, department, and manager are required' },
        { status: 400 }
      );
    }

    // Check if team name already exists in the department
    const existingTeam = await Team.findOne({ name, department });
    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team name already exists in this department' },
        { status: 400 }
      );
    }

    // Create new team
    const team = new Team({
      name,
      description,
      department,
      teamLeaderId: managerId, // Use teamLeaderId instead of managerId
      members: members || [],
      timezone: 'UTC' // Provide default timezone as it's required
    });

    await team.save();

    // Return the created team without population
    return NextResponse.json({
      success: true,
      data: team
    }, { status: 201 });
  } catch (error) {
    console.error('Admin team creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
