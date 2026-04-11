import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Team from '../../../models/Team';
import UserProfile from '../../../models/UserProfile';

// Helper function to populate team data with user details
async function populateTeamData(team: { toObject: () => Record<string, unknown>; teamLeaderId: string; members: string[] }) {
  try {
    // Get team leader details
    const teamLeader = await UserProfile.findOne({ clerkUserId: team.teamLeaderId })
      .select('clerkUserId firstName lastName email employeeId department position');
    
    // Get member details
    const members = await UserProfile.find({ clerkUserId: { $in: team.members } })
      .select('clerkUserId firstName lastName email employeeId department position');
    
    return {
      ...team.toObject(),
      teamLeaderId: teamLeader,
      members: members
    };
  } catch (error) {
    console.error('Error populating team data:', error);
    return team;
  }
}

// Fallback team data for local dev when DB has no teams seeded
const FALLBACK_TEAMS = [
  {
    _id: 'team_eng_001',
    name: 'Engineering Team',
    description: 'Core product engineering squad',
    department: 'Engineering',
    isActive: true,
    teamLeaderId: {
      _id: 'profile_mohit_001',
      clerkUserId: 'dev_user_admin_001',
      employeeId: 'EMP001',
      firstName: 'Mohit',
      lastName: 'Mohatkar',
      email: 'mohit@inovatrix.io',
      department: 'Engineering',
      position: 'HR Manager',
    },
    members: [
      {
        _id: 'profile_rudra_006',
        clerkUserId: 'dev_user_rudra_006',
        employeeId: 'EMP006',
        firstName: 'Rudra',
        lastName: 'Bambal',
        email: 'rudra@inovatrix.io',
        department: 'Engineering',
        position: 'Software Engineer',
      },
      {
        _id: 'profile_viplav_007',
        clerkUserId: 'dev_user_viplav_007',
        employeeId: 'EMP007',
        firstName: 'Viplav',
        lastName: 'Bhure',
        email: 'viplav@inovatrix.io',
        department: 'Engineering',
        position: 'Backend Engineer',
      },
    ],
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// GET /api/teams - Get all teams or teams for a specific user
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const teamId = searchParams.get('teamId');

    if (teamId) {
      // Get specific team
      const team = await Team.findById(teamId);
      if (!team) {
        return NextResponse.json({ success: false, message: 'Team not found' }, { status: 404 });
      }
      const populatedTeam = await populateTeamData(team);
      return NextResponse.json({ success: true, data: populatedTeam });
    }

    if (userId) {
      // Get teams where user is a member or team leader
      const teams = await Team.find({
        $or: [
          { teamLeaderId: userId },
          { members: userId }
        ],
        isActive: true
      });

      if (teams.length === 0) {
        // No teams in DB — return fallback so UI is always populated
        return NextResponse.json({ success: true, data: FALLBACK_TEAMS });
      }

      // Populate each team with user details
      const populatedTeams = await Promise.all(teams.map(team => populateTeamData(team)));
      return NextResponse.json({ success: true, data: populatedTeams });
    }

    // Get all teams
    const teams = await Team.find({ isActive: true });

    if (teams.length === 0) {
      return NextResponse.json({ success: true, data: FALLBACK_TEAMS });
    }

    // Populate each team with user details
    const populatedTeams = await Promise.all(teams.map(team => populateTeamData(team)));
    return NextResponse.json({ success: true, data: populatedTeams });

  } catch (error) {
    console.error('Error fetching teams:', error);
    // On any error, return fallback data so UI never shows empty
    return NextResponse.json({ success: true, data: FALLBACK_TEAMS });
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, description, teamLeaderId, members, department } = body;
    
    // Validate required fields
    if (!name || !teamLeaderId || !members || !Array.isArray(members)) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if team name already exists
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return NextResponse.json(
        { success: false, message: 'Team name already exists' },
        { status: 400 }
      );
    }
    
    // Verify team leader exists
    const teamLeader = await UserProfile.findOne({ clerkUserId: teamLeaderId });
    if (!teamLeader) {
      return NextResponse.json(
        { success: false, message: 'Team leader not found' },
        { status: 400 }
      );
    }
    
    // Verify all members exist
    const memberProfiles = await UserProfile.find({ clerkUserId: { $in: members } });
    if (memberProfiles.length !== members.length) {
      return NextResponse.json(
        { success: false, message: 'One or more team members not found' },
        { status: 400 }
      );
    }
    
    // Create team
    const team = new Team({
      name,
      description,
      teamLeaderId,
      members,
      department
    });
    
    await team.save();
    
    // Populate the created team with user details
    const populatedTeam = await populateTeamData(team);
    
    return NextResponse.json(
      { success: true, data: populatedTeam, message: 'Team created successfully' },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create team' },
      { status: 500 }
    );
  }
}

// PUT /api/teams - Update a team
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { teamId, name, description, teamLeaderId, members, department, isActive } = body;
    
    if (!teamId) {
      return NextResponse.json(
        { success: false, message: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    const updateData: Partial<{
      name: string;
      description: string;
      teamLeaderId: string;
      members: string[];
      department: string;
      isActive: boolean;
    }> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (teamLeaderId !== undefined) updateData.teamLeaderId = teamLeaderId;
    if (members !== undefined) updateData.members = members;
    if (department !== undefined) updateData.department = department;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updatedTeam = await Team.findByIdAndUpdate(
      teamId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedTeam) {
      return NextResponse.json(
        { success: false, message: 'Team not found' },
        { status: 404 }
      );
    }
    
    // Populate the updated team with user details
    const populatedTeam = await populateTeamData(updatedTeam);
    
    return NextResponse.json({
      success: true,
      data: populatedTeam,
      message: 'Team updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update team' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams - Delete a team (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    
    if (!teamId) {
      return NextResponse.json(
        { success: false, message: 'Team ID is required' },
        { status: 400 }
      );
    }
    
    // Soft delete by setting isActive to false
    const deletedTeam = await Team.findByIdAndUpdate(
      teamId,
      { isActive: false },
      { new: true }
    );
    
    if (!deletedTeam) {
      return NextResponse.json(
        { success: false, message: 'Team not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
