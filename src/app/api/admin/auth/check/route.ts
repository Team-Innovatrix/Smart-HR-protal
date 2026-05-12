import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'admin_session';
const SESSION_VALUE = 'innovatrix_admin_authenticated';

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE);
  const isAuthenticated = cookie?.value === SESSION_VALUE;
  return NextResponse.json({ authenticated: isAuthenticated });
}
