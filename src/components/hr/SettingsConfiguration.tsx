'use client';

import { useState, useEffect } from 'react';
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';;
import { 
  Cog6ToothIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  UserIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  ChartBarIcon,
  ClockIcon,
  CalendarIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import TimezoneSelector from '../global/TimezoneSelector';
import { formInputs, buttons } from '@/lib/utils';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  attendanceReminders: boolean;
  leaveUpdates: boolean;
  systemAlerts: boolean;
  weeklyReports: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  loginNotifications: boolean;
  deviceManagement: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

const SettingsConfiguration: React.FC = () => {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    sms: false,
    attendanceReminders: true,
    leaveUpdates: true,
    systemAlerts: true,
    weeklyReports: false
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginNotifications: true,
    deviceManagement: true
  });

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load settings from database on component mount
  useEffect(() => {
    if (!isLoaded) return
    
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/user/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setNotificationSettings(data.data.notifications);
            setSecuritySettings(data.data.security);
            setAppearanceSettings(data.data.appearance);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Continue with default settings if loading fails
      }
    };

    loadSettings();
  }, [isLoaded]);

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'appearance', label: 'Appearance', icon: Cog6ToothIcon }
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' }
  ];

  // Timezone selector will fetch timezones from API

  const dateFormats = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' }
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notifications: notificationSettings,
          security: securitySettings,
          appearance: appearanceSettings,
          preferences: {
            dashboardLayout: 'default',
            defaultView: 'dashboard',
            autoRefresh: true,
            compactMode: false
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await response.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Settings save error:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) {
      alert('User not found. Please sign in again.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);
    try {
      await user.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password updated successfully');
    } catch (error: any) {
      console.error('Password update error:', error);
      if (error.errors && error.errors.length > 0) {
        alert(`Password update failed: ${error.errors[0].message}`);
      } else {
        alert('Password update failed. Please check your current password and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderNotificationsTab = () => (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
            <BellIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <span className="text-sm sm:text-base">Notification Channels</span>
        </h3>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between p-4 sm:p-6 glass rounded-lg sm:rounded-xl border border-blue-500/20 hover:shadow-md transition-all duration-200">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">Email Notifications</h4>
              <p className="text-xs sm:text-sm text-gray-600">Receive notifications via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-3">
              <input
                type="checkbox"
                checked={notificationSettings.email}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, email: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 sm:p-6 glass rounded-lg sm:rounded-xl border border-purple-500/20 hover:shadow-md transition-all duration-200">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">SMS Notifications</h4>
              <p className="text-xs sm:text-sm text-gray-600">Receive notifications via SMS</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-3">
              <input
                type="checkbox"
                checked={notificationSettings.sms}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, sms: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
            <BellIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <span className="text-sm sm:text-base">Notification Types</span>
        </h3>
        <div className="grid gap-3 sm:gap-6 sm:grid-cols-2">
          <div className="flex items-center justify-between p-4 sm:p-6 glass rounded-lg sm:rounded-xl border border-green-500/20 hover:shadow-md transition-all duration-200">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">Attendance Reminders</h4>
              <p className="text-xs sm:text-sm text-gray-600">Daily clock in/out reminders</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-3">
              <input
                type="checkbox"
                checked={notificationSettings.attendanceReminders}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, attendanceReminders: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 sm:p-6 glass rounded-lg sm:rounded-xl border border-orange-500/20 hover:shadow-md transition-all duration-200">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">Leave Updates</h4>
              <p className="text-xs sm:text-sm text-gray-600">Leave request status changes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-3">
              <input
                type="checkbox"
                checked={notificationSettings.leaveUpdates}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, leaveUpdates: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 sm:p-6 glass rounded-lg sm:rounded-xl border border-purple-500/20 hover:shadow-md transition-all duration-200 sm:col-span-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">Weekly Reports</h4>
              <p className="text-xs sm:text-sm text-gray-600">Weekly summary reports</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-3">
              <input
                type="checkbox"
                checked={notificationSettings.weeklyReports}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, weeklyReports: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center shadow-lg">
            <ShieldCheckIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <span className="text-sm sm:text-base">Change Password</span>
        </h3>
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 glass rounded-lg sm:rounded-xl border border-red-500/20">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className={formInputs.input}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? <EyeSlashIcon className="w-4 h-4 text-gray-400" /> : <EyeIcon className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className={formInputs.input}
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className={formInputs.input}
              placeholder="Confirm new password"
            />
          </div>

          <button
            onClick={handlePasswordChange}
            disabled={loading}
            className={`${buttons.primary} w-full`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="hidden sm:inline">Updating...</span>
                <span className="sm:hidden">Update</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Update Password</span>
                <span className="sm:hidden">Update</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
            <Cog6ToothIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <span className="text-sm sm:text-base">Theme & Display</span>
        </h3>
        <div className="space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-6 glass rounded-lg sm:rounded-xl border border-purple-500/20 hover:shadow-md transition-all duration-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select
              value={appearanceSettings.theme}
              onChange={(e) => setAppearanceSettings({ ...appearanceSettings, theme: e.target.value as 'light' | 'dark' | 'auto' })}
              className={formInputs.select}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          <div className="p-4 sm:p-6 glass rounded-lg sm:rounded-xl border border-blue-500/20 hover:shadow-md transition-all duration-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={appearanceSettings.language}
              onChange={(e) => setAppearanceSettings({ ...appearanceSettings, language: e.target.value })}
              className={formInputs.select}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          <div className="p-4 sm:p-6 glass rounded-lg sm:rounded-xl border border-green-500/20 hover:shadow-md transition-all duration-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <TimezoneSelector
              value={appearanceSettings.timezone}
              onChange={(timezone) => setAppearanceSettings({ ...appearanceSettings, timezone })}
              placeholder="Select your timezone"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 sm:p-6 glass rounded-lg sm:rounded-xl border border-orange-500/20 hover:shadow-md transition-all duration-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select
                value={appearanceSettings.dateFormat}
                onChange={(e) => setAppearanceSettings({ ...appearanceSettings, dateFormat: e.target.value })}
                className={formInputs.select}
              >
                {dateFormats.map(format => (
                  <option key={format.value} value={format.value}>{format.label}</option>
                ))}
              </select>
            </div>

            <div className="p-4 sm:p-6 glass rounded-lg sm:rounded-xl border border-indigo-500/20 hover:shadow-md transition-all duration-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
              <select
                value={appearanceSettings.timeFormat}
                onChange={(e) => setAppearanceSettings({ ...appearanceSettings, timeFormat: e.target.value as '12h' | '24h' })}
                className={formInputs.select}
              >
                <option value="12h">12-hour (AM/PM)</option>
                <option value="24h">24-hour</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  const renderTabContent = () => {
    switch (activeTab) {
      case 'notifications':
        return renderNotificationsTab();
      case 'security':
        return renderSecurityTab();
      case 'appearance':
        return renderAppearanceTab();
      default:
        return renderNotificationsTab();
    }
  };

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="glass-strong p-4 sm:p-6 relative overflow-hidden group">
        {/* Modern geometric pattern decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg rotate-45"></div>
          <div className="absolute top-8 right-8 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full"></div>
          <div className="absolute top-12 right-12 w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col gap-4">
            <nav className="flex flex-wrap gap-2 sm:gap-4 overflow-x-auto pb-2 sm:pb-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 sm:gap-3 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/60 backdrop-blur-sm'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
            {saved && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-green-200">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">Settings saved!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="glass-strong p-4 sm:p-6 lg:p-8 relative overflow-hidden group">
        {/* Modern diagonal pattern decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 transform rotate-12 rounded-lg"></div>
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 transform -rotate-12 rounded-lg"></div>
          <div className="absolute top-8 right-8 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 transform rotate-45 rounded-lg"></div>
        </div>
        
        <div className="relative z-10">
          {renderTabContent()}
        </div>
      </div>

      {/* Save Button */}
      <div className="glass-strong p-4 sm:p-6 relative overflow-hidden group">
        {/* Modern zigzag pattern decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
          <div className="absolute top-0 right-0 w-20 h-4 bg-gradient-to-r from-blue-500 to-indigo-600 transform rotate-12"></div>
          <div className="absolute top-4 right-4 w-16 h-4 bg-gradient-to-r from-purple-500 to-pink-600 transform -rotate-12"></div>
          <div className="absolute top-8 right-8 w-12 h-4 bg-gradient-to-r from-green-500 to-emerald-600 transform rotate-12"></div>
          <div className="absolute top-12 right-12 w-8 h-4 bg-gradient-to-r from-blue-500 to-purple-600 transform -rotate-12"></div>
        </div>
        
        <div className="relative z-10 flex justify-center sm:justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className={`${buttons.primary} w-full sm:w-auto`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 h-5 w-4 w-5 border-b-2 border-white"></div>
                <span className="hidden sm:inline">Saving...</span>
                <span className="sm:hidden">Save</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Save Settings</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsConfiguration;
