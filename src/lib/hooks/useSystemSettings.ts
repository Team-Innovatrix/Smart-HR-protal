import { useState, useEffect } from 'react';

interface SystemSettings {
  general: {
    companyName: string;
    companyLogo?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    timezone: string;
    workingDays: string[];
    workingHours: {
      start: string;
      end: string;
    };
    currency: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    language: string;
  };
  leave: {
    defaultLeaveTypes: string[];
    maxLeaveDays: number;
    requireApproval: boolean;
    allowNegativeBalance: boolean;
    allowBackdateLeaves: number;
    carryForwardEnabled: boolean;
    maxCarryForwardDays: number;
    probationPeriod: number;
  };
  attendance: {
    requireClockIn: boolean;
    requireClockOut: boolean;
    lateThreshold: number;
    earlyLeaveThreshold: number;
    overtimeEnabled: boolean;
    breakTimeEnabled: boolean;
    defaultBreakDuration: number;
    geoLocationRequired: boolean;
    ipRestrictionEnabled: boolean;
    regularizationCutoffDays: number;
  };
  notifications: {
    emailNotifications: boolean;
    slackNotifications: boolean;
    leaveApprovalReminders: boolean;
    attendanceAlerts: boolean;
    systemMaintenanceAlerts: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
  };
  security: {
    require2FA: boolean;
    sessionTimeout: number;
    ipWhitelist: string[];
    auditLogging: boolean;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
    loginAttempts: {
      maxAttempts: number;
      lockoutDuration: number;
    };
  };
  integrations: {
    slack: {
      enabled: boolean;
      webhookUrl?: string;
      channel?: string;
    };
    email: {
      enabled: boolean;
      smtpHost?: string;
      smtpPort?: number;
      smtpUser?: string;
      smtpPassword?: string;
    };
    calendar: {
      enabled: boolean;
      provider?: string;
      apiKey?: string;
    };
  };
  features: {
    voiceCommands: boolean;
    realTimeUpdates: boolean;
    advancedAnalytics: boolean;
    customReports: boolean;
    apiAccess: boolean;
    mobileApp: boolean;
  };
  updatedBy: string;
  updatedAt: string;
}

/**
 * Read-only hook for accessing system settings
 * Settings can only be modified by HR managers through the admin panel
 */
export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try public settings first (for all users)
      let response = await fetch('/api/settings');
      
      // If public settings fail, try admin settings (for HR managers)
      if (!response.ok) {
        response = await fetch('/api/admin/settings');
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch settings');
      }
    } catch (error) {
      console.error('Settings fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch settings');
      
      // Set default settings if fetch fails
      setSettings({
        general: {
          companyName: 'HR Dashboard',
          companyLogo: '/api/image/logo.png',
          companyAddress: '',
          companyPhone: '',
          companyEmail: '',
          timezone: 'UTC',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          workingHours: { start: '09:00', end: '17:00' },
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h' as const,
          language: 'en'
        },
        leave: {
          defaultLeaveTypes: ['Annual Leave', 'Sick Leave', 'Personal Leave'],
          maxLeaveDays: 25,
          requireApproval: true,
          allowNegativeBalance: false,
          allowBackdateLeaves: 1,
          carryForwardEnabled: true,
          maxCarryForwardDays: 5,
          probationPeriod: 90
        },
        attendance: {
          requireClockIn: true,
          requireClockOut: true,
          lateThreshold: 15,
          earlyLeaveThreshold: 15,
          overtimeEnabled: true,
          breakTimeEnabled: true,
          defaultBreakDuration: 60,
          geoLocationRequired: false,
          ipRestrictionEnabled: false,
          regularizationCutoffDays: 7
        },
        notifications: {
          emailNotifications: true,
          slackNotifications: false,
          leaveApprovalReminders: true,
          attendanceAlerts: true,
          systemMaintenanceAlerts: true,
          weeklyReports: false,
          monthlyReports: true
        },
        security: {
          require2FA: false,
          sessionTimeout: 480,
          ipWhitelist: [],
          auditLogging: true,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false
          },
          loginAttempts: {
            maxAttempts: 5,
            lockoutDuration: 30
          }
        },
        integrations: {
          slack: { enabled: false, webhookUrl: '', channel: '' },
          email: { enabled: true, smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '' },
          calendar: { enabled: false, provider: '', apiKey: '' }
        },
        features: {
          voiceCommands: true,
          realTimeUpdates: true,
          advancedAnalytics: true,
          customReports: true,
          apiAccess: false,
          mobileApp: false
        },
        updatedBy: 'system',
        updatedAt: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
    error
    // Note: This hook is read-only. Settings can only be modified by HR managers through the admin panel.
  };
}
