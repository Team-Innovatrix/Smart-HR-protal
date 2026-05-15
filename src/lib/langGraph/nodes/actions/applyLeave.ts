// Apply Leave Action: Handles leave application submissions

import { logger } from "../../utils/logger";
import connectDB from "../../../mongodb";
import Leave from "../../../../models/Leave";
import UserProfile from "../../../../models/UserProfile";
import { NotificationService } from "../../../notificationService";
import { emailService } from "../../../emailService";
import { 
  isValidTimezone,
  createMidnightInTimezone,
  getTodayInTimezone
} from "../../../timezoneService";
import SettingsService from "../../../settingsService";
import { calculateWorkingDays, createWorkingDaysConfig } from "../../../leaveCalculationUtils";

export interface ApplyLeaveParams {
  userId: string;
  leaveType: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  reason: string;
}

export interface ApplyLeaveResult {
  success: boolean;
  message: string;
  data?: {
    leaveId?: string;
    totalDays?: number;
    status?: string;
  };
  error?: string;
}

/**
 * Map parameter leaveType to API/Model leaveType
 * Parameter types: annual, sick, personal, maternity, paternity, emergency
 * Model types: sick, casual, annual, maternity, paternity, bereavement, other
 */
function mapLeaveType(paramType: string): string {
  const mapping: Record<string, string> = {
    'annual': 'annual',
    'sick': 'sick',
    'personal': 'casual', // Personal maps to casual
    'maternity': 'maternity',
    'paternity': 'paternity',
    'emergency': 'other', // Emergency maps to other
    'casual': 'casual', // Also accept casual directly
    'bereavement': 'bereavement', // Also accept bereavement directly
    'other': 'other' // Also accept other directly
  };

  const mappedType = mapping[paramType.toLowerCase()];
  if (!mappedType) {
    logger.warn('Unknown leave type, defaulting to "other"', {}, { paramType });
    return 'other';
  }

  return mappedType;
}

/**
 * Execute apply leave action by directly creating the leave record in the database
 */
