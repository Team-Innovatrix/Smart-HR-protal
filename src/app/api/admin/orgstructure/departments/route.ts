import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OrgStructure from '@/models/OrgStructure';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';

export async function GET(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // Connect to database
    await connectDB();

    // Get departments from org structure
    const orgStructure = await OrgStructure.findOne({});
    
    if (!orgStructure) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const departments = orgStructure.departments
      .filter((dept: any) => dept.isActive)
      .map((dept: any) => ({
        _id: dept._id,
        name: dept.name,
        description: dept.description,
        positionCount: dept.positions.filter((pos: any) => pos.isActive).length
      }));

    return NextResponse.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Admin orgstructure departments GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    if (!isAdminSessionValid(req)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    // Connect to database
    await connectDB();

    const { name, description } = await req.json();

    // Get or create org structure
    let orgStructure = await OrgStructure.findOne({});
    if (!orgStructure) {
      orgStructure = new OrgStructure({
        seniorityLevels: [],
        departments: []
      });
    }

    // Check if department already exists
    const existingDept = orgStructure.departments.find((dept: any) => dept.name === name);
    if (existingDept) {
      return NextResponse.json(
        { error: 'Department already exists' },
        { status: 400 }
      );
    }

    // Add new department
    orgStructure.departments.push({
      name,
      description: description || '',
      positions: [],
      isActive: true
    });

    await orgStructure.save();

    return NextResponse.json({
      success: true,
      data: {
        _id: orgStructure.departments[orgStructure.departments.length - 1]._id,
        name,
        description: description || '',
        positionCount: 0
      }
    });
  } catch (error) {
    console.error('Admin orgstructure departments POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
