import { NextRequest, NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    if (!await isAdminSessionValid(req)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Connect to database
    await connectDB();

    const { teamId } = await params;
    const body = await req.json();
    const { name, description, department, managerId, members } = body;

    // Validate required fields
    if (!name || !department || !managerId) {
      return NextResponse.json(
        { error: 'Name, department, and manager are required' },
        { status: 400 }
      );
    }

    // Check if team exists
    const existingTeam = await Team.findById(teamId);
    if (!existingTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if team name already exists in the department (excluding current team)
    const duplicateTeam = await Team.findOne({ 
      name, 
      department, 
      _id: { $ne: teamId } 
    });
    if (duplicateTeam) {
      return NextResponse.json(
        { error: 'Team name already exists in this department' },
        { status: 400 }
      );
    }

    // Update team
    const updatedTeam = await Team.findByIdAndUpdate(
      teamId,
      {
        name,
        description,
        department,
        teamLeaderId: managerId,
        members: members || [],
        updatedAt: new Date()
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedTeam,
      message: 'Team updated successfully'
    });
  } catch (error) {
    console.error('Admin team update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    if (!await isAdminSessionValid(req)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Connect to database
    await connectDB();

    const { teamId } = await params;

    // Check if team exists
    const existingTeam = await Team.findById(teamId);
    if (!existingTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Delete team
    await Team.findByIdAndDelete(teamId);

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Admin team delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    if (!await isAdminSessionValid(req)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Connect to database
    await connectDB();

    const { teamId } = await params;

    // Get team details
    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Admin team get error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
