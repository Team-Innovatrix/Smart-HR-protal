'use client';

import { useEffect, useState } from 'react';
import { CogIcon, ShieldCheckIcon, BellIcon } from '@heroicons/react/24/outline';
import AdminSubNav from '@/components/admin/AdminSubNav';
import { GlobalImageUpload } from '@/components/global';
import TimezoneSelector from '@/components/global/TimezoneSelector';

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
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      if (data.success) {
        // Merge safe defaults for integrations and features in case API omits them
        setSettings({
          ...data.data,
          integrations: data.data.integrations || {
            slack: { enabled: false },
            email: { enabled: false },
            calendar: { enabled: false },
          },
          features: data.data.features || {
            voiceCommands: false,
            realTimeUpdates: true,
            advancedAnalytics: false,
            customReports: false,
            apiAccess: false,
            mobileApp: false,
          },
        });
      } else {
        throw new Error(data.error || 'Failed to fetch settings');
      }
    } catch (error) {
      console.error('Settings fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Show success message
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Settings save error:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (section: keyof SystemSettings, key: string, value: unknown) => {
    if (!settings) return;
    
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      };
    });
  };

  const updateSettingAndSave = async (section: keyof SystemSettings, key: string, value: unknown) => {
    if (!settings) return;
    
    // Update local state
    updateSetting(section, key, value);
    
    // Create updated settings object
    const updatedSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    };
    
    // Save to database immediately
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Settings save error:', error);
      // Revert the local state change on error
      setSettings(settings);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading settings</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchSettings}
              className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return <div>No settings available</div>;
  }

  return (
    <div className="space-y-8">
      <AdminSubNav
        title=""
        items={[
          {
            id: 'general',
            label: 'General',
            href: '#',
            icon: <CogIcon className="w-4 h-4" />,
          },
          {
            id: 'attendance',
            label: 'Attendance',
            href: '#',
            icon: <BellIcon className="w-4 h-4" />,
          },
          {
            id: 'notifications',
            label: 'Notifications',
            href: '#',
            icon: <BellIcon className="w-4 h-4" />,
          },
          {
            id: 'security',
            label: 'Security',
            href: '#',
            icon: <ShieldCheckIcon className="w-4 h-4" />,
          },
          {
            id: 'integrations',
            label: 'Integrations',
            href: '#',
            icon: <CogIcon className="w-4 h-4" />,
          },
          {
            id: 'features',
            label: 'Features',
            href: '#',
            icon: <CogIcon className="w-4 h-4" />,
          },
        ]}
        variant="tabs"
        onItemClick={(itemId) => setActiveTab(itemId as any)}
        activeItem={activeTab}
      />
      
      <div>
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">General Configuration</h3>
              
              {/* Company Logo and Name - Vertical Layout */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Logo
                  </label>
                  <div className="flex justify-center">
                    <GlobalImageUpload
                      currentImageUrl={settings.general.companyLogo}
                      onImageChange={(imageUrl) => updateSettingAndSave('general', 'companyLogo', imageUrl)}
                      size="md"
                      config={{ 
                        maxSizeInMB: 10,
                        acceptedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'],
                        uploadType: 'company-logo'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.general.companyName}
                    onChange={(e) => updateSetting('general', 'companyName', e.target.value)}
                    className="w-80 max-w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <TimezoneSelector
                    value={settings.general.timezone}
                    onChange={(timezone) => updateSetting('general', 'timezone', timezone)}
                    className="w-80 max-w-full"
                    placeholder="Select company timezone"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}


          {/* Attendance Settings */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Attendance Configuration</h3>
              
              {/* Working Hours Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Working Hours & Days</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Working Hours Start
                    </label>
                    <input
                      type="time"
                      value={settings.general.workingHours.start}
                      onChange={(e) => updateSetting('general', 'workingHours', { ...settings.general.workingHours, start: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Working Hours End
                    </label>
                    <input
                      type="time"
                      value={settings.general.workingHours.end}
                      onChange={(e) => updateSetting('general', 'workingHours', { ...settings.general.workingHours, end: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Days
                  </label>
                  <div className="flex space-x-4">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.general.workingDays.includes(day)}
                          onChange={(e) => {
                            const newDays = e.target.checked
                              ? [...settings.general.workingDays, day]
                              : settings.general.workingDays.filter(d => d !== day);
                            updateSetting('general', 'workingDays', newDays);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.attendance.requireClockIn}
                    onChange={(e) => updateSetting('attendance', 'requireClockIn', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Require Clock In</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.attendance.requireClockOut}
                    onChange={(e) => updateSetting('attendance', 'requireClockOut', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Require Clock Out</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Late Threshold (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.attendance.lateThreshold}
                    onChange={(e) => updateSetting('attendance', 'lateThreshold', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Early Leave Threshold (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.attendance.earlyLeaveThreshold}
                    onChange={(e) => updateSetting('attendance', 'earlyLeaveThreshold', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.attendance.overtimeEnabled}
                    onChange={(e) => updateSetting('attendance', 'overtimeEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Enable Overtime Tracking</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.attendance.geoLocationRequired}
                    onChange={(e) => updateSetting('attendance', 'geoLocationRequired', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Location Required</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.attendance.ipRestrictionEnabled}
                    onChange={(e) => updateSetting('attendance', 'ipRestrictionEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">IP Restriction Enabled</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.attendance.breakTimeEnabled}
                    onChange={(e) => updateSetting('attendance', 'breakTimeEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Enable Break Time Tracking</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.attendance.defaultBreakDuration}
                    onChange={(e) => updateSetting('attendance', 'defaultBreakDuration', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    max="480"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Regularization Cutoff (days)
                  </label>
                  <input
                    type="number"
                    value={settings.attendance.regularizationCutoffDays}
                    onChange={(e) => updateSetting('attendance', 'regularizationCutoffDays', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    max="30"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Number of days before today that employees can request regularization for missing attendance
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => updateSetting('notifications', 'emailNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Enable Email Notifications</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.slackNotifications}
                    onChange={(e) => updateSetting('notifications', 'slackNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Enable Slack Notifications</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.leaveApprovalReminders}
                    onChange={(e) => updateSetting('notifications', 'leaveApprovalReminders', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Leave Approval Reminders</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.attendanceAlerts}
                    onChange={(e) => updateSetting('notifications', 'attendanceAlerts', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Attendance Alerts</label>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Security Configuration</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security.require2FA}
                    onChange={(e) => updateSetting('security', 'require2FA', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Require Two-Factor Authentication</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security.auditLogging}
                    onChange={(e) => updateSetting('security', 'auditLogging', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Enable Audit Logging</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IP Whitelist (one per line)
                  </label>
                  <textarea
                    value={settings.security.ipWhitelist.join('\n')}
                    onChange={(e) => updateSetting('security', 'ipWhitelist', e.target.value.split('\n').filter(ip => ip.trim()))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="192.168.1.1&#10;10.0.0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to allow all IPs</p>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Integrations Settings */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Integration Configuration</h3>
              
              {/* Slack Integration */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Slack Integration</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.integrations.slack.enabled}
                      onChange={(e) => updateSetting('integrations', 'slack', { ...settings.integrations.slack, enabled: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Enable Slack Integration</label>
                  </div>
                  
                  {settings.integrations.slack.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Webhook URL
                        </label>
                        <input
                          type="url"
                          value={settings.integrations.slack.webhookUrl || ''}
                          onChange={(e) => updateSetting('integrations', 'slack', { ...settings.integrations.slack, webhookUrl: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://hooks.slack.com/services/..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Channel
                        </label>
                        <input
                          type="text"
                          value={settings.integrations.slack.channel || ''}
                          onChange={(e) => updateSetting('integrations', 'slack', { ...settings.integrations.slack, channel: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="#hr-notifications"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Integration */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Email Configuration</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.integrations.email.enabled}
                      onChange={(e) => updateSetting('integrations', 'email', { ...settings.integrations.email, enabled: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Enable Email Notifications</label>
                  </div>
                  
                  {settings.integrations.email.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Host
                        </label>
                        <input
                          type="text"
                          value={settings.integrations.email.smtpHost || ''}
                          onChange={(e) => updateSetting('integrations', 'email', { ...settings.integrations.email, smtpHost: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Port
                        </label>
                        <input
                          type="number"
                          value={settings.integrations.email.smtpPort || 587}
                          onChange={(e) => updateSetting('integrations', 'email', { ...settings.integrations.email, smtpPort: parseInt(e.target.value) })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP User
                        </label>
                        <input
                          type="email"
                          value={settings.integrations.email.smtpUser || ''}
                          onChange={(e) => updateSetting('integrations', 'email', { ...settings.integrations.email, smtpUser: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="noreply@company.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Password
                        </label>
                        <input
                          type="password"
                          value={settings.integrations.email.smtpPassword || ''}
                          onChange={(e) => updateSetting('integrations', 'email', { ...settings.integrations.email, smtpPassword: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Features Settings */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Feature Flags</h3>
              <p className="text-sm text-gray-600">Enable or disable specific features for your organization.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Voice Commands</h4>
                    <p className="text-sm text-gray-600">Allow users to use voice commands for attendance</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.features.voiceCommands}
                      onChange={(e) => updateSetting('features', 'voiceCommands', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Real-time Updates</h4>
                    <p className="text-sm text-gray-600">Enable real-time notifications and updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.features.realTimeUpdates}
                      onChange={(e) => updateSetting('features', 'realTimeUpdates', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Advanced Analytics</h4>
                    <p className="text-sm text-gray-600">Enable detailed analytics and reporting</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.features.advancedAnalytics}
                      onChange={(e) => updateSetting('features', 'advancedAnalytics', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Custom Reports</h4>
                    <p className="text-sm text-gray-600">Allow users to create custom reports</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.features.customReports}
                      onChange={(e) => updateSetting('features', 'customReports', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">API Access</h4>
                    <p className="text-sm text-gray-600">Enable API access for integrations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.features.apiAccess}
                      onChange={(e) => updateSetting('features', 'apiAccess', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Mobile App</h4>
                    <p className="text-sm text-gray-600">Enable mobile app features</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.features.mobileApp}
                      onChange={(e) => updateSetting('features', 'mobileApp', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
