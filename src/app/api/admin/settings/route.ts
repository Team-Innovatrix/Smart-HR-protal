import { NextRequest, NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import connectDB from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';

export async function GET(req: NextRequest) {
  try {
    if (!isAdminSessionValid(req)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    await connectDB();

    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings({ updatedBy: 'admin@innovatrix.com' });
      await settings.save();
    }

    const generalSettings = {
      ...settings.general,
      companyLogo: settings.general.companyLogo || '/api/image/logo.png'
    };

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
    console.error('Admin settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!isAdminSessionValid(req)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    await connectDB();

    const body = await req.json();

    if (!body.general || !body.leave || !body.attendance || !body.notifications || !body.security) {
      return NextResponse.json({ error: 'Invalid settings structure' }, { status: 400 });
    }

    const leaveSettings = {
      ...body.leave,
      leaveDefaults: body.leave.leaveDefaults ? new Map(Object.entries(body.leave.leaveDefaults)) : new Map()
    };

    const settings = await SystemSettings.findOneAndUpdate(
      {},
      {
        ...body,
        leave: leaveSettings,
        updatedBy: 'admin@innovatrix.com',
        updatedAt: new Date()
      },
      { new: true, upsert: true, runValidators: true }
    );

    const generalSettings = {
      ...settings.general,
      companyLogo: settings.general.companyLogo || '/api/image/logo.png'
    };

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
    console.error('Admin settings PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
