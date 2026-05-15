import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
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
    allowBackdateLeaves: number; // number of days allowed for backdated leave requests
    carryForwardEnabled: boolean;
    maxCarryForwardDays: number;
    probationPeriod: number; // in days
    leaveDefaults: {
      sick: number;
      casual: number;
      annual: number;
      maternity: number;
      paternity: number;
    };
  };
  holidays: {
    [year: string]: {
      name: string;
      date: string; // ISO date string
    }[];
  };
  attendance: {
    requireClockIn: boolean;
    requireClockOut: boolean;
    lateThreshold: number;
    earlyLeaveThreshold: number;
    overtimeEnabled: boolean;
    breakTimeEnabled: boolean;
    defaultBreakDuration: number; // in minutes
    geoLocationRequired: boolean;
    ipRestrictionEnabled: boolean;
    regularizationCutoffDays: number; // number of days before today to allow regularization requests
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
      lockoutDuration: number; // in minutes
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
  roles: {
    enabled: boolean;
    defaultRole?: string; // Default role ID for new users
  };
  updatedBy: string;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
  general: {
    companyName: { type: String, default: 'HR Dashboard' },
    companyLogo: { type: String, default: '/api/image/logo.png' },
    companyAddress: { type: String, default: '' },
    companyPhone: { type: String, default: '' },
    companyEmail: { type: String, default: '' },
    timezone: { type: String, default: 'UTC' },
    workingDays: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' }
    },
    currency: { type: String, default: 'USD' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    timeFormat: { type: String, enum: ['12h', '24h'], default: '12h' },
    language: { type: String, default: 'en' }
  },
  leave: {
    defaultLeaveTypes: { 
      type: [String], 
      default: ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Maternity Leave', 'Paternity Leave'] 
    },
    maxLeaveDays: { type: Number, default: 25 },
    requireApproval: { type: Boolean, default: true },
    allowNegativeBalance: { type: Boolean, default: false },
    allowBackdateLeaves: { type: Number, default: 1, min: 0, max: 30 },
    carryForwardEnabled: { type: Boolean, default: true },
    maxCarryForwardDays: { type: Number, default: 5 },
    probationPeriod: { type: Number, default: 90 },
    leaveDefaults: {
      type: Map,
      of: Number,
      default: new Map([
        ['sick', 10],
        ['casual', 10],
        ['annual', 20],
        ['maternity', 0],
        ['paternity', 0]
      ])
    }
  },
  holidays: {
    type: Map,
    of: [{
      name: { type: String, required: true },
      date: { type: String, required: true }
    }],
    default: new Map()
  },
  attendance: {
    requireClockIn: { type: Boolean, default: true },
    requireClockOut: { type: Boolean, default: true },
    lateThreshold: { type: Number, default: 15 },
    earlyLeaveThreshold: { type: Number, default: 15 },
    overtimeEnabled: { type: Boolean, default: true },
    breakTimeEnabled: { type: Boolean, default: true },
    defaultBreakDuration: { type: Number, default: 60 },
    geoLocationRequired: { type: Boolean, default: false },
    ipRestrictionEnabled: { type: Boolean, default: false },
    regularizationCutoffDays: { type: Number, default: 7, min: 1, max: 30 }
  },
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    slackNotifications: { type: Boolean, default: false },
    leaveApprovalReminders: { type: Boolean, default: true },
    attendanceAlerts: { type: Boolean, default: true },
    systemMaintenanceAlerts: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: false },
    monthlyReports: { type: Boolean, default: true }
  },
  security: {
    require2FA: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 480 },
    ipWhitelist: { type: [String], default: [] },
    auditLogging: { type: Boolean, default: true },
    passwordPolicy: {
      minLength: { type: Number, default: 8 },
      requireUppercase: { type: Boolean, default: true },
      requireLowercase: { type: Boolean, default: true },
      requireNumbers: { type: Boolean, default: true },
      requireSpecialChars: { type: Boolean, default: false }
    },
    loginAttempts: {
      maxAttempts: { type: Number, default: 5 },
      lockoutDuration: { type: Number, default: 30 }
    }
  },
  integrations: {
    slack: {
      enabled: { type: Boolean, default: false },
      webhookUrl: { type: String, default: '' },
      channel: { type: String, default: '' }
    },
    email: {
      enabled: { type: Boolean, default: true },
      smtpHost: { type: String, default: '' },
      smtpPort: { type: Number, default: 587 },
      smtpUser: { type: String, default: '' },
      smtpPassword: { type: String, default: '' }
    },
    calendar: {
      enabled: { type: Boolean, default: false },
      provider: { type: String, default: '' },
      apiKey: { type: String, default: '' }
    }
  },
  features: {
    voiceCommands: { type: Boolean, default: true },
    realTimeUpdates: { type: Boolean, default: true },
    advancedAnalytics: { type: Boolean, default: true },
    customReports: { type: Boolean, default: true },
    apiAccess: { type: Boolean, default: false },
    mobileApp: { type: Boolean, default: false }
  },
  roles: {
    enabled: { type: Boolean, default: true },
    defaultRole: { type: String, default: null }
  },
  updatedBy: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
});

// Ensure only one settings document exists
SystemSettingsSchema.index({}, { unique: true });

export default mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
