import { NextRequest } from 'next/server';

const SESSION_COOKIE = 'admin_session';
const SESSION_VALUE = 'innovatrix_admin_authenticated';

/**
 * Check if the incoming request has a valid admin session cookie.
 * Use this in all /api/admin/* routes instead of checkHRManagerAccess.
 */
export function isAdminSessionValid(req: NextRequest): boolean {
  const cookie = req.cookies.get(SESSION_COOKIE);
  return cookie?.value === SESSION_VALUE;
}

/** Standard admin user object returned to API routes */
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
