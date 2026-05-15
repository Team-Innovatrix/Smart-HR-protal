import { NextResponse } from 'next/server';
import { generatePresignedUrl } from '@/lib/s3';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    // You can enforce authentication here if you only want logged-in HR/Employees to upload
    // For job applicants (public forms), you might bypass this check or verify a CSRF token
    // const { userId } = await auth();
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { fileName, fileType, folder } = body;

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'fileName and fileType are required' }, { status: 400 });
    }

    const { url, key, publicUrl } = await generatePresignedUrl(
      fileName, 
      fileType, 
      folder || 'general'
    );

    return NextResponse.json({ 
      success: true, 
      url, 
      key, 
      publicUrl 
    });
  } catch (error: any) {
    console.error('S3 Presigned URL Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
