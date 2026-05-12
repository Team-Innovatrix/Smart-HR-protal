import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OrgStructure from '@/models/OrgStructure';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';

export async function GET(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!await isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // Connect to database
    await connectDB();

    // Get org structure
    const orgStructure = await OrgStructure.findOne({});
    
    if (!orgStructure) {
      return NextResponse.json({
        success: true,
        data: {
          seniorityLevels: [],
          departments: []
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        seniorityLevels: orgStructure.seniorityLevels.filter((level: any) => level.isActive),
        departments: orgStructure.departments.filter((dept: any) => dept.isActive)
      }
    });
  } catch (error) {
    console.error('Admin orgstructure GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!await isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // Connect to database
    await connectDB();

    const { seniorityLevels, departments } = await req.json();

    // Update or create org structure
    const orgStructure = await OrgStructure.findOneAndUpdate(
      {},
      {
        seniorityLevels: seniorityLevels || [],
        departments: departments || []
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      data: orgStructure
    });
  } catch (error) {
    console.error('Admin orgstructure POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
