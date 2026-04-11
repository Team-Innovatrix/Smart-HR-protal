import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import ChatMessage from '../../../models/ChatMessage';
import UserProfile from '../../../models/UserProfile';

// GET /api/chat - Get messages for a user or group
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Current user
    const otherId = searchParams.get('otherId'); // Other user (for 1:1)
    const groupId = searchParams.get('groupId'); // Group (for group chat)

    if (groupId) {
      const messages = await ChatMessage.find({ groupId })
        .sort({ createdAt: 1 })
        .limit(100);
      return NextResponse.json({ success: true, data: messages });
    }

    if (userId && otherId) {
      const messages = await ChatMessage.find({
        $or: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId }
        ]
      })
      .sort({ createdAt: 1 })
      .limit(100);
      return NextResponse.json({ success: true, data: messages });
    }

    // If no specific conversation, maybe list recent chats? 
    // For now, return empty or bad request
    return NextResponse.json({ success: false, message: 'Invalid query' }, { status: 400 });

  } catch (error) {
    console.error('Chat API GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/chat - Send a message
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { senderId, receiverId, groupId, content, type } = body;

    if (!senderId || (!receiverId && !groupId) || !content) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    const newMessage = await ChatMessage.create({
      senderId,
      receiverId,
      groupId,
      content,
      type: type || 'text'
    });

    return NextResponse.json({ success: true, data: newMessage });

  } catch (error) {
    console.error('Chat API POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
