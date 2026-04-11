import connectDB from '../lib/mongodb';
import UserProfile from '../models/UserProfile';
import Attendance from '../models/Attendance';
import Leave from '../models/Leave';
import Team from '../models/Team';
import OrgStructure from '../models/OrgStructure';
import Role from '../models/Role';

export async function seedDatabase() {
  try {
    console.log('🌱 Seeding local in-memory database with mock HR data...');

    // Clear all existing data
    await Promise.all([
      Attendance.deleteMany({}),
      Leave.deleteMany({}),
      UserProfile.deleteMany({}),
      Team.deleteMany({}),
      OrgStructure.deleteMany({}),
      Role.deleteMany({}),
    ]);
    console.log('🧹 Cleared existing data');

    // ----- MOCK ROLES -----
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
    console.log(`🛡️ Created ${roles.length} roles`);

    // ----- MOCK USERS (matching full schema) -----
    const users = [
      {
        clerkUserId: 'dev_user_admin_001',
        employeeId: 'EMP001',
        firstName: 'Mohit',
        lastName: 'Mohatkar',
        email: 'mohit@inovatrix.io',
        department: 'Human Resources',
        position: 'HR Manager',
        timezone: 'Asia/Kolkata',
        joinDate: new Date('2026-03-05'),
        isActive: true,
        isHRManager: true,
        permissions: ['*'],
        leaveBalance: {
          annual: 20, sick: 10, casual: 5,
          maternity: 0, paternity: 5,
          annual_alloted: 21, sick_alloted: 12, casual_alloted: 6,
          maternity_alloted: 90, paternity_alloted: 5,
        },
        emergencyContact: { name: 'Priya Kumar', relationship: 'Spouse', phone: '+91 98765 43210' },
      },
      {
        clerkUserId: 'mock_user_002',
        employeeId: 'EMP002',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@inovatrix.io',
        department: 'Engineering',
        position: 'Senior Engineer',
        timezone: 'America/Chicago',
        joinDate: new Date('2026-03-10'),
        isActive: true,
        leaveBalance: {
          annual: 18, sick: 8, casual: 5,
          maternity: 0, paternity: 0,
          annual_alloted: 21, sick_alloted: 12, casual_alloted: 6,
          maternity_alloted: 90, paternity_alloted: 5,
        },
        emergencyContact: { name: 'Bob Johnson', relationship: 'Spouse', phone: '+1 555-0103' },
      },
      {
        clerkUserId: 'mock_user_003',
        employeeId: 'EMP003',
        firstName: 'Marcus',
        lastName: 'Lee',
        email: 'marcus.lee@inovatrix.io',
        department: 'Product',
        position: 'Product Manager',
        timezone: 'America/New_York',
        joinDate: new Date('2026-03-02'),
        isActive: true,
        leaveBalance: {
          annual: 22, sick: 10, casual: 5,
          maternity: 0, paternity: 3,
          annual_alloted: 21, sick_alloted: 12, casual_alloted: 6,
          maternity_alloted: 90, paternity_alloted: 5,
        },
        emergencyContact: { name: 'Sara Lee', relationship: 'Sister', phone: '+1 555-0105' },
      },
      {
        clerkUserId: 'mock_user_004',
        employeeId: 'EMP004',
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya.patel@inovatrix.io',
        department: 'Design',
        position: 'UI/UX Designer',
        timezone: 'Asia/Kolkata',
        joinDate: new Date('2026-03-15'),
        isActive: true,
        leaveBalance: {
          annual: 15, sick: 10, casual: 5,
          maternity: 90, paternity: 0,
          annual_alloted: 21, sick_alloted: 12, casual_alloted: 6,
          maternity_alloted: 90, paternity_alloted: 5,
        },
        emergencyContact: { name: 'Raj Patel', relationship: 'Father', phone: '+91 98765 11111' },
      },
      {
        clerkUserId: 'mock_user_005',
        employeeId: 'EMP005',
        firstName: 'Tom',
        lastName: 'Harris',
        email: 'tom.harris@inovatrix.io',
        department: 'Engineering',
        position: 'DevOps Engineer',
        timezone: 'America/Los_Angeles',
        joinDate: new Date('2026-03-20'),
        isActive: true,
        leaveBalance: {
          annual: 16, sick: 9, casual: 5,
          maternity: 0, paternity: 0,
          annual_alloted: 21, sick_alloted: 12, casual_alloted: 6,
          maternity_alloted: 90, paternity_alloted: 5,
        },
        emergencyContact: { name: 'Linda Harris', relationship: 'Mother', phone: '+1 555-0109' },
      },
      {
        clerkUserId: 'mock_user_006',
        employeeId: 'EMP006',
        firstName: 'Rudra',
        lastName: 'Bambal',
        email: 'rudra.bambal@inovatrix.io',
        department: 'Engineering',
        position: 'Software Engineer',
        timezone: 'Asia/Kolkata',
        joinDate: new Date('2026-03-18'),
        isActive: true,
        leaveBalance: {
          annual: 14, sick: 10, casual: 6,
          maternity: 0, paternity: 5,
          annual_alloted: 21, sick_alloted: 12, casual_alloted: 6,
          maternity_alloted: 90, paternity_alloted: 5,
        },
        emergencyContact: { name: 'Suresh Bambal', relationship: 'Father', phone: '+91 98765 20001' },
      },
      {
        clerkUserId: 'mock_user_007',
        employeeId: 'EMP007',
        firstName: 'Viplav',
        lastName: 'Bhure',
        email: 'viplav.bhure@inovatrix.io',
        department: 'Engineering',
        position: 'Backend Engineer',
        timezone: 'Asia/Kolkata',
        joinDate: new Date('2026-03-25'),
        isActive: true,
        leaveBalance: {
          annual: 13, sick: 10, casual: 6,
          maternity: 0, paternity: 5,
          annual_alloted: 21, sick_alloted: 12, casual_alloted: 6,
          maternity_alloted: 90, paternity_alloted: 5,
        },
        emergencyContact: { name: 'Ramesh Bhure', relationship: 'Father', phone: '+91 98765 30002' },
      },
    ];

    const createdUsers = await UserProfile.insertMany(users);
    console.log(`👤 Created ${createdUsers.length} users`);

    // ----- MOCK TEAMS -----
    await Team.insertMany([
      {
        name: 'Engineering',
        description: 'Core product engineering team',
        department: 'Engineering',
        teamLeaderId: 'mock_user_002',
        members: ['mock_user_002', 'mock_user_005'],
        color: '#3B82F6',
      },
      {
        name: 'Product & Design',
        description: 'Product management and UX design',
        department: 'Product',
        teamLeaderId: 'mock_user_003',
        members: ['mock_user_003', 'mock_user_004'],
        color: '#8B5CF6',
      },
      {
        name: 'Human Resources',
        description: 'People operations and HR',
        department: 'Human Resources',
        teamLeaderId: 'dev_user_admin_001',
        members: ['dev_user_admin_001'],
        color: '#10B981',
      },
    ]);
    console.log('🏢 Created 3 teams');

    // ----- MOCK ATTENDANCE (date strings, matching schema) -----
    const today = new Date();
    const attendanceRecords: any[] = [];

    for (const user of createdUsers) {
      for (let d = 13; d >= 0; d--) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        const dateStr = date.toISOString().slice(0, 10); // e.g. "2026-04-10"
        const clockIn = new Date(date);
        clockIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 30), 0, 0);
        const clockOut = d === 0 ? undefined : new Date(clockIn.getTime() + (8 + Math.random()) * 3600000);
        const totalHours = clockOut ? parseFloat(((clockOut.getTime() - clockIn.getTime()) / 3600000).toFixed(2)) : 0;

        attendanceRecords.push({
          userId: user.clerkUserId,
          date: dateStr,
          clockIn,
          clockOut: clockOut || null,
          totalHours,
          status: d === 0 ? 'half-day' : totalHours >= 8 ? 'present' : 'half-day',
          notes: '',
          sessions: [{
            _id: `session_${user.clerkUserId}_${dateStr}`,
            clockIn,
            clockOut: clockOut || null,
            duration: totalHours,
            notes: '',
          }],
        });
      }
    }

    await Attendance.insertMany(attendanceRecords);
    console.log(`🕒 Created ${attendanceRecords.length} attendance records`);

    // ----- MOCK LEAVES -----
    const leaveTypes = ['annual', 'sick', 'casual'];
    const leaveStatuses = ['pending', 'approved', 'rejected'];
    const leaveRecords: any[] = [];

    for (const user of createdUsers) {
      for (let i = 0; i < 3; i++) {
        const start = new Date(today);
        // Ensure leave dates are not before 01/03/2026
        const minimumDate = new Date('2026-03-02').getTime();
        let daysToSubtract = Math.floor(Math.random() * 45) + i * 5;
        let intendedTime = start.getTime() - (daysToSubtract * 86400000);
        if (intendedTime < minimumDate) intendedTime = minimumDate + (Math.random() * 86400000 * 5);
        start.setTime(intendedTime);
        
        const end = new Date(start);
        end.setDate(end.getDate() + Math.floor(Math.random() * 3) + 1);
        const status = leaveStatuses[i % leaveStatuses.length];

        leaveRecords.push({
          userId: user.clerkUserId,
          leaveType: leaveTypes[i % leaveTypes.length],
          startDate: start,
          endDate: end,
          totalDays: Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000)),
          reason: ['Medical appointment', 'Family vacation', 'Personal errands', 'Rest and recovery'][i % 4],
          status,
          approvedBy: status === 'approved' ? 'dev_user_admin_001' : null,
          appliedAt: new Date(start.getTime() - 86400000 * 3),
        });
      }
    }

    await Leave.insertMany(leaveRecords);
    console.log(`📅 Created ${leaveRecords.length} leave records`);

    // ----- ORG STRUCTURE (departments) -----
    await OrgStructure.create({
      departments: [
        { name: 'Human Resources', description: 'People operations and HR management', positions: [], isActive: true },
        { name: 'Engineering', description: 'Software engineering and DevOps', positions: [], isActive: true },
        { name: 'Product', description: 'Product management and strategy', positions: [], isActive: true },
        { name: 'Design', description: 'UI/UX and visual design', positions: [], isActive: true },
        { name: 'Marketing', description: 'Marketing and communications', positions: [], isActive: true },
        { name: 'Sales', description: 'Sales and business development', positions: [], isActive: true },
        { name: 'Finance', description: 'Finance and accounting', positions: [], isActive: true },
        { name: 'Operations', description: 'Business operations and support', positions: [], isActive: true },
      ],
      seniorityLevels: [],
    });
    console.log('🏛️  Created org structure with 8 departments');

    console.log('\n🎉 Mock database seeded successfully!');
    console.log(`   • ${createdUsers.length} employees`);
    console.log(`   • 3 teams`);
    console.log(`   • ${attendanceRecords.length} attendance records`);
    console.log(`   • ${leaveRecords.length} leave requests`);
    console.log(`   • ${roles.length} roles`);
    console.log(`   • 8 departments in org structure`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

if (require.main === module) {
  seedDatabase().then(() => {
    console.log('Seeder finished.');
    process.exit(0);
  }).catch((err) => {
    console.error('Seeder failed:', err);
    process.exit(1);
  });
}
