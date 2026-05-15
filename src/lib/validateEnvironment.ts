// Load environment variables from .env.local when running this script directly
import dotenv from 'dotenv';
import { env, validateEnvironment } from './config';

if (require.main === module) {
  try {
    dotenv.config({ path: '.env.local' });
  } catch (error) {
    console.warn('⚠️  Could not load .env.local file:', error);
  }
}

/**
 * Environment Validation Script
 * Run this during deployment to ensure all required environment variables are set
 */

export function logEnvironmentStatus(): boolean {
  console.log('🔍 Environment Validation Report');
  console.log('================================');
  
  console.log(`📋 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 Node Version: ${process.version}`);
  
  console.log('\n🔑 Required Environment Variables:');
  const requiredVars = [
    'MONGODB_URI',
    'CLERK_SECRET_KEY', 
    'CLERK_PUBLISHABLE_KEY'
  ];
  
  let allRequiredPresent = true;
  
  requiredVars.forEach(varName => {
    const value = env[varName as keyof typeof env];
    const exists = !!value;
    const status = exists ? '✅' : '❌';
    const displayValue = exists ? `${value?.toString().substring(0, 20)}...` : 'NOT SET';
    
    console.log(`   ${status} ${varName}: ${displayValue}`);
    
    if (!exists) {
      allRequiredPresent = false;
    }
  });
  
  console.log('\n🔧 Optional Environment Variables:');
  const optionalVars = [
    'MONGODB_DB_NAME',
    'GEMINI_API_KEY',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_S3_BUCKET',
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL'
  ];
  
  optionalVars.forEach(varName => {
    const value = env[varName as keyof typeof env];
    const exists = !!value;
    const status = exists ? '✅' : '⚠️';
    const displayValue = exists ? `${value?.toString().substring(0, 20)}...` : 'NOT SET';
    
    console.log(`   ${status} ${varName}: ${displayValue}`);
  });
  
  console.log('\n📊 MongoDB Connection Test:');
  try {
    // Test MongoDB URI format
    const mongoUri = env.MONGODB_URI;
    if (mongoUri) {
      const isValidFormat = mongoUri.startsWith('mongodb://') || mongoUri.startsWith('mongodb+srv://');
      console.log(`   ${isValidFormat ? '✅' : '❌'} URI Format: ${isValidFormat ? 'Valid' : 'Invalid'}`);
      
      if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
        console.log('   ⚠️  Warning: Using localhost MongoDB URI in production');
      }
    }
  } catch (error) {
    console.log('   ❌ MongoDB URI validation failed:', error);
  }
  
  console.log('\n🔐 Clerk Configuration:');
  try {
    const clerkSecret = env.CLERK_SECRET_KEY;
    const clerkPublishable = env.CLERK_PUBLISHABLE_KEY;
    
    if (clerkSecret) {
      const isTestKey = clerkSecret.startsWith('sk_test_');
      const isLiveKey = clerkSecret.startsWith('sk_live_');
      console.log(`   ${isTestKey || isLiveKey ? '✅' : '❌'} Secret Key Format: ${isTestKey ? 'Test' : isLiveKey ? 'Live' : 'Invalid'}`);
    }
    
    if (clerkPublishable) {
      const isTestKey = clerkPublishable.startsWith('pk_test_');
      const isLiveKey = clerkPublishable.startsWith('pk_live_');
      console.log(`   ${isTestKey || isLiveKey ? '✅' : '❌'} Publishable Key Format: ${isTestKey ? 'Test' : isLiveKey ? 'Live' : 'Invalid'}`);
    }
  } catch (error) {
    console.log('   ❌ Clerk configuration validation failed:', error);
  }
  
  console.log('\n📈 Summary:');
  if (allRequiredPresent) {
    console.log('   ✅ All required environment variables are set');
    console.log('   🚀 Ready for deployment');
  } else {
    console.log('   ❌ Missing required environment variables');
    console.log('   🛑 Deployment cannot proceed');
  }
  
  console.log('\n💡 Tips for Vercel Deployment:');
  console.log('   1. Set NODE_ENV=production in Vercel environment variables');
  console.log('   2. Ensure MONGODB_URI points to your production MongoDB instance');
  console.log('   3. Use production Clerk keys (sk_live_*, pk_live_*)');
  console.log('   4. Test database connectivity from Vercel\'s environment');
  
  return allRequiredPresent;
}

// Run validation if this file is executed directly
if (require.main === module) {
  try {
    validateEnvironment();
    logEnvironmentStatus();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
}

export default logEnvironmentStatus;
