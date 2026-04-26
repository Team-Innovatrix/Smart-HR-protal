/**
 * Authentication Bypass
 *
 * When NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set (dev OR production),
 * this module provides a mock authenticated admin user so the app works
 * without a real Clerk account configured.
 */

export const DEV_BYPASS_ENABLED =
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const DEV_USER = {
  userId: 'dev_user_admin_001',
  email: 'mohit@innovatrix.io',
  firstName: 'Mohit',
  lastName: 'Mohatkar',
  role: 'Chief Executive Officer',
  permissions: ['*'], // All permissions in dev
};
