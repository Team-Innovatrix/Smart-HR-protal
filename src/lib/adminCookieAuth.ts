import { NextRequest } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * Check if the incoming request comes from a Clerk user with an admin/owner role.
 */
export async function isAdminSessionValid(req: NextRequest): Promise<boolean> {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return false;
  }

  const role = user.publicMetadata?.role as string;
  return role === 'admin' || role === 'owner';
}

/** Standard admin user object returned to API routes (Deprecated, but kept for compatibility if needed) */
export const ADMIN_IDENTITY = {
  clerkUserId: 'admin',
  employeeId: 'ADM001',
  firstName: 'Admin',
  lastName: 'Innovatrix',
  email: 'admin@innovatrix.com',
  department: 'Executive',
  position: 'Administrator',
  isHRManager: true,
  permissions: ['*'],
};
