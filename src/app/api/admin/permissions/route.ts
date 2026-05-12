import { NextRequest, NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';

// Get available permissions from roles
export async function GET(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // Connect to database
    await connectDB();

    // Get all roles with permissions
    const roles = await Role.find({ isActive: true }).lean();

    // Extract all unique permissions from all roles
    const allPermissions = new Set<string>();
    
    roles.forEach(role => {
      if (role.permissions) {
        role.permissions.forEach((permission: string) => {
          allPermissions.add(permission);
        });
      }
    });

    // Group permissions by resource type
    const groupedPermissions = new Map<string, string[]>();
    
    Array.from(allPermissions).forEach(permission => {
      const [resource] = permission.split(':');
      if (!groupedPermissions.has(resource)) {
        groupedPermissions.set(resource, []);
      }
      groupedPermissions.get(resource)!.push(permission);
    });

    // Convert to array format
    const permissions = Array.from(groupedPermissions.entries()).map(([resource, perms]) => ({
      category: resource,
      description: `${resource} management permissions`,
      permissions: perms.sort()
    })).sort((a, b) => a.category.localeCompare(b.category));

    return NextResponse.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Admin permissions GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}
