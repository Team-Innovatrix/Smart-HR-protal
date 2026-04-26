import { NextRequest, NextResponse } from 'next/server';
import { checkHRManagerAccess } from '@/lib/adminAuth';
import connectDB from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';
import mongoose from 'mongoose';

// Get individual user details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Check if user has HR Manager access
    const adminUser = await checkHRManagerAccess(req);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Access denied. HR Manager privileges required.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();
    
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find user by MongoDB _id or clerkUserId
    // Build query conditions based on whether userId is a valid ObjectId or other identifier
    const queryConditions: Record<string, unknown>[] = [
      { clerkUserId: userId },
      { employeeId: userId }
    ];
    
    // Only add _id query if userId is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(userId)) {
      queryConditions.push({ _id: userId });
    }
    
    const user = await UserProfile.findOne({
      $or: queryConditions
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If user has a manager, fetch manager details
    let managerName = '';
    if (user.managerId) {
      // Build query conditions based on whether managerId is a valid ObjectId or Clerk user ID
      const queryConditions: Record<string, unknown>[] = [
        { clerkUserId: user.managerId }
      ];
      
      // Only add _id query if managerId is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(user.managerId)) {
        queryConditions.push({ _id: user.managerId });
      }
      
      const manager = await UserProfile.findOne({
        $or: queryConditions
      });
      if (manager) {
        managerName = `${manager.firstName} ${manager.lastName}`;
      }
    }

    // Convert user to plain object and add manager name
    const userData = user.toObject();
    userData.managerName = managerName;

    return NextResponse.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Admin user GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update individual user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Check if user has HR Manager access
    const adminUser = await checkHRManagerAccess(req);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Access denied. HR Manager privileges required.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();
    
    const { userId } = await params;
    const body = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find user by MongoDB _id or clerkUserId
    // Build query conditions based on whether userId is a valid ObjectId or other identifier
    const queryConditions: Record<string, unknown>[] = [
      { clerkUserId: userId },
      { employeeId: userId }
    ];
    
    // Only add _id query if userId is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(userId)) {
      queryConditions.push({ _id: userId });
    }
    
    const user = await UserProfile.findOne({
      $or: queryConditions
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Security check: HR cannot edit the CEO unless they are the CEO
    const isTargetCEO = user.position === 'CEO' || user.position === 'Chief Executive Officer';
    const isSelf = adminUser.clerkUserId === user.clerkUserId;
    if (isTargetCEO && !isSelf) {
      return NextResponse.json(
        { error: 'Access denied. You cannot modify the Chief Executive Officer.' },
        { status: 403 }
      );
    }

    // Validate and update fields
    const updateData: Record<string, unknown> = {};

    // Basic information
    if (body.employeeId !== undefined) {
      // Check if employee ID is unique (excluding current user)
      const existingEmployee = await UserProfile.findOne({ 
        employeeId: body.employeeId,
        _id: { $ne: user._id }
      });
      if (existingEmployee) {
        return NextResponse.json(
          { error: 'Employee ID already exists' },
          { status: 400 }
        );
      }
      updateData.employeeId = body.employeeId.trim();
    }

    if (body.firstName !== undefined) {
      if (!body.firstName.trim()) {
        return NextResponse.json(
          { error: 'First name is required' },
          { status: 400 }
        );
      }
      updateData.firstName = body.firstName.trim();
    }

    if (body.lastName !== undefined) {
      if (!body.lastName.trim()) {
        return NextResponse.json(
          { error: 'Last name is required' },
          { status: 400 }
        );
      }
      updateData.lastName = body.lastName.trim();
    }

    if (body.email !== undefined) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Please enter a valid email' },
          { status: 400 }
        );
      }
      
      // Check if email is unique (excluding current user)
      const existingEmail = await UserProfile.findOne({ 
        email: body.email.toLowerCase(),
        _id: { $ne: user._id }
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
      updateData.email = body.email.toLowerCase().trim();
    }

    if (body.department !== undefined) {
      if (!body.department.trim()) {
        return NextResponse.json(
          { error: 'Department is required' },
          { status: 400 }
        );
      }
      updateData.department = body.department.trim();
    }

    if (body.position !== undefined) {
      if (!body.position.trim()) {
        return NextResponse.json(
          { error: 'Position is required' },
          { status: 400 }
        );
      }
      updateData.position = body.position.trim();
    }

    if (body.joinDate !== undefined) {
      const joinDate = new Date(body.joinDate);
      if (isNaN(joinDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid join date' },
          { status: 400 }
        );
      }
      updateData.joinDate = joinDate;
    }

    if (body.managerId !== undefined) {
      updateData.managerId = body.managerId?.trim() || null;
    }

    if (body.organization !== undefined) {
      updateData.organization = body.organization?.trim() || null;
    }

    // Timezone and location
    if (body.timezone !== undefined) {
      // Accept 'UTC' or any IANA timezone (e.g. Asia/Kolkata, America/New_York, Etc/GMT+5)
      const isValidTimezone = body.timezone === 'UTC' || /^[A-Za-z_][A-Za-z0-9_+-]*\/[A-Za-z0-9_+\-\/]+$/.test(body.timezone);
      if (!isValidTimezone) {
        return NextResponse.json(
          { error: `Invalid timezone: ${body.timezone}` },
          { status: 400 }
        );
      }
      updateData.timezone = body.timezone;
    }

    if (body.workLocation !== undefined) {
      updateData.workLocation = body.workLocation?.trim() || null;
    }

    // Contact information
    if (body.contactNumber !== undefined) {
      updateData.contactNumber = body.contactNumber?.trim() || null;
    }

    // Emergency contact
    if (body.emergencyContact !== undefined) {
      if (body.emergencyContact) {
        updateData.emergencyContact = {
          name: body.emergencyContact.name?.trim() || null,
          relationship: body.emergencyContact.relationship?.trim() || null,
          phone: body.emergencyContact.phone?.trim() || null
        };
      } else {
        updateData.emergencyContact = null;
      }
    }

    // Address
    if (body.address !== undefined) {
      if (body.address) {
        updateData.address = {
          street: body.address.street?.trim() || null,
          city: body.address.city?.trim() || null,
          state: body.address.state?.trim() || null,
          zipCode: body.address.zipCode?.trim() || null,
          country: body.address.country?.trim() || null
        };
      } else {
        updateData.address = null;
      }
    }

    // Leave balance
    if (body.leaveBalance !== undefined) {
      const leaveBalance = {
        sick: Math.max(0, Number(body.leaveBalance.sick) || 0),
        casual: Math.max(0, Number(body.leaveBalance.casual) || 0),
        annual: Math.max(0, Number(body.leaveBalance.annual) || 0),
        maternity: Math.max(0, Number(body.leaveBalance.maternity) || 0),
        paternity: Math.max(0, Number(body.leaveBalance.paternity) || 0)
      };
      updateData.leaveBalance = leaveBalance;
    }

    // Status and permissions
    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    if (body.isHRManager !== undefined) {
      updateData.isHRManager = Boolean(body.isHRManager);
    }

    if (body.permissions !== undefined) {
      updateData.permissions = Array.isArray(body.permissions) 
        ? body.permissions.filter((p: unknown) => typeof p === 'string' && p.trim())
        : [];
    }

    if (body.roleId !== undefined) {
      updateData.roleId = body.roleId ? String(body.roleId).trim() : null;
    }

    // Update the user
    const updatedUser = await UserProfile.findByIdAndUpdate(
      user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Admin user PUT error:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error: ' + error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete individual user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Check if user has HR Manager access
    const adminUser = await checkHRManagerAccess(req);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Access denied. HR Manager privileges required.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();
    
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find and delete user
    // Build query conditions based on whether userId is a valid ObjectId or other identifier
    const queryConditions: Record<string, unknown>[] = [
      { clerkUserId: userId },
      { employeeId: userId }
    ];
    
    // Only add _id query if userId is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(userId)) {
      queryConditions.push({ _id: userId });
    }
    
    const user = await UserProfile.findOneAndDelete({
      $or: queryConditions
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Admin user DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
