export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Leave from '../../../../models/Leave';
import UserProfile from '../../../../models/UserProfile';
import { authenticateRequest, verifyUserAccess, createUnauthorizedResponse, createForbiddenResponse } from '../../../../lib/auth';
import { emailService } from '../../../../lib/emailService';

// Approve or reject leave request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ leaveId: string }> }
) {
  try {
    // Authenticate the request
    try {
      await authenticateRequest(request);
    } catch {
      return createUnauthorizedResponse('Please sign in to access this feature');
    }
    
    await connectDB();
    
    const { leaveId } = await params;
    const body = await request.json();
    const { action, approverId, rejectionReason } = body;
    
    if (!action || !approverId) {
      return NextResponse.json(
        { success: false, message: 'Action and approver ID are required' },
        { status: 400 }
      );
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Use "approve" or "reject"' },
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
    
    if (leave.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Leave request is not pending' },
        { status: 400 }
      );
    }
    
    // Verify approver has permission (only managers/HR can approve leaves)
    // For now, we'll allow any authenticated user to approve, but in production
    // you should check if the approver is actually a manager/HR
    if (!(await verifyUserAccess(request, leave.userId, 'manager'))) {
      return createForbiddenResponse('Only managers and HR can approve leave requests');
    }
    
    if (action === 'approve') {
      // Approve the leave
      leave.status = 'approved';
      leave.approvedBy = approverId;
      
      // Update leave balance
      const userProfile = await UserProfile.findOne({ clerkUserId: leave.userId });
      if (userProfile) {
        const leaveType = leave.leaveType as keyof typeof userProfile.leaveBalance;
        if (userProfile.leaveBalance[leaveType] !== undefined) {
          userProfile.leaveBalance[leaveType] -= leave.totalDays;
          await userProfile.save();
        }

        // Send approval email to employee (non-blocking)
        try {
          const configured = emailService.isConfigured();
          console.log('[Leaves:[leaveId] PUT] Email configured?', configured);
          if (configured) {
            const subject = `Leave Approved: ${leave.leaveType} · ${leave.totalDays} day(s)`;
            const html = `<p>Hi ${userProfile.firstName},</p>
                          <p>Your leave request has been <strong>approved</strong>.</p>
                          <ul>
                            <li><strong>Type:</strong> ${leave.leaveType}</li>
                            <li><strong>From:</strong> ${new Date(leave.startDate).toLocaleDateString()}</li>
                            <li><strong>To:</strong> ${new Date(leave.endDate).toLocaleDateString()}</li>
                            <li><strong>Total Days:</strong> ${leave.totalDays}</li>
                          </ul>
                          <p>Reason:</p>
                          <blockquote>${leave.reason?.toString().replace(/\n/g, '<br/>') || '-'}</blockquote>
                          <p style="margin-top: 20px;">
                            <a href="https://portal.inovatrix.io/leaves" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View My Leaves</a>
                          </p>
                          <p>Have a great time.<br/>HR Dashboard</p>`;
            console.log('[Leaves:[leaveId] PUT] Sending approval email to employee', { to: userProfile.email });
            await emailService.sendEmail({
              to: userProfile.email,
              subject,
              html,
              text: `Your leave request has been approved.\nType: ${leave.leaveType}\nFrom: ${new Date(leave.startDate).toLocaleDateString()}\nTo: ${new Date(leave.endDate).toLocaleDateString()}\nTotal Days: ${leave.totalDays}\nReason: ${leave.reason || '-'}`,
            });
            console.log('[Leaves:[leaveId] PUT] Approval email sent');
          }
        } catch (emailError) {
          console.error('[Leaves:[leaveId] PUT] Error sending approval email:', emailError);
        }
      }
      
    } else if (action === 'reject') {
      // Reject the leave
      leave.status = 'rejected';
      leave.approvedBy = approverId;
      leave.rejectionReason = rejectionReason || 'No reason provided';

      // Send rejection email to employee (non-blocking)
      try {
        const configured = emailService.isConfigured();
        console.log('[Leaves:[leaveId] PUT] Email configured?', configured);
        if (configured) {
          // Fetch employee profile to personalize email
          const userProfile = await UserProfile.findOne({ clerkUserId: leave.userId });
          const subject = `Leave Rejected: ${leave.leaveType} · ${leave.totalDays} day(s)`;
          const html = `<p>Hi ${userProfile?.firstName || 'there'},</p>
                        <p>Your leave request has been <strong>rejected</strong>.</p>
                        <ul>
                          <li><strong>Type:</strong> ${leave.leaveType}</li>
                          <li><strong>From:</strong> ${new Date(leave.startDate).toLocaleDateString()}</li>
                          <li><strong>To:</strong> ${new Date(leave.endDate).toLocaleDateString()}</li>
                          <li><strong>Total Days:</strong> ${leave.totalDays}</li>
                        </ul>
                        <p><strong>Rejection Reason:</strong></p>
                        <blockquote>${(leave.rejectionReason || 'No reason provided').toString().replace(/\n/g, '<br/>')}</blockquote>
                        <p style="margin-top: 20px;">
                          <a href="https://portal.inovatrix.io/leaves" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View My Leaves</a>
                        </p>
                        <p>Regards,<br/>HR Dashboard</p>`;
          console.log('[Leaves:[leaveId] PUT] Sending rejection email to employee', { to: userProfile?.email });
          await emailService.sendEmail({
            to: userProfile?.email || '',
            subject,
            html,
            text: `Your leave request has been rejected.\nType: ${leave.leaveType}\nFrom: ${new Date(leave.startDate).toLocaleDateString()}\nTo: ${new Date(leave.endDate).toLocaleDateString()}\nTotal Days: ${leave.totalDays}\nReason: ${leave.rejectionReason || 'No reason provided'}`,
          });
          console.log('[Leaves:[leaveId] PUT] Rejection email sent');
        }
      } catch (emailError) {
        console.error('[Leaves:[leaveId] PUT] Error sending rejection email:', emailError);
      }
    }
    
    await leave.save();
    
    return NextResponse.json({
      success: true,
      message: `Leave request ${action}d successfully`,
      data: leave
    });
    
  } catch (error) {
    console.error('Error processing leave request:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process leave request',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get specific leave request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leaveId: string }> }
) {
  try {
    // Authenticate the request
    try {
      await authenticateRequest(request);
    } catch {
      return createUnauthorizedResponse('Please sign in to access this feature');
    }
    
    await connectDB();
    
    const { leaveId } = await params;
    
    // Find the leave request
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return NextResponse.json(
        { success: false, message: 'Leave request not found' },
        { status: 404 }
      );
    }
    
    // Verify user can only access their own data (or managers/HR can access all)
    if (!(await verifyUserAccess(request, leave.userId))) {
      return createForbiddenResponse('You can only access your own leave data');
    }
    
    return NextResponse.json({
      success: true,
      data: leave
    });
    
  } catch (error) {
    console.error('Error fetching leave request:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch leave request',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
