export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import JobVacancy from '@/models/JobVacancy';

/*  helper: verify admin  */
async function verifyAdmin() {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) return null;
  const role = user.publicMetadata?.role as string;
  if (role !== 'admin' && role !== 'owner') return null;
  return userId;
}

/*  PATCH: edit fields or toggle isActive  */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    await connectDB();
    const vacancy = await JobVacancy.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!vacancy) {
      return NextResponse.json({ success: false, error: 'Vacancy not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: vacancy });
  } catch (error) {
    console.error('PATCH /api/vacancies/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update vacancy' }, { status: 500 });
  }
}

/*  DELETE: remove vacancy  */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();
    await JobVacancy.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Vacancy deleted' });
  } catch (error) {
    console.error('DELETE /api/vacancies/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete vacancy' }, { status: 500 });
  }
}
