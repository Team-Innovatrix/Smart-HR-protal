import { NextRequest, NextResponse } from 'next/server';
import { checkHRManagerAccess } from '@/lib/adminAuth';
import connectDB from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';

export async function GET(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    const adminUser = await checkHRManagerAccess(req);
    if (!adminUser) {
      console.log('❌ Settings access denied: User is not an HR Manager');
      return NextResponse.json(
        { 
          error: 'Access denied. HR Manager privileges required.',
          message: 'Only HR Managers can access system settings.'
        },
        { status: 403 }
      );
    }

    console.log(`✅ Settings access granted to HR Manager: ${adminUser.firstName} ${adminUser.lastName}`);

    // Connect to database
    await connectDB();

    // Get or create settings
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = new SystemSettings({
        updatedBy: adminUser.email
      });
      await settings.save();
    }

    // Ensure company logo has a default value if not set
    const generalSettings = {
      ...settings.general,
      companyLogo: settings.general.companyLogo || '/api/image/logo.png'
    };

    // Convert leaveDefaults Map to object for JSON response
    const leaveSettings = {
      ...settings.leave,
      leaveDefaults: settings.leave.leaveDefaults ? Object.fromEntries(settings.leave.leaveDefaults) : {}
    };

    return NextResponse.json({
      success: true,
      data: {
        general: generalSettings,
        leave: leaveSettings,
        attendance: settings.attendance,
        notifications: settings.notifications,
        security: settings.security,
        integrations: settings.integrations || {
          slack: { enabled: false },
          email: { enabled: false },
          calendar: { enabled: false },
        },
        features: settings.features || {
          voiceCommands: false,
          realTimeUpdates: true,
          advancedAnalytics: false,
          customReports: false,
          apiAccess: false,
          mobileApp: false,
        },
      }
    });
  } catch (error) {
    console.error('Admin settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Check if user has HR Manager access
    const adminUser = await checkHRManagerAccess(req);
    if (!adminUser) {
      console.log('❌ Settings update denied: User is not an HR Manager');
      return NextResponse.json(
        { 
          error: 'Access denied. HR Manager privileges required.',
          message: 'Only HR Managers can modify system settings.'
        },
        { status: 403 }
      );
    }

    console.log(`✅ Settings update granted to HR Manager: ${adminUser.firstName} ${adminUser.lastName}`);

    // Connect to database
    await connectDB();

    const body = await req.json();

    // Validate settings structure (integrations and features are optional)
    if (!body.general || !body.leave || !body.attendance || !body.notifications || !body.security) {
      return NextResponse.json(
        { error: 'Invalid settings structure' },
        { status: 400 }
      );
    }

    // Convert leaveDefaults object to Map for storage
    const leaveSettings = {
      ...body.leave,
      leaveDefaults: body.leave.leaveDefaults ? new Map(Object.entries(body.leave.leaveDefaults)) : new Map()
    };

    // Update or create settings
    const settings = await SystemSettings.findOneAndUpdate(
      {}, // Find any document (since we ensure uniqueness)
      {
        ...body,
        leave: leaveSettings,
        updatedBy: adminUser.email,
        updatedAt: new Date()
      },
      {
        new: true,
        upsert: true, // Create if doesn't exist
        runValidators: true
      }
    );

    // Ensure company logo has a default value if not set
    const generalSettings = {
      ...settings.general,
      companyLogo: settings.general.companyLogo || '/api/image/logo.png'
    };

    // Convert leaveDefaults Map to object for JSON response
    const leaveSettingsResponse = {
      ...settings.leave,
      leaveDefaults: settings.leave.leaveDefaults ? Object.fromEntries(settings.leave.leaveDefaults) : {}
    };

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        general: generalSettings,
        leave: leaveSettingsResponse,
        attendance: settings.attendance,
        notifications: settings.notifications,
        security: settings.security,
        integrations: settings.integrations || {
          slack: { enabled: false },
          email: { enabled: false },
          calendar: { enabled: false },
        },
        features: settings.features || {
          voiceCommands: false,
          realTimeUpdates: true,
          advancedAnalytics: false,
          customReports: false,
          apiAccess: false,
          mobileApp: false,
        },
      }
    });
  } catch (error) {
    console.error('Admin settings update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
