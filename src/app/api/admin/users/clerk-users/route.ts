import { NextRequest, NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import UserProfile from '@/models/UserProfile';

export async function GET(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // Connect to database
    await connectDB();

    // Initialize Clerk client
    if (!process.env.CLERK_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Clerk configuration missing' },
        { status: 500 }
      );
    }

    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    // Fetch all users from Clerk
    const clerkUsersResponse = await clerk.users.getUserList({ limit: 500 });
    const clerkUsers = clerkUsersResponse.data;
    
    // Get all existing user emails from our database
    const existingUsers = await UserProfile.find({}, 'email clerkUserId');
    const existingEmails = new Set(existingUsers.map(user => user.email.toLowerCase()));
    const existingClerkIds = new Set(existingUsers.map(user => user.clerkUserId));
    

    // Filter out users that are already in our system
    const availableClerkUsers = clerkUsers.filter(user => {
      const email = user.emailAddresses[0]?.emailAddress?.toLowerCase();
      const isAvailable = email && 
             !existingEmails.has(email) && 
             !existingClerkIds.has(user.id) &&
             user.firstName && 
             user.lastName;
      
      
      return isAvailable;
    });

    // Transform the data for the frontend
    const transformedUsers = availableClerkUsers.map(user => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      organization: user.publicMetadata?.organization || 
                   user.publicMetadata?.organizationName || 
                   user.publicMetadata?.company || 
                   user.privateMetadata?.organization || 
                   user.privateMetadata?.organizationName || 
                   user.privateMetadata?.company || ''
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: transformedUsers,
        total: transformedUsers.length
      }
    });

  } catch (error) {
    console.error('Error fetching Clerk users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Clerk users' },
      { status: 500 }
    );
  }
}
