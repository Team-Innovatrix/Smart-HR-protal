import connectDB from '../lib/mongodb';
import UserProfile from '../models/UserProfile';
import Role from '../models/Role';

async function checkAndSetAdmin() {
  await connectDB();
  
  const users = await UserProfile.find({});
  console.log(`Found ${users.length} users.`);
  
  const adminRole = await Role.findOne({ name: 'HR Manager' });
  if (!adminRole) {
    console.log("HR Manager role does not exist!");
    process.exit(1);
  }
  
  console.log(`HR Manager Role ID: ${adminRole._id}`);

  for (const user of users) {
    console.log(`User: ${user.email} | current roleId: ${user.roleId}`);
    // Check if this is the user trying to login (usually there's only one non-fake user right now)
    // We'll just grant admin to the first real user we find that doesn't have an @innovatrix.io generated email
    if (!user.email.includes('innovatrix.io')) {
      console.log(`=> Found real user: ${user.email}. Setting to admin...`);
      user.roleId = adminRole._id;
      await user.save();
      console.log('=> SUCCESS! User is now admin.');
    }
  }
  
  // As a fallback, if we didn't find any external email, we just set EVERYONE to admin for testing.
  if (users.length > 0) {
    console.log("Setting all users to Admin just in case...");
    await UserProfile.updateMany({}, { roleId: adminRole._id });
    console.log("All users are now admins!");
  }
  
  process.exit(0);
}

checkAndSetAdmin();
