import { NextRequest, NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import UserProfile, { IUserProfileModel } from '@/models/UserProfile';

interface ClerkUserData {
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  joinDate: string;
  managerId?: string;
  organization?: string;
  timezone?: string;
  workLocation?: string;
  contactNumber?: string;
  employeeId?: string;
  isActive?: boolean;
  isHRManager?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // Connect to database
    await connectDB();

    const { users }: { users: ClerkUserData[] } = await req.json();

    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'No users provided' },
        { status: 400 }
      );
    }

    // Initialize Clerk client to verify users exist
    if (!process.env.CLERK_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Clerk configuration missing' },
        { status: 500 }
      );
    }

    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    // Get default leave balance from configuration
    const defaultLeaveBalance = await (UserProfile as IUserProfileModel).getDefaultLeaveBalance();

    const results = [];
    const errors = [];

    for (const userData of users) {
      try {
        // Verify the user exists in Clerk
        const clerkUser = await clerk.users.getUser(userData.clerkUserId);
        
        if (!clerkUser) {
          errors.push({
            clerkUserId: userData.clerkUserId,
            error: 'User not found in Clerk'
          });
          continue;
        }

        // Check if user already exists in our database
        const existingUser = await UserProfile.findOne({
          $or: [
            { clerkUserId: userData.clerkUserId },
            { email: userData.email }
          ]
        });

        if (existingUser) {
          errors.push({
            clerkUserId: userData.clerkUserId,
            email: userData.email,
            error: 'User already exists in system'
          });
          continue;
        }

        // Generate employee ID using existing logic pattern
        const employeeId = userData.employeeId || `EMP-${userData.clerkUserId.slice(-6).toUpperCase()}`;

        // Create new user profile
        const newUser = new UserProfile({
          clerkUserId: userData.clerkUserId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          employeeId,
          department: userData.department,
          position: userData.position,
          joinDate: new Date(userData.joinDate),
          managerId: userData.managerId || null,
          organization: userData.organization || '',
          timezone: userData.timezone || 'UTC',
          workLocation: userData.workLocation || '',
          contactNumber: userData.contactNumber || '',
          isActive: userData.isActive !== undefined ? userData.isActive : true,
          isHRManager: userData.isHRManager || false,
          leaveBalance: defaultLeaveBalance,
          emergencyContact: {
            name: '',
            relationship: '',
            phone: ''
          },
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          },
          permissions: []
        });

        await newUser.save();

        results.push({
          clerkUserId: userData.clerkUserId,
          email: userData.email,
          name: `${userData.firstName} ${userData.lastName}`,
          employeeId: newUser.employeeId,
          status: 'success'
        });

      } catch (error) {
        console.error('Error adding user:', userData.clerkUserId, error);
        errors.push({
          clerkUserId: userData.clerkUserId,
          email: userData.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        added: results,
        errors: errors,
        summary: {
          total: users.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });

  } catch (error) {
    console.error('Error adding Clerk users:', error);
    return NextResponse.json(
      { error: 'Failed to add users' },
      { status: 500 }
    );
  }
}
