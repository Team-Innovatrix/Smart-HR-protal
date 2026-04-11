import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import UserProfile from '../../../../models/UserProfile';
import Team from '../../../../models/Team';

// GET /api/chat/contacts - Get all possible chat contacts (users + teams)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Fetch all users
    const users = await UserProfile.find({ clerkUserId: { $ne: userId } })
      .select('clerkUserId firstName lastName email employeeId position department imageUrl')
      .lean();

    // Fetch teams the user belongs to (for group chats)
    let teams = [];
    if (userId) {
      teams = await Team.find({
        $or: [{ teamLeaderId: userId }, { members: userId }],
        isActive: true
      })
      .select('name description department')
      .lean();
    } else {
      teams = await Team.find({ isActive: true }).select('name description department').lean();
    }

    // Since in local dev we use FALLBACK_TEAMS, let's provide fallback data if empty
    if (users.length === 0) {
      const fallbackUsers = [
        { clerkUserId: 'dev_user_admin_001', firstName: 'Mohit', lastName: 'Mohatkar', position: 'HR Manager', department: 'HR' },
        { clerkUserId: 'dev_user_rudra_006', firstName: 'Rudra', lastName: 'Bambal', position: 'Software Engineer', department: 'Engineering' },
        { clerkUserId: 'dev_user_viplav_007', firstName: 'Viplav', lastName: 'Bhure', position: 'Backend Engineer', department: 'Engineering' }
      ].filter(u => u.clerkUserId !== userId);
      
      const fallbackTeams = [
        { _id: 'team_eng_001', name: 'Engineering Team', description: 'Core product engineering' }
      ];

      return NextResponse.json({ 
        success: true, 
        data: { 
          users: fallbackUsers, 
          teams: fallbackTeams 
        } 
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: { users, teams } 
    });

  } catch (error) {
    console.error('Chat Contacts API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
