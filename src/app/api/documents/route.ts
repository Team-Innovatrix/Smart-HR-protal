import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Document from '@/models/Document';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Fetch documents uploaded by this user AND public documents
    const documents = await Document.find({
      $or: [
        { uploadedBy: userId },
        { isPublic: true }
      ]
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, documents });
  } catch (error: any) {
    console.error('Fetch Documents Error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, category, fileType, fileSize, s3Url, s3Key, isPublic } = body;

    if (!title || !s3Url || !s3Key) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const document = new Document({
      title,
      category,
      fileType,
      fileSize,
      s3Url,
      s3Key,
      uploadedBy: userId,
      isPublic: isPublic || false,
    });

    await document.save();

    return NextResponse.json({ success: true, document });
  } catch (error: any) {
    console.error('Save Document Error:', error);
    return NextResponse.json({ error: 'Failed to save document metadata' }, { status: 500 });
  }
}
