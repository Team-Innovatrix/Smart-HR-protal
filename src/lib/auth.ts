import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from './mongodb';
import UserProfile from '../models/UserProfile';
import Role from '../models/Role';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  permissions?: string[];
}

export type UserRole = 'employee' | 'manager' | 'hr';

/**
 * Get role information from MongoDB UserProfile
 * @param userId Clerk user ID
 * @returns Promise<{roleName: string, permissions: string[]}>
 */
async function getUserRoleFromMongoDB(userId: string): Promise<{roleName: string, permissions: string[]}> {
  try {
    await connectDB();
    
    const userProfile = await UserProfile.findOne({
      clerkUserId: userId,
      isActive: true
    });

    if (!userProfile) {
      console.log(`📋 ROLE [${userId}] No profile found → Default Employee`);
      return { roleName: 'Employee', permissions: [] };
    }

    let roleName = 'Employee';
    let permissions: string[] = [];

    if (userProfile.roleId) {
      // Get role from Role collection
      const role = await Role.findById(userProfile.roleId);
      if (role) {
        roleName = role.name;
        permissions = role.permissions || [];
        console.log(`📋 ROLE [${userId}] Retrieved: ${roleName} (${permissions.length} permissions)`);
      } else {
        console.log(`📋 ROLE [${userId}] Role ID ${userProfile.roleId} not found → Default Employee`);
      }
    } else {
      console.log(`📋 ROLE [${userId}] No roleId → Default Employee`);
    }

    // If no role assigned, use default employee permissions
    if (permissions.length === 0) {
      permissions = [
        'profile:read',
        'profile:write',
        'attendance:read',
        'leaves:read',
        'leaves:write'
      ];
      console.log(`📋 ROLE [${userId}] Using default employee permissions (${permissions.length})`);
    }

    return { roleName, permissions };
  } catch (error) {
    console.error(`📋 ROLE [${userId}] Error:`, error);
    return { roleName: 'Employee', permissions: [] };
  }
}

/**
 * Middleware to authenticate API requests using Clerk
 * Returns the authenticated user or throws an error
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser> {
  try {
    // Add request logging for debugging
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      console.log('🔐 Authenticating request:', {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        userAgent: request.headers.get('user-agent'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        authorization: request.headers.get('authorization') ? 'present' : 'missing',
        cookie: request.headers.get('cookie') ? 'present' : 'missing'
      });
    }

    // Check for Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('🔑 Bearer token found in Authorization header');
    }

    // Check for session cookies
    const sessionCookie = request.headers.get('cookie');
    if (sessionCookie && sessionCookie.includes('__session')) {
      console.log('🍪 Session cookie found');
    }

    const { userId } = await auth();
    
    if (!userId) {
      console.error('❌ Authentication failed: No userId from Clerk auth()');
      
      // Log additional context for debugging
      if (isProduction) {
        console.error('🔍 Auth failure context:', {
          hasAuthHeader: !!authHeader,
          hasSessionCookie: !!sessionCookie,
          userAgent: request.headers.get('user-agent'),
          origin: request.headers.get('origin'),
          referer: request.headers.get('referer')
        });
      }
      
      throw new Error('Unauthorized: User not authenticated');
    }
    
    // Get user details separately
    const user = await currentUser();
    
    if (!user) {
      console.error('❌ Authentication failed: No user from Clerk currentUser()');
      throw new Error('Unauthorized: User session invalid');
    }

    // Get role and permissions from MongoDB
    const { roleName, permissions } = await getUserRoleFromMongoDB(userId);

    // Enhanced permission logging
    const userEmail = user.emailAddresses[0]?.emailAddress || 'unknown';
    const isAdmin = roleName.toLowerCase().includes('hr') || roleName.toLowerCase().includes('admin');
    
    if (isProduction) {
      console.log(`🔐 AUTH [${userEmail}] Role: ${roleName} | Permissions: ${permissions.length} | Admin: ${isAdmin ? 'YES' : 'NO'}`);
      
      // Log key permissions for admin users
      if (isAdmin && permissions.length > 0) {
        const adminPerms = permissions.filter(p => p.includes('admin') || p.includes('users') || p.includes('settings'));
        if (adminPerms.length > 0) {
          console.log(`👑 ADMIN [${userEmail}] Key permissions: ${adminPerms.slice(0, 3).join(', ')}${adminPerms.length > 3 ? '...' : ''}`);
        }
      }
    }
    
    return {
      userId,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: roleName,
      permissions
    };
  } catch (error) {
    console.error('❌ Authentication error:', error);
    
    // Provide more specific error messages for production debugging
    if (process.env.NODE_ENV === 'production') {
      if (error instanceof Error) {
        if (error.message.includes('jwt')) {
          throw new Error('Unauthorized: Invalid JWT token');
        } else if (error.message.includes('expired')) {
          throw new Error('Unauthorized: Session expired');
        } else if (error.message.includes('network')) {
          throw new Error('Unauthorized: Network error during authentication');
        } else if (error.message.includes('clerk')) {
          throw new Error('Unauthorized: Clerk authentication service error');
        }
      }
    }
    
    throw new Error('Unauthorized: Authentication failed');
  }
}

/**
 * Derive the caller's role from MongoDB UserProfile
 * Returns role name and maps to UserRole type
 */
