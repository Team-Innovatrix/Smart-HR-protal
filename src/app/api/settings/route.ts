import { NextResponse } from 'next/server';
import { auth } from '@/lib/devAuthWrapper';
import connectDB from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';

/**
 * Read-only public settings endpoint
 * Returns system settings that are safe for all authenticated users
 * Settings can only be modified by HR managers through /api/admin/settings
 */
export async function GET() {
  try {
    // We no longer require userId for the public GET route so login pages can fetch the brand name

    // Connect to database
    await connectDB();

    // Get or create settings
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = new SystemSettings({
        updatedBy: 'system'
      });
      await settings.save();
    }

    // Return only public settings (no sensitive information)
    return NextResponse.json({
      success: true,
      data: {
        general: {
          companyName: settings.general.companyName,
          companyLogo: settings.general.companyLogo || '/api/image/logo.png',
          timezone: settings.general.timezone,
          workingDays: settings.general.workingDays,
          workingHours: settings.general.workingHours,
          currency: settings.general.currency,
          dateFormat: settings.general.dateFormat,
          timeFormat: settings.general.timeFormat,
          language: settings.general.language
        },
        attendance: {
          requireClockIn: settings.attendance.requireClockIn,
          requireClockOut: settings.attendance.requireClockOut,
          lateThreshold: settings.attendance.lateThreshold,
          earlyLeaveThreshold: settings.attendance.earlyLeaveThreshold,
          overtimeEnabled: settings.attendance.overtimeEnabled,
          breakTimeEnabled: settings.attendance.breakTimeEnabled,
          defaultBreakDuration: settings.attendance.defaultBreakDuration,
          geoLocationRequired: settings.attendance.geoLocationRequired,
          regularizationCutoffDays: settings.attendance.regularizationCutoffDays
        },
        features: {
          voiceCommands: settings.features.voiceCommands,
          realTimeUpdates: settings.features.realTimeUpdates
        }
      }
    });
  } catch (error) {
    console.error('Public settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
