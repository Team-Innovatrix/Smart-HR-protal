import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import UserProfile from '@/models/UserProfile';
import Role from '@/models/Role';
import connectDB from './mongodb';
import { DEV_BYPASS_ENABLED, DEV_USER } from './devAuth';

export interface AdminUser {
  clerkUserId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  isHRManager: boolean;
  permissions: string[];
}

/**
 * Get role permissions for a user
 * @param roleId string role ID
 * @returns Promise<string[]> - Array of permissions
 */
async function getRolePermissions(roleId: string): Promise<string[]> {
  try {
    const role = await Role.findById(roleId);
    return role?.permissions || [];
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return [];
  }
}

/**
 * Get default employee permissions (minimal permissions)
 * @returns string[] - Array of default employee permissions
 */
function getDefaultEmployeePermissions(): string[] {
  return [
    'profile:read',
    'profile:write',
    'attendance:read',
    'leaves:read',
    'leaves:write'
  ];
}

/**
 * Check if the current user has admin access based on role permissions
 * @param req NextRequest object
 * @returns Promise<AdminUser | null> - Returns admin user data or null if not authorized
 */
export async function checkHRManagerAccess(req: NextRequest): Promise<AdminUser | null> {
  try {
    if (DEV_BYPASS_ENABLED) {
      return {
        clerkUserId: DEV_USER.userId,
        employeeId: 'EMP000',
        firstName: DEV_USER.firstName,
        lastName: DEV_USER.lastName,
        email: DEV_USER.email,
        department: 'HR',
        position: 'HR Manager',
        isHRManager: true,
        permissions: ['admin:all', '*']
      };
    }

    // Get Clerk user ID
    const { userId } = await auth();
    if (!userId) {
      return null;
    }

    // FAILSAFE: Always grant Mohit full admin access to prevent lockout during DB wipes
    if (userId === 'user_3Ct0FoCvLcRHnOXgp8fiwr62Dj1') {
      return {
        clerkUserId: userId,
        employeeId: 'EMP001',
        firstName: 'Mohit',
        lastName: 'Mohatkar',
        email: 'mohit@innovatrix.io',
        department: 'Executive',
        position: 'CEO',
        isHRManager: true,
        permissions: ['*']
      } as AdminUser;
    }

    // Connect to database
    await connectDB();

    // Find user profile
    const userProfile = await UserProfile.findOne({
      clerkUserId: userId,
      isActive: true
    });

    if (!userProfile) {
      return null;
    }

    // Get user permissions based on role
    let userPermissions: string[] = [];
    
    if (userProfile.roleId) {
      // Get permissions from role
      userPermissions = await getRolePermissions(userProfile.roleId);
    } else {
      // Use default employee permissions if no role assigned
      userPermissions = getDefaultEmployeePermissions();
    }

    // Check if user has any admin permission
    const hasAdminPermission = userPermissions.some(permission => 
      permission === '*' ||
      permission.startsWith('admin:') || 
      permission.includes('admin') ||
      permission === 'manage:users' // Added this because HR Manager uses this permission
    );

    if (!hasAdminPermission) {
      return null;
    }

    // Update last admin access timestamp
    await UserProfile.findByIdAndUpdate(userProfile._id, {
      lastAdminAccess: new Date()
    });

    return {
      clerkUserId: userProfile.clerkUserId,
      employeeId: userProfile.employeeId,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      email: userProfile.email,
      department: userProfile.department,
      position: userProfile.position,
      isHRManager: hasAdminPermission, // Set based on admin permissions
      permissions: userPermissions
    };
  } catch (error) {
    console.error('Error checking admin access:', error);
    return null;
  }
}

/**
 * Middleware function to protect admin routes
 * @param req NextRequest object
 * @returns Promise<NextResponse | null> - Returns redirect response or null if authorized
 */
export async function protectAdminRoute(req: NextRequest): Promise<NextResponse | null> {
  const adminUser = await checkHRManagerAccess(req);
  
  if (!adminUser) {
    // Redirect to access denied page
    const accessDeniedUrl = new URL('/admin/access-denied', req.url);
    return NextResponse.redirect(accessDeniedUrl);
  }

  return null; // User is authorized
}

/**
 * Check if user has specific permission
 * @param permissions string array of user permissions
 * @param requiredPermission string permission to check
 * @returns boolean
 */
export function hasPermission(permissions: string[], requiredPermission: string): boolean {
  return permissions.includes(requiredPermission) || permissions.includes('*');
}

/**
 * Get default HR Manager permissions
 * @returns string array of default permissions
 */
export function getDefaultHRManagerPermissions(): string[] {
  return [
    'users:read',
    'users:write',
    'users:delete',
    'leaves:read',
    'leaves:write',
    'leaves:approve',
    'attendance:read',
    'attendance:write',
    'teams:read',
    'teams:write',
    'teams:delete',
    'reports:read',
    'reports:export',
    'settings:read',
    'settings:write'
  ];
}
