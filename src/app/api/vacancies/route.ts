export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import JobVacancy from '@/models/JobVacancy';

/* ── Public GET: anyone can fetch active vacancies ─────────────────── */
export async function GET() {
  try {
    await connectDB();
    const vacancies = await JobVacancy.find({ isActive: true })
      .select('title department location jobType description requirements salaryMin salaryMax salaryCurrency deadline createdAt')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: vacancies });
  } catch (error) {
    console.error('GET /api/vacancies error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vacancies' }, { status: 500 });
  }
}

/* ── Protected POST: admin only ────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const role = user.publicMetadata?.role as string;
    if (role !== 'admin' && role !== 'owner') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title, department, location, jobType, description,
      requirements, salaryMin, salaryMax, salaryCurrency, deadline,
    } = body;

    if (!title || !department || !location || !jobType || !description) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const vacancy = await JobVacancy.create({
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      jobType,
      description: description.trim(),
      requirements: (requirements as string[])?.filter(Boolean).map((r: string) => r.trim()) ?? [],
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      salaryCurrency: salaryCurrency || 'INR',
      deadline: deadline ? new Date(deadline) : undefined,
      isActive: true,
      postedBy: userId,
    });

    return NextResponse.json({ success: true, data: vacancy }, { status: 201 });
  } catch (error) {
    console.error('POST /api/vacancies error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create vacancy' }, { status: 500 });
  }
}
