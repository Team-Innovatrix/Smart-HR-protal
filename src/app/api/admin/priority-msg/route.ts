import { NextRequest, NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import connectDB from '@/lib/mongodb';
import PriorityMessage from '@/models/PriorityMessage';
import Notification from '@/models/Notification';
import UserProfile from '@/models/UserProfile';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isAdminSessionValid(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied. Admin required.' }, { status: 403 });
    }

    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { message } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await connectDB();

    // Invalidate/delete any previous priority messages to keep only the latest active one
    await PriorityMessage.deleteMany({});

    // Expire in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const priorityMsg = new PriorityMessage({
      message: message.trim(),
      senderName: `${user.firstName} ${user.lastName}`,
      senderId: userId,
      expiresAt
    });

    await priorityMsg.save();

    // Send notifications to everyone
    const allUsers = await UserProfile.find({ isActive: true }).select('clerkUserId');
    const notifications = allUsers.map(u => ({
      recipientId: u.clerkUserId,
      senderId: userId,
      type: 'system',
      title: '🚨 Priority Announcement',
      message: message.trim(),
      priority: 'urgent',
      expiresAt
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return NextResponse.json({ success: true, message: 'Priority message sent successfully' });
  } catch (error) {
    console.error('Priority Msg POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
