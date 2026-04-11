import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OrgStructure from '@/models/OrgStructure';
import { checkHRManagerAccess } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  // Common fallback positions to use when no OrgStructure exists in DB
  const FALLBACK_POSITIONS = [
    { _id: 'p1', name: 'Software Engineer', department: 'Engineering', seniorityLevel: 'Mid' },
    { _id: 'p2', name: 'Senior Software Engineer', department: 'Engineering', seniorityLevel: 'Senior' },
    { _id: 'p3', name: 'Lead Engineer', department: 'Engineering', seniorityLevel: 'Lead' },
    { _id: 'p4', name: 'Backend Engineer', department: 'Engineering', seniorityLevel: 'Mid' },
    { _id: 'p5', name: 'Frontend Engineer', department: 'Engineering', seniorityLevel: 'Mid' },
    { _id: 'p6', name: 'DevOps Engineer', department: 'Engineering', seniorityLevel: 'Mid' },
    { _id: 'p7', name: 'Product Manager', department: 'Product', seniorityLevel: 'Senior' },
    { _id: 'p8', name: 'UI/UX Designer', department: 'Design', seniorityLevel: 'Mid' },
    { _id: 'p9', name: 'HR Manager', department: 'Human Resources', seniorityLevel: 'Senior' },
    { _id: 'p10', name: 'HR Executive', department: 'Human Resources', seniorityLevel: 'Junior' },
    { _id: 'p11', name: 'Sales Executive', department: 'Sales', seniorityLevel: 'Mid' },
    { _id: 'p12', name: 'Sales Manager', department: 'Sales', seniorityLevel: 'Senior' },
    { _id: 'p13', name: 'Marketing Executive', department: 'Marketing', seniorityLevel: 'Mid' },
    { _id: 'p14', name: 'Marketing Manager', department: 'Marketing', seniorityLevel: 'Senior' },
    { _id: 'p15', name: 'Finance Executive', department: 'Finance', seniorityLevel: 'Mid' },
    { _id: 'p16', name: 'Accountant', department: 'Finance', seniorityLevel: 'Junior' },
    { _id: 'p17', name: 'Operations Manager', department: 'Operations', seniorityLevel: 'Senior' },
    { _id: 'p18', name: 'Business Analyst', department: 'Operations', seniorityLevel: 'Mid' },
    { _id: 'p19', name: 'QA Engineer', department: 'Engineering', seniorityLevel: 'Mid' },
    { _id: 'p20', name: 'Data Analyst', department: 'Engineering', seniorityLevel: 'Mid' },
    { _id: 'p21', name: 'Intern', department: 'Engineering', seniorityLevel: 'Junior' },
    { _id: 'p22', name: 'Chief Technology Officer', department: 'Engineering', seniorityLevel: 'Executive' },
    { _id: 'p23', name: 'Chief Executive Officer', department: 'Management', seniorityLevel: 'Executive' },
  ];

  try {
    // Check if user has HR Manager access
    const adminUser = await checkHRManagerAccess(req);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Access denied. HR Manager privileges required.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    // Get all positions from all departments
    const orgStructure = await OrgStructure.findOne({});
    
    if (!orgStructure || orgStructure.departments?.length === 0) {
      // Return fallback positions when no org structure exists
      return NextResponse.json({
        success: true,
        data: FALLBACK_POSITIONS
      });
    }

    const allPositions = orgStructure.departments
      .filter((dept: any) => dept.isActive)
      .flatMap((dept: any) => 
        dept.positions
          .filter((pos: any) => pos.isActive)
          .map((pos: any) => ({
            _id: pos._id,
            name: pos.name,
            description: pos.description,
            seniorityLevel: pos.seniorityLevel,
            department: dept.name,
            departmentId: dept._id
          }))
      );

    // If DB has org structure but no positions, fall back to defaults
    if (allPositions.length === 0) {
      return NextResponse.json({
        success: true,
        data: FALLBACK_POSITIONS
      });
    }

    return NextResponse.json({
      success: true,
      data: allPositions
    });
  } catch (error) {
    console.error('Admin orgstructure positions GET error:', error);
    // On any error, return fallback positions so the UI stays functional
    return NextResponse.json({
      success: true,
      data: FALLBACK_POSITIONS
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    const adminUser = await checkHRManagerAccess(req);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Access denied. HR Manager privileges required.' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    const { name, description, seniorityLevel, departmentId } = await req.json();

    // Get org structure
    const orgStructure = await OrgStructure.findOne({});
    if (!orgStructure) {
      return NextResponse.json(
        { error: 'Organization structure not found' },
        { status: 404 }
      );
    }

    // Find department
    const department = orgStructure.departments.find((dept: any) => dept._id.toString() === departmentId);
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check if position already exists in this department
    const existingPos = department.positions.find((pos: any) => pos.name === name);
    if (existingPos) {
      return NextResponse.json(
        { error: 'Position already exists in this department' },
        { status: 400 }
      );
    }

    // Add new position
    department.positions.push({
      name,
      description: description || '',
      seniorityLevel: seniorityLevel || 'Mid',
      isActive: true
    });

    await orgStructure.save();

    const newPosition = department.positions[department.positions.length - 1];

    return NextResponse.json({
      success: true,
      data: {
        _id: newPosition._id,
        name: newPosition.name,
        description: newPosition.description,
        seniorityLevel: newPosition.seniorityLevel,
        department: department.name,
        departmentId: department._id
      }
    });
  } catch (error) {
    console.error('Admin orgstructure positions POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
