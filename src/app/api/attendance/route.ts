export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Attendance, { IAttendanceSession } from '../../../models/Attendance';
import UserProfile from '../../../models/UserProfile';
import { authenticateRequest, verifyUserAccess, createUnauthorizedResponse, createForbiddenResponse, withJsonErrorHandling } from '../../../lib/auth';
import { calculateAttendanceStatus, createDateInUserTimezone, calculateTotalHours, calculateMonthlyAttendanceStats } from '../../../lib/attendanceUtils';
import { logger } from '../../../lib/logger';
import { TimezoneService } from '../../../lib/timezoneService';
import mongoose from 'mongoose';
import SettingsService from '@/lib/settingsService';
import { createLastDaysStringQuery } from '../../../lib/dateQueryUtils';
import { CachedAttendanceService } from '../../../lib/cachedServices';
import { EnhancedCache } from '../../../lib/enhancedCache';
import { backupToS3 } from '../../../lib/s3';

// Clock in/out
export const POST = withJsonErrorHandling(async (request: NextRequest) => {
  try {
    // Authenticate the request
    try {
      await authenticateRequest(request);
    } catch {
      return createUnauthorizedResponse('Please sign in to access this feature');
    }
    
    await connectDB();
    
    const body = await request.json();
    console.log(' Attendance API received request body:', JSON.stringify(body, null, 2));
    
    const { userId, action, notes, location } = body;
    
    console.log(' Parsed fields:', { userId, action, notes, location });
    
    if (!userId || !action) {
      console.error(' Missing required fields:', { hasUserId: !!userId, hasAction: !!action });
      return NextResponse.json(
        { success: false, message: 'User ID and action are required' },
        { status: 400 }
      );
    }
    
    // Verify user can only modify their own attendance
    if (!(await verifyUserAccess(request, userId))) {
      return createForbiddenResponse('You can only modify your own attendance');
    }
    
    // Read attendance configuration to enforce geo policy
    const attendanceConfig = await SettingsService.getAttendanceConfig();

    if (action === 'clock-in') {
      // Enforce location if required by admin settings
      if (attendanceConfig?.geoLocationRequired) {
        const hasValidLocation = !!(location && location.latitude && location.longitude);
        if (!hasValidLocation) {
          return NextResponse.json(
            { success: false, code: 'LOCATION_REQUIRED', message: 'Location is required to clock in as per admin settings.' },
            { status: 400 }
          );
        }
      }
      // Get user profile to determine timezone
      const userProfile = await UserProfile.findOne({ clerkUserId: userId });
      if (!userProfile) {
        return NextResponse.json(
          { success: false, message: 'User profile not found' },
          { status: 404 }
        );
      }


      // Get current time in UTC for storage
      const currentTimeUTC = new Date();
      // Default to IST if user has no timezone configured
      const userTimezone = userProfile.timezone || 'Asia/Kolkata';
      
      // Calculate date based on the actual event time in user's timezone
      const currentLocalDate = TimezoneService.formatInTimezone(currentTimeUTC, userTimezone, 'yyyy-MM-dd');
      
      // Search for existing attendance record for this date
      let attendance = await Attendance.findOne({
        userId,
        date: currentLocalDate
      });
      
      if (!attendance) {
        // Create new attendance record
        
        attendance = new Attendance({
          userId,
          date: currentLocalDate, // Store date as local date string
          clockIn: currentTimeUTC, // Store clock-in time in UTC
          totalHours: 0,
          status: 'half-day',
          notes: notes || '',
          sessions: []
        });
      }
      
      // Check if there's an open session (clocked in but not clocked out)
      const hasOpenSession = attendance.sessions.some((session: IAttendanceSession) => !session.clockOut);
      
      if (hasOpenSession) {
        return NextResponse.json(
          { success: false, message: 'You have an open session. Please clock out first.' },
          { status: 400 }
        );
      }
      
      // Add new session with location data
      const sessionId = new mongoose.Types.ObjectId().toString();
      const sessionData: Partial<IAttendanceSession> = {
        _id: sessionId,
        clockIn: currentTimeUTC, // Store in UTC
        notes: notes || ''
      };

      // Add clock-in location if provided
      if (location && location.latitude && location.longitude) {
        sessionData.clockInLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: location.address
        };
      }

      attendance.sessions.push(sessionData);
      
      // Update main branch - clockIn remains the first clock-in, clockOut is cleared for new session
      attendance.clockOut = undefined;
      attendance.notes = notes || '';
      
      // Only recalculate status if it's not already regularized
      if (attendance.status !== 'regularized') {
        // Calculate attendance status using new logic based on system settings
        const sessionDataForCalc = attendance.sessions.map((session: IAttendanceSession) => ({
          clockIn: session.clockIn,
          clockOut: session.clockOut,
          duration: session.duration
        }));
        
        // Convert date string to Date object in user's timezone for proper calculation
        const dateForCalculation = createDateInUserTimezone(attendance.date, userProfile.timezone);
        const attendanceResult = await calculateAttendanceStatus(sessionDataForCalc, dateForCalculation, userProfile.timezone);
        
        // Update attendance record with calculated values
        attendance.totalHours = attendanceResult.totalHours;
        attendance.status = attendanceResult.status;
        
        logger.attendance('Status recalculated on clock-in', {
          userId,
          date: attendance.date,
          oldStatus: 'regularized',
          newStatus: attendanceResult.status,
          totalHours: attendanceResult.totalHours
        });
      } else {
        logger.attendance('Skipping status recalculation on clock-in - already regularized', {
          userId,
          date: attendance.date,
          status: attendance.status
        });
        
        // Still update total hours even if status is regularized
        const sessionDataForCalc = attendance.sessions.map((session: IAttendanceSession) => ({
          clockIn: session.clockIn,
          clockOut: session.clockOut,
          duration: session.duration
        }));
        attendance.totalHours = calculateTotalHours(sessionDataForCalc);
      }
      
      // Save with duplicate-key (race condition) handling
      try {
        await attendance.save();
      } catch (error: unknown) {
        // Handle race condition where another request created today's record concurrently
        // Mongo duplicate key error code is 11000
        if (error && typeof error === 'object' && 'code' in error && (error.code === 11000 || (error as any)?.name === 'MongoServerError')) {
          // Re-fetch existing record and proceed safely
          const existing = await Attendance.findOne({ userId, date: currentLocalDate });
          if (!existing) {
            throw error; // Unexpected: duplicate reported but no record found; rethrow
          }

          // If existing already has an open session, prevent double clock-in
          const alreadyHasOpen = existing.sessions.some((session: IAttendanceSession) => !session.clockOut);
          if (alreadyHasOpen) {
            return NextResponse.json(
              { success: false, message: 'You have an open session. Please clock out first.' },
              { status: 400 }
            );
          }

          // Otherwise, append this session and recalc
          existing.sessions.push(sessionData);
          existing.clockOut = undefined;
          existing.notes = notes || '';

          if (existing.status !== 'regularized') {
            const sessionDataForCalc = existing.sessions.map((session: IAttendanceSession) => ({
              clockIn: session.clockIn,
              clockOut: session.clockOut,
              duration: session.duration
            }));
            const dateForCalculation = createDateInUserTimezone(existing.date, userProfile.timezone);
            const attendanceResult = await calculateAttendanceStatus(sessionDataForCalc, dateForCalculation, userProfile.timezone);
            existing.totalHours = attendanceResult.totalHours;
            existing.status = attendanceResult.status;
          } else {
            const sessionDataForCalc = existing.sessions.map((session: IAttendanceSession) => ({
              clockIn: session.clockIn,
              clockOut: session.clockOut,
              duration: session.duration
            }));
            existing.totalHours = calculateTotalHours(sessionDataForCalc);
          }

          await existing.save();
          attendance = existing; // continue with unified response path below
        } else {
          throw error;
        }
      }
      
      // Invalidate attendance cache after successful clock-in
      try {
        await CachedAttendanceService.invalidateUserAttendance(userId);
        await EnhancedCache.invalidateByTags(['attendance', 'user']);
        // Clear specific cache keys for today's attendance
        const todayKey = `attendance:${userId}:${currentLocalDate}`;
        const todayGenericKey = `attendance:${userId}:today`;
        await EnhancedCache.invalidate(todayKey);
        await EnhancedCache.invalidate(todayGenericKey);
        console.log(' Cache invalidated for clock-in:', { userId, currentLocalDate });
      } catch (cacheError) {
        console.warn(' Cache invalidation failed for clock-in:', cacheError);
        // Don't fail the request if cache invalidation fails
      }
      
      // Convert UTC times to local IST time for display
      const formattedAttendance = {
        ...attendance.toObject(),
        clockIn: TimezoneService.formatInTimezone(attendance.clockIn, userTimezone, 'hh:mm a'),
        clockOut: attendance.clockOut ? TimezoneService.formatInTimezone(attendance.clockOut, userTimezone, 'hh:mm a') : null,
        sessions: attendance.sessions.map((session: IAttendanceSession) => ({
          ...session,
          clockIn: TimezoneService.formatInTimezone(session.clockIn, userTimezone, 'hh:mm a'),
          clockOut: session.clockOut ? TimezoneService.formatInTimezone(session.clockOut, userTimezone, 'hh:mm a') : null
        }))
      };
      
      // Sync with Google Sheets in background
      try {
        const [year, month, day] = currentLocalDate.split('-');
        const dateStr = `${day}/${month}/${year.substring(2)}`;
        const locationStr = location && location.latitude ? 
          (location.address || `${location.latitude}, ${location.longitude}`) : 'N/A';
          
        fetch('https://script.google.com/macros/s/AKfycbwkEOKl2LLscH-cRxXWk21EcZS_KsA-hyrG9xsOutLpbnjNBFqzJITh8qEGCQXc-1u1hg/exec', {
          method: 'POST',
          body: JSON.stringify({
            employeeName: `${userProfile.firstName} ${userProfile.lastName}`,
            post: userProfile.department || 'Employee',
            action: 'clock-in',
            date: dateStr,
            time: formattedAttendance.clockIn,
            location: locationStr
          })
        }).catch(err => console.error('Google Sheets sync error:', err));
      } catch (e) {
        console.error('Google Sheets setup error:', e);
      }
      
      //  Backup to AWS S3 (Dual-write for Attendance System)
      backupToS3(
        formattedAttendance, 
        `attendance/clock-in/${userId}/${currentLocalDate}.json`
      ).catch(err => console.error('AWS S3 backup error:', err));
      
      const response = NextResponse.json({
        success: true,
        message: 'Successfully clocked in',
        data: formattedAttendance
      });
      
      // Add cache-busting headers
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
      
    } else if (action === 'clock-out') {
      // Enforce location if required by admin settings
      if (attendanceConfig?.geoLocationRequired) {
        const hasValidLocation = !!(location && location.latitude && location.longitude);
        if (!hasValidLocation) {
          return NextResponse.json(
            { success: false, code: 'LOCATION_REQUIRED', message: 'Location is required to clock out as per admin settings.' },
            { status: 400 }
          );
        }
      }
      // Get user profile to determine timezone
      const userProfile = await UserProfile.findOne({ clerkUserId: userId });
      if (!userProfile) {
        return NextResponse.json(
          { success: false, message: 'User profile not found' },
          { status: 404 }
        );
      }


      // Get current time in UTC for storage
      const currentTimeUTC = new Date();
      // Default to IST if user has no timezone configured
      const userTimezone = userProfile.timezone || 'Asia/Kolkata';
      
      // Calculate date based on the actual event time in user's timezone
      const currentLocalDate = TimezoneService.formatInTimezone(currentTimeUTC, userTimezone, 'yyyy-MM-dd');
      
      // Search for existing attendance record for this date
      const attendance = await Attendance.findOne({
        userId,
        date: currentLocalDate
      });
      
      if (!attendance) {
        return NextResponse.json(
          { success: false, message: 'No attendance record found for today' },
          { status: 400 }
        );
      }
      
      // Find the last open session
      const lastSessionIndex = attendance.sessions.length - 1;
      if (lastSessionIndex < 0 || attendance.sessions[lastSessionIndex].clockOut) {
        return NextResponse.json(
          { success: false, message: 'No open session to clock out' },
          { status: 400 }
        );
      }
      
      // Close the session
      const session: IAttendanceSession = attendance.sessions[lastSessionIndex];
      session.clockOut = currentTimeUTC; // Store in UTC
      
      // Calculate session duration (both times are in UTC, so direct calculation works)
      const clockInTime = new Date(session.clockIn);
      const clockOutTime = new Date(session.clockOut);
      session.duration = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
      
      // Update session notes if provided
      if (notes) {
        session.notes = notes;
      }

      // Add clock-out location if provided
      if (location && location.latitude && location.longitude) {
        session.clockOutLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: location.address
        };
      }
      
      // Update main branch - clockOut becomes the last clock-out of the day
      attendance.clockOut = currentTimeUTC; // Store in UTC
      attendance.notes = notes || session.notes || '';
      
      // Only recalculate status if it's not already regularized
      if (attendance.status !== 'regularized') {
        // Calculate attendance status using new logic based on system settings
        const sessionData = attendance.sessions.map((session: IAttendanceSession) => ({
          clockIn: session.clockIn,
          clockOut: session.clockOut,
          duration: session.duration
        }));
        
        // Convert date string to Date object in user's timezone for proper calculation
        const dateForCalculation = createDateInUserTimezone(attendance.date, userProfile.timezone);
        const attendanceResult = await calculateAttendanceStatus(sessionData, dateForCalculation, userProfile.timezone);
        
        // Update attendance record with calculated values
        attendance.totalHours = attendanceResult.totalHours;
        attendance.status = attendanceResult.status;
        
        logger.attendance('Status recalculated on clock-out', {
          userId,
          date: attendance.date,
          oldStatus: 'regularized',
          newStatus: attendanceResult.status,
          totalHours: attendanceResult.totalHours
        });
      } else {
        logger.attendance('Skipping status recalculation - already regularized', {
          userId,
          date: attendance.date,
          status: attendance.status
        });
        
        // Still update total hours even if status is regularized
        const sessionData = attendance.sessions.map((session: IAttendanceSession) => ({
          clockIn: session.clockIn,
          clockOut: session.clockOut,
          duration: session.duration
        }));
        attendance.totalHours = calculateTotalHours(sessionData);
      }
      
      await attendance.save();
      
      // Invalidate attendance cache after successful clock-out
      try {
        await CachedAttendanceService.invalidateUserAttendance(userId);
        await EnhancedCache.invalidateByTags(['attendance', 'user']);
        // Clear specific cache keys for today's attendance
        const todayKey = `attendance:${userId}:${currentLocalDate}`;
        const todayGenericKey = `attendance:${userId}:today`;
        await EnhancedCache.invalidate(todayKey);
        await EnhancedCache.invalidate(todayGenericKey);
        console.log(' Cache invalidated for clock-out:', { userId, currentLocalDate });
      } catch (cacheError) {
        console.warn(' Cache invalidation failed for clock-out:', cacheError);
        // Don't fail the request if cache invalidation fails
      }
      
      // Convert UTC times to local IST time for display
      const formattedAttendance = {
        ...attendance.toObject(),
        clockIn: TimezoneService.formatInTimezone(attendance.clockIn, userTimezone, 'hh:mm a'),
        clockOut: attendance.clockOut ? TimezoneService.formatInTimezone(attendance.clockOut, userTimezone, 'hh:mm a') : null,
        sessions: attendance.sessions.map((session: IAttendanceSession) => ({
          ...session,
          clockIn: TimezoneService.formatInTimezone(session.clockIn, userTimezone, 'hh:mm a'),
          clockOut: session.clockOut ? TimezoneService.formatInTimezone(session.clockOut, userTimezone, 'hh:mm a') : null
        }))
      };

      // Sync with Google Sheets in background
      try {
        const [year, month, day] = currentLocalDate.split('-');
        const dateStr = `${day}/${month}/${year.substring(2)}`;
          
        fetch('https://script.google.com/macros/s/AKfycbwkEOKl2LLscH-cRxXWk21EcZS_KsA-hyrG9xsOutLpbnjNBFqzJITh8qEGCQXc-1u1hg/exec', {
          method: 'POST',
          body: JSON.stringify({
            employeeName: `${userProfile.firstName} ${userProfile.lastName}`,
            post: userProfile.department || 'Employee',
            action: 'clock-out',
            date: dateStr,
            time: formattedAttendance.clockOut
          })
        }).catch(err => console.error('Google Sheets sync error:', err));
      } catch (e) {
        console.error('Google Sheets setup error:', e);
      }
      
      //  Backup to AWS S3 (Dual-write for Attendance System)
      backupToS3(
        formattedAttendance, 
        `attendance/clock-out/${userId}/${currentLocalDate}.json`
      ).catch(err => console.error('AWS S3 backup error:', err));
      
      const response = NextResponse.json({
        success: true,
        message: 'Successfully clocked out',
        data: formattedAttendance
      });
      
      // Add cache-busting headers
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
      
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Use "clock-in" or "clock-out"' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error in attendance POST:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process attendance action',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

// Get attendance data
export const GET = withJsonErrorHandling(async (request: NextRequest) => {
  try {
    // Authenticate the request
    try {
      await authenticateRequest(request);
    } catch {
      return createUnauthorizedResponse('Please sign in to access this feature');
    }
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Verify user can only access their own data (or managers/HR can access all)
    if (!(await verifyUserAccess(request, userId))) {
      return createForbiddenResponse('You can only access your own attendance data');
    }
    
    const query: Record<string, unknown> = { userId };
    
    if (date) {
      console.log(' Attendance API received date:', date, 'for userId:', userId);
      
      // Get user profile to determine timezone
      const userProfile = await UserProfile.findOne({ clerkUserId: userId });
      if (!userProfile) {
        return NextResponse.json(
          { success: false, message: 'User profile not found' },
          { status: 404 }
        );
      }

      console.log(' User timezone:', userProfile.timezone);

      // Server-authoritative date calculation: Always use user's profile timezone
      // This ensures consistency with how dates are calculated during writes
      const targetDate = TimezoneService.getTodayDateStringInTimezone(userProfile.timezone);
      console.log(' Server calculated date as:', targetDate, 'for timezone:', userProfile.timezone);
      
      // Search for attendance record for the specific date
      const attendance = await Attendance.findOne({
        userId,
        date: targetDate
      });
      
      console.log(' Found attendance record:', attendance ? 'YES' : 'NO', 'for date:', targetDate);
      
      
      if (!attendance) {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No attendance record found for this date'
        });
      }
      
      // Format times for display in user timezone (hh:mm AM/PM format)
      const formattedAttendance = {
        ...attendance.toObject(),
        clockIn: TimezoneService.formatInTimezone(attendance.clockIn, userProfile.timezone, 'hh:mm a'),
        clockOut: attendance.clockOut ? TimezoneService.formatInTimezone(attendance.clockOut, userProfile.timezone, 'hh:mm a') : null,
        sessions: attendance.sessions.map((session: IAttendanceSession) => ({
          ...session,
          clockIn: TimezoneService.formatInTimezone(session.clockIn, userProfile.timezone, 'hh:mm a'),
          clockOut: session.clockOut ? TimezoneService.formatInTimezone(session.clockOut, userProfile.timezone, 'hh:mm a') : null
        }))
      };
      
      const response = NextResponse.json({
        success: true,
        data: formattedAttendance
      });
      
      // Add cache-busting headers
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
      
    } else if (month && year) {
      // Get user profile to determine timezone
      const userProfile = await UserProfile.findOne({ clerkUserId: userId });
      if (!userProfile) {
        return NextResponse.json(
          { success: false, message: 'User profile not found' },
          { status: 404 }
        );
      }

      // Get monthly attendance summary - use date strings for querying
      const startDateStr = `${year}-${month.padStart(2, '0')}-01`;
      // Get the last day of the month properly
      const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDateStr = `${year}-${month.padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`;
      
      query.date = {
        $gte: startDateStr,
        $lte: endDateStr
      };
      
      const attendanceRecords = await Attendance.find(query).sort({ date: 1 });
      
      // Calculate statistics using the new comprehensive function
      const stats = await calculateMonthlyAttendanceStats(
        parseInt(year),
        parseInt(month),
        userProfile.timezone,
        attendanceRecords
      );
      
      // Format times for display in user timezone with offset
      const formattedRecords = attendanceRecords.map(record => ({
        ...record.toObject(),
        clockIn: TimezoneService.formatInTimezone(record.clockIn, userProfile.timezone, 'hh:mm a'),
        clockOut: record.clockOut ? TimezoneService.formatInTimezone(record.clockOut, userProfile.timezone, 'hh:mm a') : null,
        sessions: record.sessions.map((session: IAttendanceSession) => ({
          ...session,
          clockIn: TimezoneService.formatInTimezone(session.clockIn, userProfile.timezone, 'hh:mm a'),
          clockOut: session.clockOut ? TimezoneService.formatInTimezone(session.clockOut, userProfile.timezone, 'hh:mm a') : null
        }))
      }));
      
      const response = NextResponse.json({
        success: true,
        data: {
          records: formattedRecords,
          summary: {
            totalDays: stats.totalDays,
            daysElapsed: stats.daysElapsed,
            fullDays: stats.fullDays,
            halfDays: stats.halfDays,
            presentDays: stats.presentDays,
            regularizedDays: stats.regularizedDays,
            holidayDays: stats.holidayDays,
            weeklyOffDays: stats.weeklyOffDays,
            successfulDays: stats.successfulDays,
            absentDays: stats.absentDays,
            totalHours: stats.totalHours
          }
        }
      });
      
      // Add cache-busting headers
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
      
    } else {
      // Get user profile to determine timezone
      const userProfile = await UserProfile.findOne({ clerkUserId: userId });
      if (!userProfile) {
        return NextResponse.json(
          { success: false, message: 'User profile not found' },
          { status: 404 }
        );
      }

      // Get recent attendance history (last 30 days) - use user timezone for consistent date strings
      query.date = createLastDaysStringQuery(30, userProfile.timezone);
      
      const attendanceRecords = await Attendance.find(query)
        .sort({ date: -1 })
        .limit(30);
      
      // Format times for display in user timezone with offset
      const formattedRecords = attendanceRecords.map(record => ({
        ...record.toObject(),
        clockIn: TimezoneService.formatInTimezone(record.clockIn, userProfile.timezone, 'hh:mm a'),
        clockOut: record.clockOut ? TimezoneService.formatInTimezone(record.clockOut, userProfile.timezone, 'hh:mm a') : null,
        sessions: record.sessions.map((session: IAttendanceSession) => ({
          ...session,
          clockIn: TimezoneService.formatInTimezone(session.clockIn, userProfile.timezone, 'hh:mm a'),
          clockOut: session.clockOut ? TimezoneService.formatInTimezone(session.clockOut, userProfile.timezone, 'hh:mm a') : null
        }))
      }));
      
      const response = NextResponse.json({
        success: true,
        data: formattedRecords
      });
      
      // Add cache-busting headers
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
    }
    
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch attendance data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});
