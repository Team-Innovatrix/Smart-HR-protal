import connectDB from '../lib/mongodb';
import UserProfile from '../models/UserProfile';
import Team from '../models/Team';
import Attendance from '../models/Attendance';
import Leave from '../models/Leave';

async function cleanupFakeUsers() {
  try {
    console.log('🔄 Connecting to MongoDB HR database...');
    await connectDB();
    console.log('✅ Connected to MongoDB HR database');

    // Identify fake users (users with fake Clerk IDs)
    console.log('\n🧹 Identifying fake users...');
    const fakeUserIds = [
      'user-emp-001',
      'user-emp-002', 
      'user-mgr-001',
      'dev_user_admin_001'
    ];

    const fakeUsers = await UserProfile.find({ clerkUserId: { $in: fakeUserIds } });
    console.log(`Found ${fakeUsers.length} fake users to remove:`);
    
    fakeUsers.forEach(user => {
      console.log(`   • ${user.firstName} ${user.lastName} (${user.clerkUserId})`);
    });

    if (fakeUsers.length === 0) {
      console.log('✅ No fake users found to remove');
      return;
    }

    // Remove fake users and related data
    console.log('\n🗑️ Removing fake users and related data...');
    
    // Remove attendance records for fake users
    const fakeUserClerkIds = fakeUsers.map(u => u.clerkUserId);
    const attendanceResult = await Attendance.deleteMany({ userId: { $in: fakeUserClerkIds } });
    console.log(`   • Removed ${attendanceResult.deletedCount} attendance records`);

    // Remove leave records for fake users
    const leaveResult = await Leave.deleteMany({ userId: { $in: fakeUserClerkIds } });
    console.log(`   • Removed ${leaveResult.deletedCount} leave records`);

    // Remove teams that have fake users as members or leaders
    const teamsWithFakeUsers = await Team.find({
      $or: [
        { teamLeaderId: { $in: fakeUserClerkIds } },
        { members: { $in: fakeUserClerkIds } }
      ]
    });
    
    if (teamsWithFakeUsers.length > 0) {
      console.log(`   • Found ${teamsWithFakeUsers.length} teams with fake users`);
      for (const team of teamsWithFakeUsers) {
        console.log(`     - Removing team: ${team.name}`);
        await Team.findByIdAndDelete(team._id);
      }
    }

    // Finally, remove the fake user profiles
    const userResult = await UserProfile.deleteMany({ clerkUserId: { $in: fakeUserIds } });
    console.log(`   • Removed ${userResult.deletedCount} fake user profiles`);

    // Show remaining real users
    console.log('\n👥 Remaining real users:');
    const realUsers = await UserProfile.find({}).select('firstName lastName email clerkUserId department position');
    realUsers.forEach(user => {
      console.log(`   • ${user.firstName} ${user.lastName} (${user.email}) - ${user.position} in ${user.department}`);
    });

    console.log('\n✅ Cleanup completed successfully!');
    console.log(`   • Removed ${userResult.deletedCount} fake users`);
    console.log(`   • Removed ${attendanceResult.deletedCount} attendance records`);
    console.log(`   • Removed ${leaveResult.deletedCount} leave records`);
    console.log(`   • Removed ${teamsWithFakeUsers.length} teams with fake users`);
    console.log(`   • ${realUsers.length} real users remaining`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    process.exit(0);
  }
}

// Run the cleanup
cleanupFakeUsers();
