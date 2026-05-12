/**
 * Auth wrapper — re-exports Clerk server helpers directly.
 * The dev bypass has been removed; this file exists for import compatibility.
 */
export { auth, currentUser } from '@clerk/nextjs/server';
