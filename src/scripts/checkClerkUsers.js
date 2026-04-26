require('dotenv').config({ path: '.env.local' });

async function checkUsers() {
  try {
    const res = await fetch('https://api.clerk.com/v1/users', {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` }
    });
    const users = await res.json();
    console.log(`Found ${users.length} users in Clerk.`);
    
    for (const user of users) {
      console.log('-----------------------------------');
      console.log(`User ID: ${user.id}`);
      console.log(`Email: ${user.email_addresses?.[0]?.email_address}`);
      console.log(`Public Metadata:`, JSON.stringify(user.public_metadata, null, 2));
      console.log(`Private Metadata:`, JSON.stringify(user.private_metadata, null, 2));
    }
  } catch (err) {
    console.error('Error fetching from Clerk:', err);
  }
}

checkUsers();
