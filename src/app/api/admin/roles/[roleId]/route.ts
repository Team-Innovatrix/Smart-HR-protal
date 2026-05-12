import { NextRequest, NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';
import UserProfile from '@/models/UserProfile';

// Get a specific role
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    if (!isAdminSessionValid(req)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Connect to database
    await connectDB();
    
    const { roleId } = await params;
    
    const role = await Role.findById(roleId);
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Get employee count for this role
    const employeeCount = await UserProfile.countDocuments({ 
      roleId: roleId,
      isActive: true 
    });

    return NextResponse.json({
      success: true,
      data: {
        ...role.toObject(),
        employeeCount
      }
    });
  } catch (error) {
    console.error('Admin role GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

// Update a role
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    if (!isAdminSessionValid(req)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Connect to database
    await connectDB();
    
    const { roleId } = await params;
    const body = await req.json();
    
    const role = await Role.findById(roleId);
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if trying to update a system role
    if (role.isSystem) {
      return NextResponse.json(
        { error: 'Cannot modify system roles' },
        { status: 400 }
      );
    }

    // Validate required fields
    const { name, description, permissions } = body;
    
    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Name and permissions are required' },
        { status: 400 }
      );
    }

    // Check if role name already exists (excluding current role)
    const existingRole = await Role.findOne({ 
      name: name.trim(),
      isActive: true,
      _id: { $ne: roleId }
    });
    
    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    // Update role
    const updatedRole = await Role.findByIdAndUpdate(
      roleId,
      {
        name: name.trim(),
        description: description?.trim() || '',
        permissions: permissions.filter((p: string) => p && p.trim()),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedRole,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Admin role PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

// Delete a role
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    if (!isAdminSessionValid(req)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Connect to database
    await connectDB();
    
    const { roleId } = await params;
    
    const role = await Role.findById(roleId);
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if trying to delete a system role
    if (role.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system roles' },
        { status: 400 }
      );
    }

    // Check if role is assigned to any users
    const usersWithRole = await UserProfile.countDocuments({ 
      roleId: roleId,
      isActive: true 
    });
    
    if (usersWithRole > 0) {
      return NextResponse.json(
        { error: `Cannot delete role. ${usersWithRole} user(s) are currently assigned to this role.` },
        { status: 400 }
      );
    }

    // Soft delete the role
    await Role.findByIdAndUpdate(roleId, { 
      isActive: false,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Admin role DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}
