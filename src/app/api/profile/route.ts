export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import UserProfile, { IUserProfileModel } from '../../../models/UserProfile';
import { authenticateRequest, createUnauthorizedResponse, getUserRole, hasAnyRole } from '../../../lib/auth';
import { TimezoneSyncService } from '../../../lib/timezoneSyncService';
import { currentUser } from '@/lib/devAuthWrapper';
import { DEV_BYPASS_ENABLED, DEV_USER } from '../../../lib/devAuth';
import mongoose from 'mongoose';

// Create or update user profile
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    let authenticatedUser;
    try {
      authenticatedUser = await authenticateRequest(request);
    } catch {
      return createUnauthorizedResponse('Please sign in to access this feature');
    }
    
    await connectDB();
    
    // Pull authoritative fields from Clerk for the caller
    const user = await currentUser();
    if (!user) return createUnauthorizedResponse('User not found');

    const body = await request.json();
    const { employeeId, department, position, joinDate, managerId, contactNumber, emergencyContact, address, profileImage, timezone } = body;

    const clerkUserId = authenticatedUser.userId;
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const email = user.emailAddresses[0]?.emailAddress || '';
    
    if (!clerkUserId || !employeeId || !firstName || !lastName || !email || !department || !position || !joinDate) {
      return NextResponse.json(
        { success: false, message: 'Required fields are missing' },
        { status: 400 }
      );
    }
    
    // Verify user can only modify their own profile
    if (authenticatedUser.userId !== clerkUserId) {
      // Check if user has admin/HR role
      const userRole = await getUserRole();
      if (!hasAnyRole(userRole, ['hr', 'manager'])) {
        return createUnauthorizedResponse('You can only modify your own profile');
      }
    }
    
    // Check if profile already exists
    let userProfile = await UserProfile.findOne({ clerkUserId });
    
    if (userProfile) {
      // Update existing profile
      userProfile.employeeId = employeeId;
      userProfile.firstName = firstName;
      userProfile.lastName = lastName;
      userProfile.email = email;
      userProfile.department = department;
      userProfile.position = position;
      userProfile.joinDate = new Date(joinDate);
      userProfile.managerId = managerId;
      userProfile.contactNumber = contactNumber;
      userProfile.emergencyContact = emergencyContact;
      userProfile.address = address;
      if (profileImage !== undefined) userProfile.profileImage = profileImage;
    } else {
        // Get default leave balance from configuration
        const defaultLeaveBalance = await (UserProfile as IUserProfileModel).getDefaultLeaveBalance();

        // Create new profile
        userProfile = new UserProfile({
          clerkUserId,
          employeeId,
          firstName,
          lastName,
          email,
          department,
          position,
          joinDate: new Date(joinDate),
          managerId,
          contactNumber,
          emergencyContact,
          address,
          profileImage,
          timezone: timezone || 'UTC',
          leaveBalance: defaultLeaveBalance
        });
    }
    
    await userProfile.save();
    
    return NextResponse.json({
      success: true,
      message: userProfile.isNew ? 'Profile created successfully' : 'Profile updated successfully',
      data: userProfile
    });
    
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to save user profile'
      },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    // Authenticate the request
    let authenticatedUser;
    try {
      authenticatedUser = await authenticateRequest(request);
    } catch {
      return createUnauthorizedResponse('Please sign in to access this feature');
    }
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Verify the user is updating their own profile or has admin rights
    if (authenticatedUser.userId !== userId) {
      // Check if user has admin/HR role
      const userRole = await getUserRole();
      if (!hasAnyRole(userRole, ['hr', 'manager'])) {
        return createUnauthorizedResponse('You can only update your own profile');
      }
    }
    
    const body = await request.json();
    const {
      firstName,
      lastName,
      organization,
      department,
      position,
      contactNumber,
      emergencyContact,
      address,
      profileImage,
      timezone
    } = body;
    
    // Find the profile to update
    const userProfile = await UserProfile.findOne({ clerkUserId: userId });
    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }
    
    // Update fields if provided
    if (firstName !== undefined) userProfile.firstName = firstName;
    if (lastName !== undefined) userProfile.lastName = lastName;
    if (organization !== undefined) userProfile.organization = organization;
    if (department !== undefined) userProfile.department = department;
    if (position !== undefined) userProfile.position = position;
    if (contactNumber !== undefined) userProfile.contactNumber = contactNumber;
    if (emergencyContact !== undefined) userProfile.emergencyContact = emergencyContact;
    if (address !== undefined) userProfile.address = address;
    if (profileImage !== undefined) userProfile.profileImage = profileImage;
    if (timezone !== undefined) {
      userProfile.timezone = timezone;
      // Sync timezone to UserSettings
      await TimezoneSyncService.syncTimezoneToUserSettings(userId, timezone);
    }
    
    await userProfile.save();
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: userProfile
    });
    
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}

