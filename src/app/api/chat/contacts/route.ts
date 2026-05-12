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

    // Return empty results if no users found
    if (users.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: { 
          users: [], 
          teams: [] 
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