export async function getUserRole(): Promise<UserRole> {
  try {
    const { userId } = await auth();
    if (!userId) return 'employee';

    const { roleName } = await getUserRoleFromMongoDB(userId);
    
    // Map role names to UserRole type
    if (roleName.toLowerCase().includes('hr') || roleName.toLowerCase().includes('admin')) {
      return 'hr';
    } else if (roleName.toLowerCase().includes('manager')) {
      return 'manager';
    } else {
      return 'employee';
    }
  } catch (error) {
    console.error('❌ Error getting user role:', error);
    return 'employee';
  }
}

export function hasAnyRole(userRole: UserRole, allowed: UserRole[]): boolean {
  return allowed.includes(userRole);
}

/**
 * Get user permissions from MongoDB
 * @param userId Clerk user ID
 * @returns Promise<string[]> - Array of permissions
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const { permissions } = await getUserRoleFromMongoDB(userId);
    console.log(`🔑 PERMS [${userId}] Retrieved ${permissions.length} permissions`);
    return permissions;
  } catch (error) {
    console.error('❌ Error getting user permissions:', error);
    return [];
  }
}

/**
 * Check if user has specific permission
 * @param userId Clerk user ID
 * @param permission Permission to check
 * @returns Promise<boolean>
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId);
    const hasAccess = permissions.includes(permission) || permissions.includes('*');
    console.log(`🔑 PERM [${userId}] ${permission}: ${hasAccess ? 'GRANTED' : 'DENIED'}`);
    return hasAccess;
  } catch (error) {
    console.error('❌ Error checking permission:', error);
    return false;
  }
}

/**
 * Middleware to verify user can access specific data based on role
 * Employee: Can only access their own data
 * Manager: Can access self + direct reports
 * HR/Admin: Can access all data
 */
export async function verifyUserAccess(
  request: NextRequest,
  targetUserId: string,
  userRole?: UserRole
): Promise<boolean> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.error('❌ Access verification failed: No userId from auth()');
      return false;
    }
    
    const role = userRole || (await getUserRole());

    // Same user can always access self
    if (userId === targetUserId) {
      console.log(`🔓 ACCESS [${userId}] Self-access granted`);
      return true;
    }

    // HR/Admin roles can access all data
    if (role === 'hr') {
      console.log(`🔓 ACCESS [${userId}] HR/Admin access granted for ${targetUserId}`);
      return true;
    }

    // Managers can access their direct reports
    if (role === 'manager') {
      await connectDB();
      const targetProfile = await UserProfile.findOne({ clerkUserId: targetUserId }).select('managerId');
      if (targetProfile && targetProfile.managerId === userId) {
        console.log(`🔓 ACCESS [${userId}] Manager access granted for direct report ${targetUserId}`);
        return true;
      } else {
        console.log(`🔒 ACCESS [${userId}] Manager access denied - not direct report of ${targetUserId}`);
      }
    }

    // Employees can only access their own data (already checked above)
    console.log(`🔒 ACCESS [${userId}] Access denied for ${targetUserId} (Employee role)`);
    return false;
  } catch (error) {
    console.error('❌ Access verification error:', error);
    return false;
  }
}

/**
 * Helper function to create unauthorized response
 */
export function createUnauthorizedResponse(message: string = 'Unauthorized access') {
  return NextResponse.json(
    { success: false, message },
    { status: 401 }
  );
}

/**
 * Helper function to create forbidden response
 */
export function createForbiddenResponse(message: string = 'Access forbidden') {
  return NextResponse.json(
    { success: false, message },
    { status: 403 }
  );
}

/**
 * Helper function to create validation error response
 */
export function createValidationErrorResponse(message: string) {
  return NextResponse.json(
    { success: false, message },
    { status: 400 }
  );
}

/**
 * Wrapper function to ensure API routes always return JSON responses
 * This prevents HTML error pages from being returned when authentication fails
 */
export function withJsonErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('❌ API Error caught by wrapper:', error);
      
      // Always return JSON, never HTML
      if (error instanceof Error) {
        return NextResponse.json({
          success: false,
          message: error.message,
          error: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: false,
        message: 'An unexpected error occurred',
        error: 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  };
}
