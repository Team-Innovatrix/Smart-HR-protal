import { currentUser, clerkClient } from '@clerk/nextjs/server'
import connectDB from './mongodb'
import UserProfile, { IUserProfileModel } from '../models/UserProfile'

export interface ProfileSyncResult {
  success: boolean
  message: string
  data?: any
  isNew?: boolean
}

export class ProfileSyncService {
  /**
   * Update Clerk user with MongoDB data
   */
  private static async updateClerkUser(
    clerkUserId: string, 
    firstName: string, 
    lastName: string
  ): Promise<void> {
    try {
      const clerk = await clerkClient()
      await clerk.users.updateUser(clerkUserId, {
        firstName: firstName || undefined,
        lastName: lastName || undefined
      })
      console.log(`✅ Updated Clerk user ${clerkUserId} with names: ${firstName} ${lastName}`)
    } catch (error) {
      console.error(`❌ Failed to update Clerk user ${clerkUserId}:`, error)
      throw error
    }
  }

  /**
   * Automatically sync user profile from Clerk to MongoDB
   * This should be called after every login or when profile data is needed
   */
  static async syncUserProfile(): Promise<ProfileSyncResult> {
    const syncId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    console.log(`🔄 [${syncId}] Profile sync started`, {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    });

    try {
      // Get current user from Clerk
      console.log(`🔍 [${syncId}] Fetching user from Clerk...`);
      const user = await currentUser()
      
      if (!user) {
        console.error(`❌ [${syncId}] User not found in Clerk`);
        return {
          success: false,
          message: 'User not found in Clerk'
        }
      }

      console.log(`✅ [${syncId}] Clerk user retrieved`, {
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        hasPublicMetadata: !!user.publicMetadata,
        hasPrivateMetadata: !!user.privateMetadata
      });

      // Connect to MongoDB
      console.log(`🔌 [${syncId}] Connecting to MongoDB...`);
      await connectDB()
      console.log(`✅ [${syncId}] MongoDB connected successfully`);

      const email = user.emailAddresses[0]?.emailAddress || ''
      const firstName = user.firstName || ''
      const lastName = user.lastName || ''
      
      // Extract organization from user metadata
      console.log(`🔍 [${syncId}] Extracting organization from metadata...`);
      let organization = ''
      if (user.publicMetadata && typeof user.publicMetadata === 'object') {
        const metadata = user.publicMetadata as Record<string, unknown>;
        organization = (metadata?.organization as string) || 
                     (metadata?.organizationName as string) || 
                     (metadata?.company as string) || ''
      }
      
      // Also check private metadata if available
      if (!organization && user.privateMetadata && typeof user.privateMetadata === 'object') {
        const metadata = user.privateMetadata as Record<string, unknown>;
        organization = (metadata?.organization as string) || 
                     (metadata?.organizationName as string) || 
                     (metadata?.company as string) || ''
      }

      console.log(`📊 [${syncId}] Extracted user data`, {
        email,
        firstName,
        lastName,
        organization,
        metadataKeys: user.publicMetadata ? Object.keys(user.publicMetadata) : []
      });

      // Check if profile exists
      console.log(`🔍 [${syncId}] Checking for existing profile...`);
      let userProfile = await UserProfile.findOne({ clerkUserId: user.id })
      let isNew = false
      
      if (userProfile) {
        console.log(`✅ [${syncId}] Existing profile found`, {
          profileId: userProfile._id,
          employeeId: userProfile.employeeId,
          currentFirstName: userProfile.firstName,
          currentLastName: userProfile.lastName,
          currentEmail: userProfile.email,
          currentOrganization: userProfile.organization
        });

        // New Logic Flow for Name Synchronization
        const mongoFirstName = userProfile.firstName || ''
        const mongoLastName = userProfile.lastName || ''
        const clerkFirstName = firstName || ''
        const clerkLastName = lastName || ''
        
        console.log(`📝 [${syncId}] Name sync analysis`, {
          mongoFirstName,
          mongoLastName,
          clerkFirstName,
          clerkLastName
        });

        const updatedFields: Partial<{
          firstName: string;
          lastName: string;
          email: string;
          organization: string;
          roleId: any;
        }> = {}
        let clerkNeedsUpdate = false
        let clerkUpdateData = { firstName: '', lastName: '' }

        // Scenario 1: MongoDB has blank names, Clerk has names
        // MongoDB gets updated with Clerk names, Clerk stays unchanged
        if ((!mongoFirstName || !mongoLastName) && (clerkFirstName || clerkLastName)) {
          if (clerkFirstName && !mongoFirstName) {
            updatedFields.firstName = clerkFirstName
          }
          if (clerkLastName && !mongoLastName) {
            updatedFields.lastName = clerkLastName
          }
          console.log(`📝 [${syncId}] Scenario 1: Updating MongoDB with Clerk names`);
        }
        // Scenario 2: MongoDB has names, Clerk has blank names
        // MongoDB stays unchanged, Clerk gets updated with MongoDB names
        else if ((mongoFirstName || mongoLastName) && (!clerkFirstName || !clerkLastName)) {
          clerkNeedsUpdate = true
          clerkUpdateData = {
            firstName: mongoFirstName,
            lastName: mongoLastName
          }
          console.log(`📝 [${syncId}] Scenario 2: Updating Clerk with MongoDB names`);
        }
        // Scenario 3: Both have names
        // MongoDB stays unchanged (prioritizes existing data), Clerk gets updated with MongoDB names
        else if ((mongoFirstName || mongoLastName) && (clerkFirstName || clerkLastName)) {
          clerkNeedsUpdate = true
          clerkUpdateData = {
            firstName: mongoFirstName,
            lastName: mongoLastName
          }
          console.log(`📝 [${syncId}] Scenario 3: Updating Clerk with MongoDB names (prioritizing existing data)`);
        }
        // Scenario 4: Both are blank
        // No updates (both stay blank)
        else {
          console.log(`📝 [${syncId}] Scenario 4: Both blank, no updates needed`);
        }

        // Extract role from metadata
        const clerkRole = (user.publicMetadata?.role as string)?.toLowerCase() || '';
        let targetRoleId = userProfile.roleId;

        if (clerkRole === 'admin' || clerkRole === 'hr manager' || clerkRole === 'ceo') {
          // Find the HR Manager role
          const Role = require('../models/Role').default;
          const adminRole = await Role.findOne({ name: 'HR Manager' });
          if (adminRole && String(targetRoleId) !== String(adminRole._id)) {
            targetRoleId = adminRole._id;
          }
        }



        // Handle email and organization updates
        if (email && email !== userProfile.email) {
          updatedFields.email = email
        }
        if (organization && organization !== userProfile.organization) {
          updatedFields.organization = organization
        }
        if (targetRoleId && String(targetRoleId) !== String(userProfile.roleId)) {
          updatedFields.roleId = targetRoleId;
        }

        console.log(`📝 [${syncId}] Update analysis`, {
          hasFirstNameChange: !!updatedFields.firstName,
          hasLastNameChange: !!updatedFields.lastName,
          hasEmailChange: !!updatedFields.email,
          hasOrganizationChange: !!updatedFields.organization,
          clerkNeedsUpdate,
          totalChanges: Object.keys(updatedFields).length
        });

        // Update MongoDB if there are changes
        if (Object.keys(updatedFields).length > 0) {
          Object.assign(userProfile, updatedFields)
          await userProfile.save()
          console.log(`🔄 [${syncId}] MongoDB profile updated successfully`, {
            updatedFields,
            duration: Date.now() - startTime
          });
        }

        // Update Clerk if needed
        if (clerkNeedsUpdate) {
          try {
            await this.updateClerkUser(user.id, clerkUpdateData.firstName, clerkUpdateData.lastName)
            console.log(`🔄 [${syncId}] Clerk user updated successfully`);
          } catch (clerkError) {
            console.error(`❌ [${syncId}] Failed to update Clerk user:`, clerkError)
            // Don't fail the entire sync if Clerk update fails
          }
        }

        if (Object.keys(updatedFields).length === 0 && !clerkNeedsUpdate) {
          console.log(`✅ [${syncId}] Profile is already up to date`);
        }
      } else {
        console.log(`🆕 [${syncId}] Creating new profile...`);
        
        // For new profiles, use Clerk data (Scenario 1 logic)
        const department = 'General'
        const position = 'Employee'
        const joinDate = new Date()
        const employeeId = `EMP-${user.id.slice(-6).toUpperCase()}`
        
        // Get default leave balance from configuration
        const defaultLeaveBalance = await (UserProfile as IUserProfileModel).getDefaultLeaveBalance();

        // Extract role from metadata for new profiles
        const clerkRole = (user.publicMetadata?.role as string)?.toLowerCase() || '';
        let targetRoleId = undefined;

        if (clerkRole === 'admin' || clerkRole === 'hr manager' || clerkRole === 'ceo') {
          // Find the HR Manager role
          const Role = require('../models/Role').default;
          const adminRole = await Role.findOne({ name: 'HR Manager' });
          if (adminRole) {
            targetRoleId = adminRole._id;
          }
        }

        userProfile = new UserProfile({
          clerkUserId: user.id,
          employeeId,
          firstName: firstName || '',
          lastName: lastName || '',
          email,
          department,
          position,
          joinDate,
          organization,
          leaveBalance: defaultLeaveBalance,
          isActive: true,
          ...(targetRoleId && { roleId: targetRoleId })
        })
        
        await userProfile.save()
        isNew = true
        console.log(`✅ [${syncId}] New profile created successfully`, {
          profileId: userProfile._id,
          employeeId,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          duration: Date.now() - startTime
        });
      }
      
      const duration = Date.now() - startTime;
      console.log(`🎉 [${syncId}] Profile sync completed successfully`, {
        isNew,
        duration,
        status: 'SUCCESS'
      });
      
      return {
        success: true,
        message: isNew ? 'Profile created successfully' : 'Profile updated successfully',
        data: userProfile,
        isNew
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${syncId}] Profile sync error:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        hasMongoUri: !!process.env.MONGODB_URI,
        hasClerkSecret: !!process.env.CLERK_SECRET_KEY
      });
      
