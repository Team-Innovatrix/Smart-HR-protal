import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Hardcoded admin credentials
const ADMIN_EMAIL = 'admin@innovatrix.com';
const ADMIN_PASSWORD = 'mohit123';
const SESSION_COOKIE = 'admin_session';
const SESSION_VALUE = 'innovatrix_admin_authenticated';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (
      email?.trim().toLowerCase() !== ADMIN_EMAIL ||
      password !== ADMIN_PASSWORD
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Set HTTP-only session cookie (7 days)
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
  }
}
