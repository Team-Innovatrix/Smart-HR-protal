import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';
import Role from '@/models/Role';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await connectDB();

    // Check if it's the admin CEO backdoor
    if ((email === 'mohit@innovatrix.io' || email === 'mohit@inovatrix.io') && password === 'mohit 123') {
      const adminUser = await UserProfile.findOne({ email: 'mohit@innovatrix.io' });
      if (!adminUser) {
        return NextResponse.json({ error: 'Admin user not found in database. Run seed script first.' }, { status: 404 });
      }
      
      const payload = {
        id: adminUser.clerkUserId,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        fullName: `${adminUser.firstName} ${adminUser.lastName}`,
        emailAddresses: [{ emailAddress: adminUser.email, id: 'dev_email' }],
        primaryEmailAddressId: 'dev_email',
        imageUrl: '',
        username: 'dev-admin',
        publicMetadata: { role: 'Admin', department: adminUser.department, position: adminUser.position },
      };
      return NextResponse.json({ success: true, user: payload });
    }

    // Otherwise, check all normal employees (password must be test123)
    if (password !== 'test123') {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    // Find the employee in the database
    const employee = await UserProfile.findOne({ email: email.toLowerCase() });
    
    if (!employee) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Determine the user's role from Role id if exists
    let roleName = 'Employee';
    if (employee.roleId) {
       const roleDoc = await Role.findById(employee.roleId);
       if (roleDoc) roleName = roleDoc.name;
    } else if (employee.isHRManager) {
       roleName = 'HR Manager';
    }

    const payload = {
      id: employee.clerkUserId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: `${employee.firstName} ${employee.lastName}`,
      emailAddresses: [{ emailAddress: employee.email, id: `dev_email_${employee.employeeId}` }],
      primaryEmailAddressId: `dev_email_${employee.employeeId}`,
      imageUrl: '',
      username: `${employee.firstName.toLowerCase()}-${employee.lastName.toLowerCase()}`,
      publicMetadata: { 
        role: roleName, 
        employeeId: employee.employeeId, 
        department: employee.department, 
        position: employee.position 
      },
    };

    return NextResponse.json({ success: true, user: payload });
  } catch (error) {
    console.error('Dev Login Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
