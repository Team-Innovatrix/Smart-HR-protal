import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PriorityMessage from '@/models/PriorityMessage';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get the most recent unexpired priority message
    const msg = await PriorityMessage.findOne({
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!msg) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: msg });
  } catch (error) {
    console.error('Priority Msg GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
