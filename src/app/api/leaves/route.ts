export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Leave from '../../../models/Leave';
import UserProfile from '../../../models/UserProfile';
import { authenticateRequest, verifyUserAccess, createUnauthorizedResponse, createForbiddenResponse } from '../../../lib/auth';
import { NotificationService } from '../../../lib/notificationService';
import { emailService } from '../../../lib/emailService';
import { 
  isValidTimezone,
  createMidnightInTimezone,
  getTodayInTimezone
} from '../../../lib/timezoneService';
import SettingsService from '../../../lib/settingsService';
import { calculateWorkingDays, createWorkingDaysConfig, validateCalculationConsistency } from '../../../lib/leaveCalculationUtils';

// Submit leave request
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    try {
      await authenticateRequest(request);
    } catch {
      return createUnauthorizedResponse('Please sign in to access this feature');
    }
    
    await connectDB();
    
    const body = await request.json();
    const { userId, leaveType, startDate, endDate, reason, clientCalculatedDays } = body;
    
    if (!userId || !leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Verify user can only submit leave for themselves
    if (!(await verifyUserAccess(request, userId))) {
      return createForbiddenResponse('You can only submit leave requests for yourself');
    }

    // Get user profile to determine timezone
    const userProfile = await UserProfile.findOne({ clerkUserId: userId });
    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    const userTimezone = userProfile.timezone;
    
    // Validate user timezone
    if (!isValidTimezone(userTimezone)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user timezone in profile' },
        { status: 400 }
      );
    }
    
    // Parse and validate date strings (expected format: YYYY-MM-DD)
    if (typeof startDate !== 'string' || typeof endDate !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid date format provided' },
        { status: 400 }
      );
    }
    // Create UTC instants that represent midnight at the user's local date
    const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
    const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
    if (!sYear || !sMonth || !sDay || !eYear || !eMonth || !eDay) {
      return NextResponse.json(
        { success: false, message: 'Invalid date format provided' },
        { status: 400 }
      );
    }
    const startLocal = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
    const endLocal = new Date(eYear, eMonth - 1, eDay, 0, 0, 0, 0);
    const startUTC = createMidnightInTimezone(startLocal, userTimezone);
    const endUTC = createMidnightInTimezone(endLocal, userTimezone);
    
    // Check if dates are in the past (using user timezone) and validate against backdate policy
    const todayLocal = getTodayInTimezone(userTimezone);
    const todayUTC = createMidnightInTimezone(todayLocal, userTimezone);
    if (startUTC < todayUTC) {
      // Get leave configuration to check backdate policy
      const leaveConfig = await SettingsService.getLeaveConfig();
      const allowedBackdateDays = leaveConfig?.allowBackdateLeaves || 0;
      
      if (allowedBackdateDays === 0) {
        return NextResponse.json(
          { success: false, message: 'Start date cannot be in the past' },
          { status: 400 }
        );
      } else {
        const daysDifference = Math.floor((todayUTC.getTime() - startUTC.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDifference > allowedBackdateDays) {
          return NextResponse.json(
            { success: false, message: `Start date cannot be more than ${allowedBackdateDays} days in the past` },
            { status: 400 }
          );
        }
      }
    }
    
    if (endUTC < startUTC) {
      return NextResponse.json(
        { success: false, message: 'End date must be on or after start date' },
        { status: 400 }
      );
    }
    
    // Read working days and holidays from system settings (read-only)
    const systemSettings = await SettingsService.getSystemSettings();
    
    // Use shared calculation utility for consistency
    const config = createWorkingDaysConfig(systemSettings, userTimezone);
    const calculationResult = calculateWorkingDays(startDate, endDate, config);
    
    const { totalDays, invalidDates } = calculationResult;

    // Validate client-server calculation consistency (if client provided calculation)
    if (clientCalculatedDays !== undefined) {
      const validation = validateCalculationConsistency(
        { totalDays: clientCalculatedDays, invalidDates: [], isSameDay: calculationResult.isSameDay },
        calculationResult
      );
      
      if (!validation.isValid) {
        console.warn('Client-server calculation mismatch:', validation.message);
        // For now, we'll log the warning but continue with server calculation
        // In production, you might want to return an error or show a warning to the user
      }
    }

    // Do not reject if range includes weekends/holidays.
    // We allow spanning ranges and only count working days.
    // Keep only an informational log for observability.
    if (invalidDates.length > 0) {
      console.log('[Leaves:POST] Range includes non-working days/holidays; proceeding with working-day count only', { invalidDatesCount: invalidDates.length });
    }
    
    if (totalDays === 0) {
      return NextResponse.json(
        { success: false, message: 'No working days in the selected date range' },
        { status: 400 }
      );
    }
    
    // Check leave balance
    const leaveBalance = userProfile.leaveBalance[leaveType as keyof typeof userProfile.leaveBalance];
    if (leaveBalance < totalDays) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Insufficient ${leaveType} leave balance. Available: ${leaveBalance} days, Requested: ${totalDays} days` 
        },
        { status: 400 }
      );
    }
    
    // Check for overlapping leave requests (treat stored dates as full-day blocks)
    const existingLeaves = await Leave.find({
      userId,
      status: { $in: ['pending', 'approved'] }
    });

    const newStart = startUTC.getTime();
    const newEndExclusive = endUTC.getTime() + 24 * 60 * 60 * 1000;
    const hasOverlap = existingLeaves.some(leave => {
      const existingStart = new Date(leave.startDate).getTime();
      const existingEndExclusive = new Date(leave.endDate).getTime() + 24 * 60 * 60 * 1000;
      return newStart < existingEndExclusive && newEndExclusive > existingStart;
    });
    
    if (hasOverlap) {
      return NextResponse.json(
        { success: false, message: 'Leave request overlaps with existing approved or pending leaves' },
        { status: 400 }
      );
    }
    
    // Create leave request with UTC dates and timezone info
    const leave = new Leave({
      userId,
      leaveType,
      startDate: startUTC,
      endDate: endUTC,
      totalDays,
      reason,
      status: 'pending',
      appliedDate: new Date(), // Will be converted to UTC by pre-save middleware
      userTimezone,
      isFullDay: true
    });
    
    await leave.save();
    console.log('[Leaves:POST] Saved leave', { leaveId: leave._id.toString(), userId: leave.userId, totalDays });
    
    // Create notifications based on leave policy
    try {
      await NotificationService.createLeaveNotifications(leave, 'request');
    } catch (notificationError) {
      console.error('Error creating leave notifications:', notificationError);
      // Don't fail the leave request if notifications fail
    }

    // Send email to manager with employee in CC (non-blocking)
    try {
      const configured = emailService.isConfigured();
      console.log('[Leaves:POST] Email configured?', configured);
      if (configured && userProfile.managerId) {
        const managerProfile = await UserProfile.findOne({ clerkUserId: userProfile.managerId });
        const managerEmail = managerProfile?.email;
        const employeeEmail = userProfile.email;
        console.log('[Leaves:POST] Manager/Employee emails', { managerEmail, employeeEmail });
        if (managerEmail && employeeEmail) {
          const subject = `Leave Request: ${userProfile.firstName} ${userProfile.lastName} · ${leave.leaveType} · ${leave.totalDays} day(s)`;
          const html = `<p>Hello ${managerProfile.firstName || 'Manager'},</p>
                        <p><strong>${userProfile.firstName} ${userProfile.lastName}</strong> has requested leave.</p>
                        <ul>
                          <li><strong>Type:</strong> ${leave.leaveType}</li>
                          <li><strong>From:</strong> ${new Date(leave.startDate).toLocaleDateString()}</li>
                          <li><strong>To:</strong> ${new Date(leave.endDate).toLocaleDateString()}</li>
                          <li><strong>Total Days:</strong> ${leave.totalDays}</li>
                        </ul>
                        <p><strong>Reason:</strong></p>
                        <blockquote>${leave.reason?.toString().replace(/\n/g, '<br/>') || '-'}</blockquote>
                        <p style="margin-top: 20px;">
                          <a href="https://portal.inovatrix.io/leaves" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Leave Requests</a>
                        </p>
                        <p>Regards,<br/>HR Dashboard</p>`;

          // Some providers ignore cc unless using headers; SendGrid supports cc via personalizations
          // Our helper does not expose cc; use simple send to manager and add employee in replyTo for visibility
          // Alternative: send two emails. We'll include replyTo to employee.
          console.log('[Leaves:POST] Sending manager email');
          await emailService.sendEmail({
            to: managerEmail,
            subject,
            html,
            text: `Leave Request from ${userProfile.firstName} ${userProfile.lastName}\nType: ${leave.leaveType}\nFrom: ${new Date(leave.startDate).toLocaleDateString()}\nTo: ${new Date(leave.endDate).toLocaleDateString()}\nTotal Days: ${leave.totalDays}\nReason: ${leave.reason || '-'}`,
            replyTo: employeeEmail,
          });

          // Send confirmation to employee as well so they are cc'ed in practice
          console.log('[Leaves:POST] Sending employee copy email');
          await emailService.sendEmail({
            to: employeeEmail,
            subject: `Copy: ${subject}`,
            html: `<p>Hi ${userProfile.firstName},</p>
                   <p>Your leave request has been submitted and your manager (${managerProfile.firstName || ''} ${managerProfile.lastName || ''}) has been notified.</p>
                   <p>Summary:</p>
                   <ul>
                     <li><strong>Type:</strong> ${leave.leaveType}</li>
                     <li><strong>From:</strong> ${new Date(leave.startDate).toLocaleDateString()}</li>
                     <li><strong>To:</strong> ${new Date(leave.endDate).toLocaleDateString()}</li>
                     <li><strong>Total Days:</strong> ${leave.totalDays}</li>
                   </ul>
                   <p><strong>Reason:</strong></p>
                   <blockquote>${leave.reason?.toString().replace(/\n/g, '<br/>') || '-'}</blockquote>
                   <p style="margin-top: 20px;">
                     <a href="https://portal.inovatrix.io/leaves" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View My Leaves</a>
                   </p>
                   <p>Regards,<br/>HR Dashboard</p>`,
          });
        } else {
          console.warn('[Leaves:POST] Missing manager or employee email. Skipping emails.');
        }
      } else if (!userProfile.managerId) {
        console.warn('[Leaves:POST] User has no managerId. Skipping manager email.');
      }
    } catch (emailError) {
      console.error('[Leaves:POST] Error sending leave emails:', emailError);
      // Do not block response on email failure
    }
    
    return NextResponse.json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leave
    });
    
  } catch (error) {
    console.error('Error submitting leave request:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit leave request',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get leave data
export async function GET(request: NextRequest) {
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
    const status = searchParams.get('status');
    const leaveType = searchParams.get('leaveType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Verify user can only access their own data (or managers/HR can access all)
    if (!(await verifyUserAccess(request, userId))) {
      return createForbiddenResponse('You can only access your own leave data');
    }
    
    const query: Record<string, unknown> = { userId };
    
    // Add filters
    if (status) {
      query.status = status;
    }
    
    if (leaveType) {
      query.leaveType = leaveType;
    }
    
    if (startDate && endDate) {
      // Get user profile to determine timezone
      const userProfile = await UserProfile.findOne({ clerkUserId: userId });
      if (!userProfile) {
        return NextResponse.json(
          { success: false, message: 'User profile not found' },
          { status: 404 }
        );
      }

      // Convert date-only strings to UTC midnights using user timezone
      const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
      const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
      const startLocal = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
      const endLocal = new Date(eYear, eMonth - 1, eDay, 0, 0, 0, 0);
      const startUTC = createMidnightInTimezone(startLocal, userProfile.timezone);
      const endUTC = createMidnightInTimezone(endLocal, userProfile.timezone);
      
      // Find leaves that overlap with the requested date range
      // Using half-open interval logic: [start, end)
      query.$or = [
        {
          startDate: { $lt: new Date(endUTC.getTime() + 24 * 60 * 60 * 1000) },
          endDate: { $gte: startUTC }
        }
      ]
    }
    
    const leaves = await Leave.find(query)
      .sort({ appliedDate: -1 })
      .limit(100); // Limit to prevent large data dumps
    
    return NextResponse.json({
      success: true,
      data: leaves
    });
    
  } catch (error) {
    console.error('Error fetching leave data:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch leave data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Update leave status (approve, reject, cancel)
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate the request
    try {
      await authenticateRequest(request);
    } catch {
      return createUnauthorizedResponse('Please sign in to access this feature');
    }
    
    await connectDB();
    
    const body = await request.json();
    const { leaveId, status, approvedBy, rejectionReason } = body;
    
    if (!leaveId || !status) {
      return NextResponse.json(
        { success: false, message: 'Leave ID and status are required' },
        { status: 400 }
      );
    }
    
    // Validate status
    if (!['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    // Find the leave request
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return NextResponse.json(
        { success: false, message: 'Leave request not found' },
        { status: 404 }
      );
    }
    
    // Update the leave status
    const updateData: Partial<{ status: string, approvedBy?: string, rejectionReason?: string }> = { status };
    
    if (status === 'approved' && approvedBy) {
      updateData.approvedBy = approvedBy;
    }
    
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    
    if (status === 'cancelled') {
      // Only allow users to cancel their own pending leaves
      if (leave.status !== 'pending') {
        return NextResponse.json(
          { success: false, message: 'Only pending leaves can be cancelled' },
          { status: 400 }
        );
      }
    }
    
    const updatedLeave = await Leave.findByIdAndUpdate(
      leaveId,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Create notifications for leave status changes
    if (updatedLeave && ['approved', 'rejected', 'cancelled'].includes(status)) {
      try {
        await NotificationService.createLeaveNotifications(updatedLeave, status as 'approved' | 'rejected' | 'cancelled');
      } catch (notificationError) {
        console.error('Error creating leave status notifications:', notificationError);
        // Don't fail the status update if notifications fail
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Leave status updated successfully',
      data: updatedLeave
    });
    
  } catch (error) {
    console.error('Error updating leave status:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update leave status',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