export async function executeApplyLeave(params: ApplyLeaveParams): Promise<ApplyLeaveResult> {
  try {
    logger.info('Executing apply leave', { userId: params.userId }, { 
      leaveType: params.leaveType,
      startDate: params.startDate,
      endDate: params.endDate
    });

    // Validate required parameters
    if (!params.userId || !params.leaveType || !params.startDate || !params.endDate || !params.reason) {
      return {
        success: false,
        message: 'Missing required parameters for leave application',
        error: 'MISSING_PARAMETERS'
      };
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(params.startDate) || !dateRegex.test(params.endDate)) {
      return {
        success: false,
        message: 'Invalid date format. Dates must be in YYYY-MM-DD format.',
        error: 'INVALID_DATE_FORMAT'
      };
    }

    // Validate reason length (minimum 10 characters)
    if (params.reason.length < 10) {
      return {
        success: false,
        message: 'Reason must be at least 10 characters long.',
        error: 'REASON_TOO_SHORT'
      };
    }

    // Map leave type from parameter format to model format
    const mappedLeaveType = mapLeaveType(params.leaveType);

    // Connect to database
    await connectDB();

    // Get user profile to determine timezone
    const userProfile = await UserProfile.findOne({ clerkUserId: params.userId });
    if (!userProfile) {
      return {
        success: false,
        message: 'User profile not found',
        error: 'USER_NOT_FOUND'
      };
    }

    const userTimezone = userProfile.timezone;

    // Validate user timezone
    if (!isValidTimezone(userTimezone)) {
      return {
        success: false,
        message: 'Invalid user timezone in profile',
        error: 'INVALID_TIMEZONE'
      };
    }

    // Parse and create UTC dates
    const [sYear, sMonth, sDay] = params.startDate.split('-').map(Number);
    const [eYear, eMonth, eDay] = params.endDate.split('-').map(Number);
    
    if (!sYear || !sMonth || !sDay || !eYear || !eMonth || !eDay) {
      return {
        success: false,
        message: 'Invalid date format provided',
        error: 'INVALID_DATE_FORMAT'
      };
    }

    const startLocal = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
    const endLocal = new Date(eYear, eMonth - 1, eDay, 0, 0, 0, 0);
    const startUTC = createMidnightInTimezone(startLocal, userTimezone);
    const endUTC = createMidnightInTimezone(endLocal, userTimezone);

    // Check if dates are in the past
    const todayLocal = getTodayInTimezone(userTimezone);
    const todayUTC = createMidnightInTimezone(todayLocal, userTimezone);
    
    if (startUTC < todayUTC) {
      // Get leave configuration to check backdate policy
      const leaveConfig = await SettingsService.getLeaveConfig();
      const allowedBackdateDays = leaveConfig?.allowBackdateLeaves || 0;
      
      if (allowedBackdateDays === 0) {
        return {
          success: false,
          message: 'Start date cannot be in the past',
          error: 'PAST_DATE'
        };
      } else {
        const daysDifference = Math.floor((todayUTC.getTime() - startUTC.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDifference > allowedBackdateDays) {
          return {
            success: false,
            message: `Start date cannot be more than ${allowedBackdateDays} days in the past`,
            error: 'PAST_DATE'
          };
        }
      }
    }

    if (endUTC < startUTC) {
      return {
        success: false,
        message: 'End date must be on or after start date',
        error: 'INVALID_DATE_RANGE'
      };
    }

    // Calculate working days
    const systemSettings = await SettingsService.getSystemSettings();
    const config = createWorkingDaysConfig(systemSettings, userTimezone);
    const calculationResult = calculateWorkingDays(params.startDate, params.endDate, config);
    const { totalDays, invalidDates } = calculationResult;

    if (invalidDates.length > 0) {
      logger.info('Range includes non-working days/holidays', { userId: params.userId }, { 
        invalidDatesCount: invalidDates.length 
      });
    }

    if (totalDays === 0) {
      return {
        success: false,
        message: 'No working days in the selected date range',
        error: 'NO_WORKING_DAYS'
      };
    }

    // Check leave balance
    const leaveBalance = userProfile.leaveBalance[mappedLeaveType as keyof typeof userProfile.leaveBalance];
    if (leaveBalance < totalDays) {
      return {
        success: false,
        message: `Insufficient ${mappedLeaveType} leave balance. Available: ${leaveBalance} days, Requested: ${totalDays} days`,
        error: 'INSUFFICIENT_BALANCE'
      };
    }

    // Check for overlapping leave requests
    const existingLeaves = await Leave.find({
      userId: params.userId,
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
      return {
        success: false,
        message: 'Leave request overlaps with existing approved or pending leaves',
        error: 'OVERLAPPING_LEAVE'
      };
    }

    // Create leave request
    const leave = new Leave({
      userId: params.userId,
      leaveType: mappedLeaveType,
      startDate: startUTC,
      endDate: endUTC,
      totalDays,
      reason: params.reason,
      status: 'pending',
      appliedDate: new Date(),
      userTimezone,
      isFullDay: true
    });

    await leave.save();
    
    logger.info('Leave application successful', { userId: params.userId }, {
      leaveId: leave._id.toString(),
      totalDays: leave.totalDays
    });

    // Create notifications (non-blocking)
    try {
      await NotificationService.createLeaveNotifications(leave, 'request');
    } catch (notificationError) {
      logger.error('Error creating leave notifications', { userId: params.userId }, notificationError as Error);
      // Don't fail the leave request if notifications fail
    }

    // Send emails (non-blocking)
    try {
      if (emailService.isConfigured() && userProfile.managerId) {
        const managerProfile = await UserProfile.findOne({ clerkUserId: userProfile.managerId });
        const managerEmail = managerProfile?.email;
        const employeeEmail = userProfile.email;

        if (managerEmail && employeeEmail) {
          const subject = `Leave Request: ${userProfile.firstName} ${userProfile.lastName} · ${leave.leaveType} · ${leave.totalDays} day(s)`;
          
          // Send to manager
          await emailService.sendEmail({
            to: managerEmail,
            subject,
            html: `<p>Hello ${managerProfile.firstName || 'Manager'},</p>
                   <p><strong>${userProfile.firstName} ${userProfile.lastName}</strong> has requested leave.</p>
                   <ul>
                     <li><strong>Type:</strong> ${leave.leaveType}</li>
                     <li><strong>From:</strong> ${new Date(leave.startDate).toLocaleDateString()}</li>
                     <li><strong>To:</strong> ${new Date(leave.endDate).toLocaleDateString()}</li>
                     <li><strong>Total Days:</strong> ${leave.totalDays}</li>
                   </ul>
                   <p><strong>Reason:</strong></p>
                   <blockquote>${leave.reason?.toString().replace(/\n/g, '<br/>') || '-'}</blockquote>
                   <p>Regards,<br/>HR Dashboard</p>`,
            text: `Leave Request from ${userProfile.firstName} ${userProfile.lastName}\nType: ${leave.leaveType}\nFrom: ${new Date(leave.startDate).toLocaleDateString()}\nTo: ${new Date(leave.endDate).toLocaleDateString()}\nTotal Days: ${leave.totalDays}\nReason: ${leave.reason || '-'}`,
            replyTo: employeeEmail,
          });

          // Send confirmation to employee
          await emailService.sendEmail({
            to: employeeEmail,
            subject: `Copy: ${subject}`,
            html: `<p>Hi ${userProfile.firstName},</p>
                   <p>Your leave request has been submitted and your manager has been notified.</p>
                   <p>Summary:</p>
                   <ul>
                     <li><strong>Type:</strong> ${leave.leaveType}</li>
                     <li><strong>From:</strong> ${new Date(leave.startDate).toLocaleDateString()}</li>
                     <li><strong>To:</strong> ${new Date(leave.endDate).toLocaleDateString()}</li>
                     <li><strong>Total Days:</strong> ${leave.totalDays}</li>
                   </ul>
                   <p>Regards,<br/>HR Dashboard</p>`,
          });
        }
      }
    } catch (emailError) {
      logger.error('Error sending leave emails', { userId: params.userId }, emailError as Error);
      // Don't fail the leave request if emails fail
    }

    return {
      success: true,
      message: `Leave request submitted successfully for ${totalDays} day(s)`,
      data: {
        leaveId: leave._id.toString(),
        totalDays: leave.totalDays,
        status: leave.status
      }
    };

  } catch (error) {
    logger.error('Apply leave error', { userId: params.userId }, error as Error);
    
    return {
      success: false,
      message: 'Failed to submit leave request. Please try again.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
}

export default executeApplyLeave;

