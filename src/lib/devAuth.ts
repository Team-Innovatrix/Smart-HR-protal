/**
 * Authentication Bypass
 *
 * DEV_BYPASS is permanently disabled. The app always uses real Clerk auth.
 * This file is kept for backward compatibility with existing imports.
 */

export const DEV_BYPASS_ENABLED = false;

export const DEV_USER = {
  userId: 'dev_user_admin_001',
  email: 'mohit@innovatrix.io',
  firstName: 'Mohit',
  lastName: 'Mohatkar',
  role: 'Chief Executive Officer',
  permissions: ['*'],
};
