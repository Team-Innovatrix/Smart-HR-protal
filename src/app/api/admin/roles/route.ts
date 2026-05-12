import { NextRequest, NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';
import UserProfile from '@/models/UserProfile';

// Get all roles with employee count
export async function GET(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // Connect to database
    await connectDB();

    // Get all active roles
    const roles = await Role.find({ isActive: true }).sort({ name: 1 });

    // Get employee count for each role
    const rolesWithCount = await Promise.all(
      roles.map(async (role) => {
        const employeeCount = await UserProfile.countDocuments({ 
          roleId: role._id.toString(),
          isActive: true 
        });
        
        return {
          _id: role._id,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          isSystem: role.isSystem,
          employeeCount,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: rolesWithCount
    });
  } catch (error) {
    console.error('Admin roles GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// Create a new role
export async function POST(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // Connect to database
    await connectDB();
    
    const body = await req.json();
    
    // Validate required fields
    const { name, description, permissions } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Check if role name already exists
    const existingRole = await Role.findOne({ 
      name: name.trim(),
      isActive: true 
    });
    
    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    // Create new role
    const newRole = new Role({
      name: name.trim(),
      description: description?.trim() || '',
      permissions: permissions ? permissions.filter((p: string) => p && p.trim()) : [],
      isSystem: false,
      isActive: true,
      createdBy: 'admin@innovatrix.com'
    });

    await newRole.save();

    return NextResponse.json({
      success: true,
      data: newRole,
      message: 'Role created successfully'
    });
  } catch (error) {
    console.error('Admin roles POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}
