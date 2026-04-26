import connectDB from '../lib/mongodb';
import UserProfile from '../models/UserProfile';
import Attendance from '../models/Attendance';
import Leave from '../models/Leave';
import Team from '../models/Team';
import OrgStructure from '../models/OrgStructure';
import Role from '../models/Role';

export async function wipeAndInitialize() {
  try {
    console.log('🔄 Connecting to MongoDB Cluster...');
    await connectDB();
    console.log('✅ Connected. Wiping ALL existing data...');

    // Clear ALL existing data — fresh start
    await Promise.all([
      Attendance.deleteMany({}),
      Leave.deleteMany({}),
      UserProfile.deleteMany({}),
      Team.deleteMany({}),
      OrgStructure.deleteMany({}),
      Role.deleteMany({}),
    ]);
    console.log('🧹 All data cleared — clean slate achieved.');

    // ----- ROLES -----
    const roles = await Role.insertMany([
      {
        name: 'Employee',
        description: 'Standard employee access with basic permissions',
        permissions: ['view:own_profile', 'view:own_leave', 'view:own_attendance'],
        isSystem: true,
        isActive: true,
        createdBy: 'system'
      },
      {
        name: 'HR Manager',
        description: 'Full access to Human Resources features',
        permissions: ['manage:users', 'manage:leaves', 'manage:attendance', 'view:analytics', 'manage:teams'],
        isSystem: true,
        isActive: true,
        createdBy: 'system'
      },
      {
        name: 'Admin',
        description: 'Full system administration access',
        permissions: ['*'],
        isSystem: true,
        isActive: true,
        createdBy: 'system'
      }
    ]);
    console.log(`🛡️  Created ${roles.length} core roles`);

    // ----- ORG STRUCTURE (departments ready for future hires) -----
    await OrgStructure.create({
      departments: [
        { name: 'Executive', description: 'Executive leadership and company strategy', positions: [], isActive: true },
        { name: 'Engineering', description: 'Software engineering and DevOps', positions: [], isActive: true },
        { name: 'Product', description: 'Product management and strategy', positions: [], isActive: true },
        { name: 'Design', description: 'UI/UX and visual design', positions: [], isActive: true },
        { name: 'Marketing', description: 'Marketing and communications', positions: [], isActive: true },
        { name: 'Sales', description: 'Sales and business development', positions: [], isActive: true },
        { name: 'Finance', description: 'Finance and accounting', positions: [], isActive: true },
        { name: 'Operations', description: 'Business operations and support', positions: [], isActive: true },
        { name: 'Human Resources', description: 'People operations and talent', positions: [], isActive: true },
      ],
      seniorityLevels: [],
    });
    console.log('🏛️  Created core organization structure with 9 departments');

    console.log('\n🎉 Fresh start successful!');
    console.log('   • 0 generated employees (You will be the only one when you sign in!)');
    console.log('   • 0 attendance records');
    console.log('   • 0 leave requests');
    console.log('   • 0 teams');
    console.log('   • Core roles and departments initialized successfully.');

  } catch (error) {
    console.error('❌ Error initializing fresh start:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

wipeAndInitialize();
