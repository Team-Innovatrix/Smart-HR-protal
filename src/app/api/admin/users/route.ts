import { NextRequest, NextResponse } from 'next/server';
import { checkHRManagerAccess } from '@/lib/adminAuth';
import connectDB from '@/lib/mongodb';
import UserProfile, { IUserProfileModel } from '@/models/UserProfile';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    const adminUser = await checkHRManagerAccess(req);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Access denied. HR Manager privileges required.' },
        { status: 403 }
      );
    }

    // HR Managers have full access to user data - no need for specific permission check
    // if (!hasPermission(adminUser.permissions, 'users:read')) {
    //   return NextResponse.json(
    //     { error: 'Insufficient permissions to read users.' },
    //     { status: 403 }
    //   );
    // }

    // Connect to database
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';

    // Build query
    const query: Record<string, unknown> = { isActive: true };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await UserProfile.countDocuments(query);
    
    // Get users with pagination
    const users = await UserProfile.find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get all unique manager IDs from the users
    const managerIds = users
      .map(user => user.managerId)
      .filter((managerId, index, arr) => managerId && arr.indexOf(managerId) === index);

    // Fetch all manager profiles in a single query
    const managerProfiles = await UserProfile.find({
      $or: [
        { clerkUserId: { $in: managerIds } },
        { _id: { $in: managerIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } }
      ]
    }).select('clerkUserId firstName lastName');

    // Create a map for quick manager lookup
    const managerMap = new Map();
    managerProfiles.forEach(manager => {
      managerMap.set(manager.clerkUserId, manager);
      if (mongoose.Types.ObjectId.isValid(manager.clerkUserId)) {
        managerMap.set(manager._id.toString(), manager);
      }
    });

    // Add manager names to users without additional queries
    const usersWithManagers = users.map(user => {
      const userObj = user.toObject();

      if (user.managerId) {
        const manager = managerMap.get(user.managerId);
        if (manager) {
          userObj.managerName = `${manager.firstName} ${manager.lastName}`;
        } else {
          userObj.managerName = 'Manager not found';
        }
      } else {
        userObj.managerName = null;
      }

      return userObj;
    });

    // Get department list for filters
    const departments = await UserProfile.distinct('department');

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithManagers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          departments
        }
      }
    });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    const adminUser = await checkHRManagerAccess(req);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Access denied. HR Manager privileges required.' },
        { status: 403 }
      );
    }

    // HR Managers have full access to create users - no need for specific permission check
    // if (!hasPermission(adminUser.permissions, 'users:write')) {
    //   return NextResponse.json(
    //     { error: 'Insufficient permissions to create users.' },
    //     { status: 403 }
    //   );
    // }

    // Connect to database
    await connectDB();
    
    const body = await req.json();
    
    // Validate required fields (employeeId is auto-generated if not provided)
    const requiredFields = ['firstName', 'lastName', 'email', 'department', 'position', 'joinDate'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Auto-generate employeeId if not provided
    if (!body.employeeId) {
      const count = await UserProfile.countDocuments();
      body.employeeId = `EMP${String(count + 1).padStart(3, '0')}`;
    }

    // Also auto-generate a clerkUserId for manually-created employees
    if (!body.clerkUserId) {
      body.clerkUserId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    // Check if employee ID already exists
    const existingEmployee = await UserProfile.findOne({ employeeId: body.employeeId });
    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await UserProfile.findOne({ email: body.email });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Get default leave balance from configuration
    const defaultLeaveBalance = await (UserProfile as IUserProfileModel).getDefaultLeaveBalance();

    // Create new user profile
    const newUser = new UserProfile({
      ...body,
      timezone: body.timezone || 'UTC',
      leaveBalance: {
        sick: body.leaveBalance?.sick || 0,
        casual: body.leaveBalance?.casual || 0,
        annual: body.leaveBalance?.annual || 0,
        maternity: body.leaveBalance?.maternity || 0,
        paternity: body.leaveBalance?.paternity || 0,
        sick_alloted: body.leaveBalance?.sick_alloted || defaultLeaveBalance.sick_alloted,
        casual_alloted: body.leaveBalance?.casual_alloted || defaultLeaveBalance.casual_alloted,
        annual_alloted: body.leaveBalance?.annual_alloted || defaultLeaveBalance.annual_alloted,
        maternity_alloted: body.leaveBalance?.maternity_alloted || defaultLeaveBalance.maternity_alloted,
        paternity_alloted: body.leaveBalance?.paternity_alloted || defaultLeaveBalance.paternity_alloted
      },
      isActive: true
    });

    await newUser.save();

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Admin users POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
