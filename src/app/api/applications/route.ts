export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { getCareersApplicationModel } from '@/models/careers/Application';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';


// Initialize S3 client  uses ap-south-1 (Mumbai) where the bucket was created
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'innovatrix-hr-assets-2026';
const BUCKET_REGION = process.env.AWS_S3_REGION || 'ap-south-1';;

export async function POST(request: NextRequest) {
  try {
    const Application = await getCareersApplicationModel();

    const formData = await request.formData();
    
    // Extract form data
    const jobId = formData.get('jobId') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const preferredName = formData.get('preferredName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const location = formData.get('location') as string;
    const education = JSON.parse(formData.get('education') as string);
    const experience = JSON.parse(formData.get('experience') as string);
    const resume = formData.get('resume') as File;

    // Validate required fields
    if (!jobId || !firstName || !lastName || !email || !education || !resume) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate resume file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (resume.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'Resume file size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Validate resume file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(resume.type)) {
      return NextResponse.json(
        { success: false, message: 'Only PDF, DOC, and DOCX files are allowed' },
        { status: 400 }
      );
    }

    // Validate education has at least one entry
    if (!Array.isArray(education) || education.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one education entry is required' },
        { status: 400 }
      );
    }

    // Upload resume to S3
    let resumeUrl = '';
    if (resume) {
      try {
        const fileExtension = resume.name.split('.').pop();
        const fileName = `resumes/${jobId}/${Date.now()}-${firstName}-${lastName}.${fileExtension}`;
        
        // Convert File to Buffer
        const bytes = await resume.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to S3
        const uploadCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileName,
          Body: buffer,
          ContentType: resume.type,
          Metadata: {
            'original-name': resume.name,
            'uploaded-by': email,
            'job-id': jobId
          }
        });

        await s3Client.send(uploadCommand);
        resumeUrl = `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${fileName}`;
      } catch (uploadError) {
        console.error('S3 upload error:', uploadError);
        return NextResponse.json(
          { success: false, message: 'Failed to upload resume' },
          { status: 500 }
        );
      }
    }

    // Create application in MongoDB
    const application = new Application({
      jobId,
      firstName,
      lastName,
      preferredName: preferredName || undefined,
      email,
      phone: phone || undefined,
      location: location || undefined,
      education,
      experience: experience || [],
      resumeUrl,
      status: 'pending',
      appliedDate: new Date(),
      isActive: true
    });

    await application.save();

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: application._id,
        resumeUrl
      }
    });

  } catch (error) {
    console.error('Application submission error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication
    const { checkHRManagerAccess } = await import('@/lib/adminAuth');
    const adminUser = await checkHRManagerAccess(request);
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const Application = await getCareersApplicationModel();
    
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10) || 20, 1), 100);
    
    const query: Record<string, unknown> = { isActive: true };
    
    if (jobId && jobId !== 'all') {
      query.jobId = jobId;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('jobId', 'title department')
        .sort({ appliedDate: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select('-__v')
        .lean(),
      Application.countDocuments(query),
    ]);
    
    return NextResponse.json({
      success: true,
      data: applications,
      total,
      page,
      pageSize,
    });
    
  } catch (error) {
    console.error('Fetch applications error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