// Get user profile
export async function GET(request: NextRequest) {
  // In dev bypass mode, look up the actual logged-in user from MongoDB
  if (DEV_BYPASS_ENABLED) {
    try {
      await connectDB();
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      const employeeId = searchParams.get('employeeId');

      // Build query from the request params (client sends their own userId/employeeId)
      let query: Record<string, string> = {};
      if (userId) query = { clerkUserId: userId };
      else if (employeeId) query = { employeeId };
      else query = { clerkUserId: DEV_USER.userId }; // fallback to admin

      let userProfile = await UserProfile.findOne(query);

      // Fallback: if user not in DB yet, return a sensible mock based on the userId
      if (!userProfile) {
        // Try to find any profile matching the userId pattern
        const isMohit = !userId || userId === DEV_USER.userId;
        const devProfile = {
          clerkUserId: userId || DEV_USER.userId,
          employeeId: isMohit ? 'EMP001' : (employeeId || 'EMP999'),
          firstName: isMohit ? DEV_USER.firstName : 'Unknown',
          lastName: isMohit ? DEV_USER.lastName : 'User',
          email: isMohit ? DEV_USER.email : `${userId}@innovatrix.io`,
          department: isMohit ? 'Executive' : 'General',
          position: isMohit ? 'Chief Executive Officer' : 'Employee',
          joinDate: new Date().toISOString(),
          organization: 'Innovatrix',
          leaveBalance: { sick: 0, casual: 0, annual: 0, maternity: 0, paternity: 0 },
          isActive: true,
          managerName: null,
        };
        return NextResponse.json({ success: true, data: devProfile });
      }

      return NextResponse.json({ success: true, data: userProfile.toObject() });
    } catch {
      // Hard fallback — only used if DB connection fails entirely
      const devProfile = {
        clerkUserId: DEV_USER.userId,
        employeeId: 'EMP001',
        firstName: DEV_USER.firstName,
        lastName: DEV_USER.lastName,
        email: DEV_USER.email,
        department: 'Executive',
        position: 'Chief Executive Officer',
        joinDate: new Date().toISOString(),
        organization: 'Innovatrix',
        leaveBalance: { sick: 0, casual: 0, annual: 0, maternity: 0, paternity: 0 },
        isActive: true,
        managerName: null,
      };
      return NextResponse.json({ success: true, data: devProfile });
    }
  }

  try {
    // Authenticate the request
    let authenticatedUser;
    try {
      authenticatedUser = await authenticateRequest(request);
    } catch {
      return createUnauthorizedResponse('Please sign in to access this feature');
    }
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const employeeId = searchParams.get('employeeId');
    
    if (!userId && !employeeId) {
      return NextResponse.json(
        { success: false, message: 'User ID or Employee ID is required' },
        { status: 400 }
      );
    }
    
    const query: { clerkUserId?: string; employeeId?: string } = {};
    let targetUserId: string | undefined;
    
    if (userId) {
      query.clerkUserId = userId;
      targetUserId = userId;
    } else if (employeeId) {
      query.employeeId = employeeId;
      // We need to find the clerkUserId to verify access
      const tempProfile = await UserProfile.findOne(query);
      if (!tempProfile) {
        return NextResponse.json(
          { success: false, message: 'User profile not found' },
          { status: 404 }
        );
      }
      targetUserId = tempProfile.clerkUserId;
    }
    
    // Ensure targetUserId is defined
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, message: 'Unable to determine target user ID' },
        { status: 400 }
      );
    }
    
    // Verify user can only access their own profile data
    if (authenticatedUser.userId !== targetUserId) {
      // Check if user has admin/HR role
      const userRole = await getUserRole();
      if (!hasAnyRole(userRole, ['hr', 'manager'])) {
        return createUnauthorizedResponse('You can only access your own profile data');
      }
    }
    
    let userProfile = await UserProfile.findOne(query);
    
    // If profile doesn't exist, try to create it from Clerk data
    if (!userProfile) {
      try {
        // Get user details from Clerk
        const user = await currentUser();
        if (!user) {
          return NextResponse.json(
            { success: false, message: 'User not found in Clerk' },
            { status: 404 }
          );
        }
        
        // Create a basic profile from Clerk data
        const email = user.emailAddresses[0]?.emailAddress || '';
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const department = 'General';
        const position = 'Employee';
        const joinDate = new Date();
        const employeeId = `EMP-${targetUserId.slice(-6).toUpperCase()}`;
        
        // Extract organization from user metadata
        let organization = '';
        if (user.publicMetadata && typeof user.publicMetadata === 'object') {
          const metadata = user.publicMetadata as Record<string, unknown>;
          organization = (metadata?.organization as string) || 
                       (metadata?.organizationName as string) || 
                       (metadata?.company as string) || '';
        }
        
        // Get default leave balance from configuration
        const defaultLeaveBalance = await (UserProfile as IUserProfileModel).getDefaultLeaveBalance();

        // Create new profile
        userProfile = new UserProfile({
          clerkUserId: targetUserId,
          employeeId,
          firstName,
          lastName,
          email,
          department,
          position,
          joinDate,
          organization,
          timezone: 'UTC', // Will be updated by timezone context
          leaveBalance: defaultLeaveBalance,
          isActive: true
        });
        
        await userProfile.save();
        console.log(`Created new profile for user ${targetUserId} from Clerk data`);
      } catch {
        return NextResponse.json(
          { success: false, message: 'Failed to create user profile from Clerk data' },
          { status: 500 }
        );
      }
    }
    
    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found and could not be created' },
        { status: 404 }
      );
    }
    
    // Enrich with manager name if available
    const profileData: Record<string, unknown> = userProfile.toObject();
    if (userProfile.managerId) {
      try {
        const managerQuery: Record<string, unknown>[] = [
          { clerkUserId: userProfile.managerId }
        ];
        if (mongoose.Types.ObjectId.isValid(userProfile.managerId)) {
          managerQuery.push({ _id: userProfile.managerId });
        }
        const manager = await UserProfile.findOne({ $or: managerQuery }).select('firstName lastName');
        if (manager) {
          profileData.managerName = `${manager.firstName} ${manager.lastName}`;
        } else {
          profileData.managerName = 'Manager not found';
        }
      } catch {
        profileData.managerName = 'Error loading manager';
      }
    } else {
      profileData.managerName = null;
    }

    return NextResponse.json({
      success: true,
      data: profileData
    });
    
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch user profile'
      },
      { status: 500 }
    );
  }
}