      return {
        success: false,
        message: 'Failed to sync user profile'
      }
    }
  }

  /**
   * Force sync a specific user's profile (for admin use)
   */
  static async forceSyncUserProfile(clerkUserId: string): Promise<ProfileSyncResult> {
    const syncId = Math.random().toString(36).substring(7);
    console.log(`🔄 [${syncId}] Force profile sync requested for user: ${clerkUserId}`);
    
    try {
      await connectDB()
      
      // This would require admin privileges and Clerk admin API access
      // For now, we'll return an error
      console.log(`⚠️ [${syncId}] Force sync requires admin privileges`);
      return {
        success: false,
        message: 'Force sync requires admin privileges and Clerk admin API access'
      }
    } catch (error) {
      console.error(`❌ [${syncId}] Force sync error:`, error);
      return {
        success: false,
        message: 'Failed to force sync user profile'
      }
    }
  }

  /**
   * Get user profile with automatic sync if needed
   */
  static async getUserProfileWithSync(): Promise<ProfileSyncResult> {
    const syncId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    console.log(`🔍 [${syncId}] Get profile with sync started`);
    
    try {
      const user = await currentUser()
      if (!user) {
        console.error(`❌ [${syncId}] User not found in Clerk`);
        return {
          success: false,
          message: 'User not found in Clerk'
        }
      }

      console.log(`✅ [${syncId}] Clerk user retrieved for profile sync`, {
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress
      });

      await connectDB()
      
      // Try to get existing profile
      console.log(`🔍 [${syncId}] Searching for existing profile...`);
      let userProfile = await UserProfile.findOne({ clerkUserId: user.id })
      
      if (!userProfile) {
        console.log(`⚠️ [${syncId}] No existing profile found, creating new one...`);
        // Profile doesn't exist, create it
        const syncResult = await this.syncUserProfile()
        if (syncResult.success) {
          console.log(`✅ [${syncId}] Profile created successfully via sync`);
          return syncResult
        } else {
          console.error(`❌ [${syncId}] Failed to create profile via sync`);
          return {
            success: false,
            message: 'Failed to create user profile'
          }
        }
      }
      
      console.log(`✅ [${syncId}] Profile retrieved successfully`, {
        profileId: userProfile._id,
        employeeId: userProfile.employeeId,
        duration: Date.now() - startTime
      });
      
      return {
        success: true,
        message: 'Profile retrieved successfully',
        data: userProfile
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${syncId}] Get profile with sync error:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        message: 'Failed to get user profile'
      }
    }
  }
}
