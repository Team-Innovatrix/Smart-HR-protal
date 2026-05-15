import connectDB from './mongodb';
import Notification from '../models/Notification';
import UserProfile from '../models/UserProfile';
import { getUserLevel, getNotificationRecipients, isUrgentLeave } from '../data/leavePolicy';

export interface NotificationData {
  recipientId: string;
  senderId?: string;
  type: 'leave_request' | 'leave_approved' | 'leave_rejected' | 'leave_cancelled' | 'urgent_leave' | 'system' | 'attendance' | 'general';
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: 'leave' | 'attendance' | 'user' | 'team';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Create a single notification
   */
  static async createNotification(notificationData: NotificationData): Promise<Notification> {
    await connectDB();
    
    const notification = new Notification(notificationData);
    return await notification.save();
  }

  /**
   * Create multiple notifications at once
   */
  static async createMultipleNotifications(notificationsData: NotificationData[]): Promise<Notification[]> {
    await connectDB();
    
    const notifications = notificationsData.map(data => new Notification(data));
    return await Notification.insertMany(notifications);
  }

  /**
   * Get user's notifications
   */
  static async getUserNotifications(
    userId: string, 
    options: { 
      limit?: number; 
      offset?: number; 
      unreadOnly?: boolean;
      type?: string;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    await connectDB();
    
    const { limit = 50, offset = 0, unreadOnly = false, type } = options;
    
    const query: any = { 
      recipientId: userId,
      $or: [
        { expiresAt: { $gt: new Date() } }, // Not expired
        { expiresAt: { $exists: false } }   // No expiration set
      ]
    };
    
    if (unreadOnly) {
      query.isRead = false;
    }
    
    if (type) {
      query.type = type;
    }
    
    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit),
      Notification.countDocuments(query)
    ]);
    
    return { notifications, total };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    await connectDB();
    
    // First check if the notification exists and is not expired
    const notification = await Notification.findOne({
      _id: notificationId, 
      recipientId: userId,
      $or: [
        { expiresAt: { $gt: new Date() } }, // Not expired
        { expiresAt: { $exists: false } }   // No expiration set
      ]
    });
    
    if (!notification) {
      return null; // Notification not found or expired
    }
    
    // Mark as read
    return await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  /**
   * Mark all user notifications as read
   */
  static async markAllAsRead(userId: string): Promise<void> {
    await connectDB();
    
    await Notification.updateMany(
      { 
        recipientId: userId, 
        isRead: false,
        $or: [
          { expiresAt: { $gt: new Date() } }, // Not expired
          { expiresAt: { $exists: false } }   // No expiration set
        ]
      },
      { isRead: true, readAt: new Date() }
    );
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    await connectDB();
    
    return await Notification.countDocuments({ 
      recipientId: userId, 
      isRead: false,
      $or: [
        { expiresAt: { $gt: new Date() } }, // Not expired
        { expiresAt: { $exists: false } }   // No expiration set
      ]
    });
  }

  /**
   * Create leave-related notifications based on policy
   */
  static async createLeaveNotifications(leave: any, action: 'request' | 'approved' | 'rejected' | 'cancelled'): Promise<void> {
    await connectDB();
    
    try {
      // Get the user profile to determine user level
      const userProfile = await UserProfile.findOne({ clerkUserId: leave.userId });
      if (!userProfile) {
        console.error('User profile not found for leave notifications');
        return;
      }

      const userLevel = getUserLevel(userProfile.position);
      const isUrgent = isUrgentLeave(leave.startDate);
      const notificationRecipients = getNotificationRecipients(userLevel, leave.totalDays, isUrgent);

      const notifications: NotificationData[] = [];

      // Create notification for the manager
      if (notificationRecipients.notifyManager && userProfile.managerId) {
        const managerNotification: NotificationData = {
          recipientId: userProfile.managerId,
          senderId: leave.userId,
          type: action === 'request' ? 'leave_request' : 
                action === 'approved' ? 'leave_approved' :
                action === 'rejected' ? 'leave_rejected' : 'leave_cancelled',
          title: this.getLeaveNotificationTitle(action, userProfile.firstName, userProfile.lastName),
          message: this.getLeaveNotificationMessage(action, userProfile, leave, isUrgent),
          relatedEntityId: leave._id.toString(),
          relatedEntityType: 'leave',
          priority: isUrgent ? 'urgent' : 'high',
          metadata: {
            leaveId: leave._id.toString(),
            leaveType: leave.leaveType,
            startDate: leave.startDate,
            endDate: leave.endDate,
            totalDays: leave.totalDays,
            requesterName: `${userProfile.firstName} ${userProfile.lastName}`,
            requesterId: leave.userId,
            isUrgent
          }
        };
        notifications.push(managerNotification);
      }

      // Note: Team leader notifications have been removed - only managers are notified

      if (notifications.length > 0) {
        await this.createMultipleNotifications(notifications);
        console.log(`Created ${notifications.length} notifications for leave ${leave._id}`);
      }

    } catch (error) {
      console.error('Error creating leave notifications:', error);
    }
  }



  /**
   * Get notification title based on action
   */
  private static getLeaveNotificationTitle(
    action: string, 
    firstName: string, 
    lastName: string
  ): string {
    const name = `${firstName} ${lastName}`;
    
    switch (action) {
      case 'request':
        return `📅 Leave Request - ${name}`;
      case 'approved':
        return `✅ Leave Approved - ${name}`;
      case 'rejected':
        return `❌ Leave Rejected - ${name}`;
      case 'cancelled':
        return `🚫 Leave Cancelled - ${name}`;
      default:
        return `📅 Leave Update - ${name}`;
    }
  }

  /**
   * Get notification message based on action
   */
  private static getLeaveNotificationMessage(
    action: string, 
    userProfile: any, 
    leave: any, 
    isUrgent: boolean
  ): string {
    const name = `${userProfile.firstName} ${userProfile.lastName}`;
    const urgentSuffix = isUrgent ? ' (URGENT - Within 4 days)' : '';
    
    switch (action) {
      case 'request':
        return `${name} has requested ${leave.totalDays} days of ${leave.leaveType} leave from ${leave.startDate.toLocaleDateString()} to ${leave.endDate.toLocaleDateString()}.${urgentSuffix}`;
      case 'approved':
        return `The leave request from ${name} has been approved.`;
      case 'rejected':
        return `The leave request from ${name} has been rejected.`;
      case 'cancelled':
        return `The leave request from ${name} has been cancelled.`;
      default:
        return `There has been an update to the leave request from ${name}.`;
    }
  }

  /**
   * Clean up expired notifications (older than 30 days) for database maintenance
   * This is separate from the 2-day display filter - it just keeps the database clean
   */
  static async cleanupExpiredNotifications(): Promise<number> {
    await connectDB();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Notification.deleteMany({
      expiresAt: { $lt: thirtyDaysAgo }
    });
    
    return result.deletedCount || 0;
  }

  /**
   * Get count of expired notifications (for monitoring purposes)
   */
  static async getExpiredNotificationsCount(): Promise<number> {
    await connectDB();
    
    return await Notification.countDocuments({
      expiresAt: { $lt: new Date() }
    });
  }
}
