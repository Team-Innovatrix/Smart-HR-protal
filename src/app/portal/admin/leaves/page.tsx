'use client';

import { useEffect, useState } from 'react';
import { CheckIcon, XMarkIcon, CalendarIcon, UserIcon, CogIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import AdminSubNav from '@/components/admin/AdminSubNav';
import ConfirmationModal from '@/components/admin/ConfirmationModal';
import { useTimezone } from '@/lib/hooks/useTimezone';

interface Leave {
  _id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  leaveType: string;
  reason: string;
  status: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department: string;
    position: string;
  };
  createdAt: string;
}

interface LeavesData {
  leaves: Leave[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  overview: {
    statusCounts: Array<{ _id: string; count: number }>;
    departmentLeaveCounts: Array<{ _id: string; count: number }>;
    totalApplied: number;
  };
}

interface Holiday {
  _id: string;
  name: string;
  date: string;
  year: number;
  createdAt: string;
  updatedAt: string;
}

interface HolidaysData {
  holidays: Holiday[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  availableYears: number[];
}

export default function LeaveManagementPage() {
  const { formatDateString } = useTimezone();

  const safeFormatDate = (dateString: string, format: string) => {
    if (!dateString || dateString === 'Invalid Date') {
      return 'Invalid Date'
    }
    try {
      return formatDateString(dateString, format)
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'Invalid Date'
    }
  };
  const [activeTab, setActiveTab] = useState<'requests' | 'balance' | 'policy' | 'holidays'>('requests');
  
  // Leave Requests Tab State
  const [leavesData, setLeavesData] = useState<LeavesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeaves, setSelectedLeaves] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // User Leave Balance Tab State
  const [selectedUser, setSelectedUser] = useState<Record<string, unknown> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Record<string, unknown>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [leaveBalanceForm, setLeaveBalanceForm] = useState({
    sick: 0,
    casual: 0,
    annual: 0,
    maternity: 0,
    paternity: 0
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  
  // Leave Policy Tab State
  const [systemSettings, setSystemSettings] = useState<Record<string, unknown> | null>(null);
  const [policyForm, setPolicyForm] = useState({
    defaultLeaveTypes: ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Maternity Leave', 'Paternity Leave'],
    maxLeaveDays: 25,
    requireApproval: true,
    allowNegativeBalance: false,
    allowBackdateLeaves: 1,
    carryForwardEnabled: false,
    maxCarryForwardDays: 5,
    probationPeriod: 90,
    leaveDefaults: {} as Record<string, number>
  });
  const [isPolicySaving, setIsPolicySaving] = useState(false);

  // Holiday Management Tab State
  const [holidaysData, setHolidaysData] = useState<HolidaysData | null>(null);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const [holidaysError, setHolidaysError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: '',
    year: new Date().getFullYear()
  });
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const fetchLeaves = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedDepartment && { department: selectedDepartment }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      const response = await fetch(`/api/admin/leaves?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaves');
      }

      const data = await response.json();
      if (data.success) {
        setLeavesData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch leaves');
      }
    } catch (error) {
      console.error('Leaves fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch leaves');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter changes are now handled automatically by useEffect when filter states change

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLeaveSelection = (leaveId: string) => {
    setSelectedLeaves(prev => 
      prev.includes(leaveId) 
        ? prev.filter(id => id !== leaveId)
        : [...prev, leaveId]
    );
  };

  const handleAction = async (leaveId: string, action: 'approve' | 'reject') => {
    let reason;
    if (action === 'reject') {
      reason = window.prompt("Enter a reason for rejection (optional):");
      if (reason === null) return; // cancelled
    }
    
    try {
      const response = await fetch('/api/admin/leaves/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveIds: [leaveId],
          action,
          reason
        }),
      });

      if (response.ok) {
        fetchLeaves();
      }
    } catch (error) {
      console.error('Leave action error:', error);
    }
  };

  const handleBulkAction = async () => {
    if (selectedLeaves.length === 0) return;

    try {
      const response = await fetch('/api/admin/leaves/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveIds: selectedLeaves,
          action: bulkAction,
          reason: bulkAction === 'reject' ? rejectionReason : undefined
        }),
      });

      if (response.ok) {
        setSelectedLeaves([]);
        setShowBulkActions(false);
        fetchLeaves();
      }
    } catch (error) {
      console.error('Bulk action error:', error);
    }
  };

  // User Leave Balance Functions
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.data.users || []);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.data.users || []);
          setShowSearchResults(true);
        }
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleUserSelect = (user: Record<string, unknown>) => {
    setSelectedUser(user);
    setSearchQuery(`${user.firstName as string} ${user.lastName as string} (${user.employeeId as string})`);
    setShowSearchResults(false);
    const leaveBalance = user.leaveBalance as Record<string, unknown> || {};
    setLeaveBalanceForm({
      sick: (leaveBalance.sick as number) || 0,
      casual: (leaveBalance.casual as number) || 0,
      annual: (leaveBalance.annual as number) || 0,
      maternity: (leaveBalance.maternity as number) || 0,
      paternity: (leaveBalance.paternity as number) || 0
    });
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setSearchQuery('');
    setShowSearchResults(false);
    setLeaveBalanceForm({
      sick: 0,
      casual: 0,
      annual: 0,
      maternity: 0,
      paternity: 0
    });
  };

  const handleLeaveBalanceUpdate = async () => {
    if (!selectedUser) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveBalance: leaveBalanceForm
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update the selected user with new data
          setSelectedUser(data.data);
          alert('Leave balance updated successfully!');
        } else {
          alert(data.error || 'Failed to update leave balance');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update leave balance');
      }
    } catch (error) {
      console.error('Error updating leave balance:', error);
      alert('Failed to update leave balance');
    } finally {
      setIsUpdating(false);
    }
  };

  // Leave Policy Functions
  const fetchSystemSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSystemSettings(data.data);
          
          const defaultLeaveTypes = data.data.leave?.defaultLeaveTypes || ['Annual Leave', 'Sick Leave', 'Personal Leave', 'Maternity Leave', 'Paternity Leave'];
          const existingLeaveDefaults = data.data.leave?.leaveDefaults || {};
          
          // Create a dynamic leaveDefaults object based on current leave types
          const dynamicLeaveDefaults: Record<string, number> = {};
          defaultLeaveTypes.forEach((type: string) => {
            // Convert leave type to a key format (lowercase, replace spaces with underscores)
            const key = type.toLowerCase().replace(/\s+/g, '_');
            // Use existing value if available, otherwise use a default based on type
            dynamicLeaveDefaults[key] = existingLeaveDefaults[key] || getDefaultValueForLeaveType(type);
          });
          
          setPolicyForm({
            defaultLeaveTypes,
            maxLeaveDays: data.data.leave?.maxLeaveDays || 25,
            requireApproval: data.data.leave?.requireApproval || true,
            allowNegativeBalance: data.data.leave?.allowNegativeBalance || false,
            allowBackdateLeaves: data.data.leave?.allowBackdateLeaves || 1,
            carryForwardEnabled: data.data.leave?.carryForwardEnabled || false,
            maxCarryForwardDays: data.data.leave?.maxCarryForwardDays || 5,
            probationPeriod: data.data.leave?.probationPeriod || 90,
            leaveDefaults: dynamicLeaveDefaults
          });
        }
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
    }
  };

  // Helper function to get default values for leave types
  const getDefaultValueForLeaveType = (leaveType: string): number => {
    const type = leaveType.toLowerCase();
    if (type.includes('sick')) return 10;
    if (type.includes('casual') || type.includes('personal')) return 10;
    if (type.includes('annual') || type.includes('vacation')) return 20;
    if (type.includes('maternity')) return 0;
    if (type.includes('paternity')) return 0;
    return 5; // Default for any other leave type
  };

  const handlePolicyUpdate = async () => {
    try {
      setIsPolicySaving(true);
      
      // First get current settings to preserve other sections
      const currentResponse = await fetch('/api/admin/settings');
      let currentSettings = {};
      
      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        if (currentData.success) {
          currentSettings = currentData.data;
        }
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentSettings,
          leave: policyForm
        }),
      });

      if (response.ok) {
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
        notification.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Leave policy updated successfully!</span>
        `;
        document.body.appendChild(notification);
        
        // Remove notification after 4 seconds
        setTimeout(() => {
          notification.remove();
        }, 4000);
        
        fetchSystemSettings();
      } else {
        const errorData = await response.json();
        // Show error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
        notification.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span>Failed to update leave policy: ${errorData.error || 'Unknown error'}</span>
        `;
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
          notification.remove();
        }, 5000);
      }
    } catch (error) {
      console.error('Error updating leave policy:', error);
      // Show error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
      notification.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <span>Failed to update leave policy</span>
      `;
      document.body.appendChild(notification);
      
      // Remove notification after 5 seconds
      setTimeout(() => {
        notification.remove();
      }, 5000);
    } finally {
      setIsPolicySaving(false);
    }
  };

  // Holiday Management Functions
  const fetchHolidays = async () => {
    try {
      setHolidaysLoading(true);
      setHolidaysError(null);
      
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        page: '1',
        limit: '100'
      });

      const response = await fetch(`/api/admin/holidays?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch holidays: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setHolidaysData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch holidays');
      }
    } catch (error) {
      console.error('💥 Holidays fetch error:', error);
      setHolidaysError(error instanceof Error ? error.message : 'Failed to fetch holidays');
    } finally {
      setHolidaysLoading(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    if (activeTab === 'requests') {
      fetchLeaves();
    } else if (activeTab === 'balance') {
      fetchUsers();
    } else if (activeTab === 'policy') {
      fetchSystemSettings();
    } else if (activeTab === 'holidays') {
      fetchHolidays();
    }
  }, [activeTab, currentPage, selectedStatus, selectedDepartment, startDate, endDate, selectedYear]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setHolidayForm(prev => ({ ...prev, year }));
  };

  const handleHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!holidayForm.name.trim() || !holidayForm.date) {
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
      notification.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
        <span>Please provide both holiday name and date to continue.</span>
      `;
      document.body.appendChild(notification);
      
      // Remove notification after 4 seconds
      setTimeout(() => {
        notification.remove();
      }, 4000);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const url = editingHoliday 
        ? `/api/admin/holidays/${editingHoliday._id}`
        : '/api/admin/holidays';
      
      const method = editingHoliday ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(holidayForm),
      });

      if (!response.ok) {
        throw new Error(`Failed to save holiday: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Show success message
        const successMessage = editingHoliday 
          ? `Holiday "${holidayForm.name}" has been updated successfully.`
          : `Holiday "${holidayForm.name}" has been added to the calendar.`;
        
        // Create a professional success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
        notification.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>${successMessage}</span>
        `;
        document.body.appendChild(notification);
        
        // Remove notification after 4 seconds
        setTimeout(() => {
          notification.remove();
        }, 4000);
        
        setHolidayForm({ name: '', date: '', year: selectedYear });
        setShowHolidayForm(false);
        setEditingHoliday(null);
        fetchHolidays();
      } else {
        console.error('❌ Holiday API returned success: false', data.error);
        // Show error message
        const errorMessage = data.error || 'Unable to save holiday. Please try again.';
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
        notification.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span>${errorMessage}</span>
        `;
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
          notification.remove();
        }, 5000);
      }
    } catch (error) {
      console.error('💥 Holiday save error:', error);
      // Show error message
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
      notification.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <span>Unable to save holiday. Please check your connection and try again.</span>
      `;
      document.body.appendChild(notification);
      
      // Remove notification after 5 seconds
      setTimeout(() => {
        notification.remove();
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setHolidayForm({
      name: holiday.name,
      date: holiday.date,
      year: holiday.year
    });
    setShowHolidayForm(true);
  };

  const handleDeleteHoliday = async (holidayId: string, holidayName: string) => {
    setConfirmTitle('Delete Holiday');
    setConfirmMessage(`Are you sure you want to delete "${holidayName}"? This action cannot be undone.`);
    setConfirmAction(() => async () => {
      try {
        const response = await fetch(`/api/admin/holidays/${holidayId}`, {
          method: 'DELETE',
        });

        const data = await response.json();
        
        if (data.success) {
          // Show success message
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
          notification.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Holiday "${holidayName}" has been removed from the calendar.</span>
          `;
          document.body.appendChild(notification);
          
          // Remove notification after 4 seconds
          setTimeout(() => {
            notification.remove();
          }, 4000);
          
          fetchHolidays();
        } else {
          // Show error message
          const errorMessage = data.error || 'Unable to delete holiday. Please try again.';
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
          notification.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <span>${errorMessage}</span>
          `;
          document.body.appendChild(notification);
          
          // Remove notification after 5 seconds
          setTimeout(() => {
            notification.remove();
          }, 5000);
        }
      } catch (error) {
        console.error('Holiday deletion error:', error);
        // Show error message
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
        notification.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span>Unable to delete holiday. Please try again.</span>
        `;
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
          notification.remove();
        }, 5000);
      } finally {
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const resetHolidayForm = () => {
    setHolidayForm({ name: '', date: '', year: selectedYear });
    setShowHolidayForm(false);
    setEditingHoliday(null);
  };

  if (isLoading && !leavesData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !leavesData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading leaves</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchLeaves}
              className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as 'requests' | 'balance' | 'policy' | 'holidays');
  };

  return (
    <div className="space-y-8">
      <AdminSubNav
        title=""
        items={[
          {
            id: 'requests',
            label: 'Leave Requests',
            href: '#',
            icon: <CalendarIcon className="w-4 h-4" />,
          },
          {
            id: 'balance',
            label: 'User Leave Balance',
            href: '#',
            icon: <UserIcon className="w-4 h-4" />,
          },
          {
            id: 'policy',
            label: 'Leave Policy',
            href: '#',
            icon: <CogIcon className="w-4 h-4" />,
          },
          {
            id: 'holidays',
            label: 'Holiday Management',
            href: '#',
            icon: <CalendarIcon className="w-4 h-4" />,
          },
        ]}
        variant="tabs"
        onItemClick={handleTabChange}
        activeItem={activeTab}
      />
      
      <div>
      {activeTab === 'requests' && (
        <div className="space-y-8">
          {/* Bulk Actions Header */}
          {selectedLeaves.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex justify-end items-center">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {selectedLeaves.length} leave(s) selected
                  </span>
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Bulk Actions
                  </button>
                </div>
              </div>
            </div>
          )}

      {/* Overview Cards */}
      {leavesData && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Total Applied Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-blue-100">
                <CalendarIcon className="w-7 h-7 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applied</p>
                <p className="text-3xl font-bold text-gray-900">{leavesData.overview.totalApplied}</p>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          {leavesData.overview.statusCounts.map((status) => (
            <div key={status._id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center">
                <div className={`p-3 rounded-xl ${
                  status._id === 'pending' ? 'bg-yellow-100' :
                  status._id === 'approved' ? 'bg-green-100' :
                  status._id === 'rejected' ? 'bg-red-100' :
                  status._id === 'cancelled' ? 'bg-gray-100' : 'bg-gray-100'
                }`}>
                  <CalendarIcon className={`w-7 h-7 ${
                    status._id === 'pending' ? 'text-yellow-600' :
                    status._id === 'approved' ? 'text-green-600' :
                    status._id === 'rejected' ? 'text-red-600' :
                    status._id === 'cancelled' ? 'text-gray-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 capitalize">
                    {status._id === 'pending' ? 'Pending' :
                     status._id === 'approved' ? 'Approved' :
                     status._id === 'rejected' ? 'Rejected' :
                     status._id === 'cancelled' ? 'Cancelled' :
                     status._id} Leaves
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{status.count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1); // Reset to first page when filter changes
            }}
            className="block w-full px-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setCurrentPage(1); // Reset to first page when filter changes
            }}
            className="block w-full px-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">All Departments</option>
            {leavesData?.overview.departmentLeaveCounts.map((dept) => (
              <option key={dept._id} value={dept._id}>{dept._id}</option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1); // Reset to first page when filter changes
            }}
            className="block w-full px-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1); // Reset to first page when filter changes
            }}
            className="block w-full px-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Bulk Actions Modal */}
      {showBulkActions && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-8 border w-96 shadow-lg rounded-xl bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Bulk Actions</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value as 'approve' | 'reject')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                </select>
              </div>
              {bulkAction === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Reason for rejection..."
                  />
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowBulkActions(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAction}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    bulkAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {bulkAction === 'approve' ? 'Approve All' : 'Reject All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaves Table */}
      {leavesData && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedLeaves.length === leavesData.leaves.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLeaves(leavesData.leaves.map(leave => leave._id));
                        } else {
                          setSelectedLeaves([]);
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leavesData.leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedLeaves.includes(leave._id)}
                        onChange={() => handleLeaveSelection(leave._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {(leave.userId.firstName || '').charAt(0)}{(leave.userId.lastName || '').charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {leave.userId.firstName || 'Unknown'} {leave.userId.lastName || 'User'}
                          </div>
                          <div className="text-sm text-gray-500">{leave.userId.employeeId || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{leave.leaveType}</div>
                      <div className="text-sm text-gray-500">
                        {safeFormatDate(leave.startDate, 'MM/dd/yyyy')} - {safeFormatDate(leave.endDate, 'MM/dd/yyyy')}
                      </div>
                      <div className="text-xs text-gray-400">{leave.totalDays} days</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {leave.userId.department || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {leave.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleAction(leave._id, 'approve')}
                            className="text-green-600 hover:text-green-900 transition-colors"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleAction(leave._id, 'reject')}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {leavesData.pagination.pages > 1 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {leavesData.pagination.page} of {leavesData.pagination.pages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === leavesData.pagination.pages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
        </div>
      )}

      {/* User Leave Balance Tab */}
      {activeTab === 'balance' && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">User Leave Balance Management</h2>
            
            <div className="space-y-8">
              {/* Employee Search */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Employee</h3>
                
                {/* Search Input */}
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search by name, employee ID, or email..."
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {isSearching && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user._id as string}
                        onClick={() => handleUserSelect(user)}
                        className="p-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {(user.firstName as string || '').charAt(0)}{(user.lastName as string || '').charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.firstName as string || 'Unknown'} {user.lastName as string || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.employeeId as string || 'N/A'}</p>
                            <p className="text-xs text-gray-500 truncate">{user.department as string || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {showSearchResults && searchResults.length === 0 && !isSearching && (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No employees found matching your search.</p>
                  </div>
                )}

                {/* Selected User Display */}
                {selectedUser && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {(selectedUser.firstName as string || '').charAt(0)}{(selectedUser.lastName as string || '').charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedUser.firstName as string || 'Unknown'} {selectedUser.lastName as string || 'User'}
                          </p>
                          <p className="text-sm text-gray-500">{selectedUser.employeeId as string || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{selectedUser.department as string || 'N/A'} • {selectedUser.position as string || 'N/A'}</p>
                        </div>
                      </div>
                      <button
                        onClick={clearSelection}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {!selectedUser && !showSearchResults && (
                  <div className="text-center py-8 text-gray-500">
                    <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">Search for an employee to manage their leave balance</p>
                  </div>
                )}
              </div>

              {/* Leave Balance Form */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Leave Balance</h3>
                {selectedUser ? (
                  <div className="space-y-6">
                    {/* Current Balance Display */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Current Leave Balance</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sick Leave:</span>
                          <span className="font-medium">{(selectedUser.leaveBalance as Record<string, unknown> || {}).sick as number || 0} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Casual Leave:</span>
                          <span className="font-medium">{(selectedUser.leaveBalance as Record<string, unknown> || {}).casual as number || 0} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Annual Leave:</span>
                          <span className="font-medium">{(selectedUser.leaveBalance as Record<string, unknown> || {}).annual as number || 0} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Maternity Leave:</span>
                          <span className="font-medium">{(selectedUser.leaveBalance as Record<string, unknown> || {}).maternity as number || 0} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Paternity Leave:</span>
                          <span className="font-medium">{(selectedUser.leaveBalance as Record<string, unknown> || {}).paternity as number || 0} days</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Update Form */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Update Leave Balance</h4>
                      {Object.entries(leaveBalanceForm).map(([type, balance]) => (
                        <div key={type}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {type.charAt(0).toUpperCase() + type.slice(1)} Leave (days)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={balance}
                            onChange={(e) => setLeaveBalanceForm(prev => ({
                              ...prev,
                              [type]: parseInt(e.target.value) || 0
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder={`Enter ${type} leave days`}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleLeaveBalanceUpdate}
                        disabled={isUpdating}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        {isUpdating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          'Update Balance'
                        )}
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CogIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm">Select an employee to manage their leave balance</p>
                    <p className="text-xs text-gray-400 mt-1">Use the search bar to find employees by name, ID, or email</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Policy Tab */}
      {activeTab === 'policy' && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Leave Policy Configuration</h2>
            
            <div className="space-y-8">
              {/* Basic Leave Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Leave Days per Year
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={policyForm.maxLeaveDays}
                    onChange={(e) => setPolicyForm(prev => ({ ...prev, maxLeaveDays: parseInt(e.target.value) || 25 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Probation Period (days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={policyForm.probationPeriod}
                    onChange={(e) => setPolicyForm(prev => ({ ...prev, probationPeriod: parseInt(e.target.value) || 90 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Leave Types Management */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Leave Types
                </label>
                <div className="space-y-2">
                  {policyForm.defaultLeaveTypes.map((type, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={type}
                        onChange={(e) => {
                          const newTypes = [...policyForm.defaultLeaveTypes];
                          const oldType = newTypes[index];
                          newTypes[index] = e.target.value;
                          
                          // Update leaveDefaults to match the new type name
                          const newLeaveDefaults = { ...policyForm.leaveDefaults };
                          const oldKey = oldType.toLowerCase().replace(/\s+/g, '_');
                          const newKey = e.target.value.toLowerCase().replace(/\s+/g, '_');
                          
                          // If the key changed, update the leaveDefaults
                          if (oldKey !== newKey) {
                            if (newLeaveDefaults[oldKey] !== undefined) {
                              newLeaveDefaults[newKey] = newLeaveDefaults[oldKey];
                              delete newLeaveDefaults[oldKey];
                            } else {
                              newLeaveDefaults[newKey] = getDefaultValueForLeaveType(e.target.value);
                            }
                          }
                          
                          setPolicyForm(prev => ({ 
                            ...prev, 
                            defaultLeaveTypes: newTypes,
                            leaveDefaults: newLeaveDefaults
                          }));
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => {
                          const newTypes = policyForm.defaultLeaveTypes.filter((_, i) => i !== index);
                          const typeToRemove = policyForm.defaultLeaveTypes[index];
                          const keyToRemove = typeToRemove.toLowerCase().replace(/\s+/g, '_');
                          
                          // Remove the corresponding default value
                          const newLeaveDefaults = { ...policyForm.leaveDefaults };
                          delete newLeaveDefaults[keyToRemove];
                          
                          setPolicyForm(prev => ({ 
                            ...prev, 
                            defaultLeaveTypes: newTypes,
                            leaveDefaults: newLeaveDefaults
                          }));
                        }}
                        className="text-red-600 hover:text-red-800 px-2 py-1 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newType = 'New Leave Type';
                      const newTypes = [...policyForm.defaultLeaveTypes, newType];
                      const newKey = newType.toLowerCase().replace(/\s+/g, '_');
                      
                      // Add a default value for the new leave type
                      const newLeaveDefaults = {
                        ...policyForm.leaveDefaults,
                        [newKey]: getDefaultValueForLeaveType(newType)
                      };
                      
                      setPolicyForm(prev => ({ 
                        ...prev, 
                        defaultLeaveTypes: newTypes,
                        leaveDefaults: newLeaveDefaults
                      }));
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Add Leave Type
                  </button>
                </div>
              </div>

              {/* Default Leave Values Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Default Leave Allocations (Days per Year)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {policyForm.defaultLeaveTypes.map((leaveType) => {
                    const key = leaveType.toLowerCase().replace(/\s+/g, '_');
                    const value = policyForm.leaveDefaults[key] || 0;
                    
                    return (
                      <div key={leaveType}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {leaveType} (Days)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={value}
                          onChange={(e) => setPolicyForm(prev => ({
                            ...prev,
                            leaveDefaults: {
                              ...prev.leaveDefaults,
                              [key]: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Enter ${leaveType} leave days`}
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  These values will be used as default allocations for new employees. Each leave type above will have a corresponding default value field.
                </p>
              </div>

              {/* Policy Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Policy Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requireApproval"
                      checked={policyForm.requireApproval}
                      onChange={(e) => setPolicyForm(prev => ({ ...prev, requireApproval: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requireApproval" className="ml-2 text-sm text-gray-700">
                      Require approval for all leave requests
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowNegativeBalance"
                      checked={policyForm.allowNegativeBalance}
                      onChange={(e) => setPolicyForm(prev => ({ ...prev, allowNegativeBalance: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allowNegativeBalance" className="ml-2 text-sm text-gray-700">
                      Allow negative leave balance
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <label htmlFor="allowBackdateLeaves" className="text-sm text-gray-700">
                      Allow backdate leaves
                    </label>
                    <input
                      type="number"
                      id="allowBackdateLeaves"
                      min="0"
                      max="30"
                      value={policyForm.allowBackdateLeaves}
                      onChange={(e) => setPolicyForm(prev => ({ ...prev, allowBackdateLeaves: Math.max(0, Math.min(30, parseInt(e.target.value) || 0)) }))}
                      className="w-20 px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-xs text-gray-500">days</span>
                  </div>
                </div>
              </div>

              {/* Carry Forward Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Carry Forward Settings</h3>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="carryForwardEnabled"
                    checked={policyForm.carryForwardEnabled}
                    onChange={(e) => setPolicyForm(prev => ({ ...prev, carryForwardEnabled: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="carryForwardEnabled" className="ml-2 text-sm text-gray-700">
                    Enable leave carry forward
                  </label>
                </div>

                {policyForm.carryForwardEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Carry Forward Days
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={policyForm.maxCarryForwardDays}
                      onChange={(e) => setPolicyForm(prev => ({ ...prev, maxCarryForwardDays: parseInt(e.target.value) || 5 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handlePolicyUpdate}
                  disabled={isPolicySaving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isPolicySaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Policy Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Holiday Management Tab */}
      {activeTab === 'holidays' && (
        <div className="space-y-8">
          {/* Year Selection and Add Holiday Button */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-900">Holiday Management</h2>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Year:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                    <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => setShowHolidayForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Holiday
              </button>
            </div>
          </div>

          {/* Holiday Form Modal */}
          {showHolidayForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-8 border w-96 shadow-lg rounded-xl bg-white">
                <h3 className="text-lg font-medium text-gray-900 mb-6">
                  {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
                </h3>
                <form onSubmit={handleHolidaySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Holiday Name *
                    </label>
                    <input
                      type="text"
                      value={holidayForm.name}
                      onChange={(e) => setHolidayForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., New Year's Day, Christmas, Independence Day"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Holiday Date *
                    </label>
                    <input
                      type="date"
                      value={holidayForm.date}
                      onChange={(e) => setHolidayForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calendar Year *
                    </label>
                    <select
                      value={holidayForm.year}
                      onChange={(e) => setHolidayForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                      <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Only current and next year are allowed</p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetHolidayForm}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center font-medium"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingHoliday ? 'Updating Holiday...' : 'Adding Holiday...'}
                        </>
                      ) : (
                        editingHoliday ? 'Update Holiday' : 'Add Holiday'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Holidays List */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {holidaysLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : holidaysError ? (
              <div className="p-6 text-center">
                <div className="text-red-600 mb-2">{holidaysError}</div>
                <button
                  onClick={fetchHolidays}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Try again
                </button>
              </div>
            ) : holidaysData && holidaysData.holidays.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Holiday Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {holidaysData.holidays.map((holiday) => (
                      <tr key={holiday._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{holiday.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {(() => {
                              // Format date without timezone conversion
                              const [year, month, day] = holiday.date.split('-');
                              // const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                              return safeFormatDate(holiday.date, 'EEEE, MMMM d, yyyy');
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {holiday.year}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditHoliday(holiday)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Edit holiday"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteHoliday(holiday._id, holiday.name)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete holiday"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No holidays found for {selectedYear}</p>
                <p className="text-xs text-gray-400 mt-1">Click &quot;Add Holiday&quot; to create your first holiday</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => confirmAction?.()}
        title={confirmTitle}
        message={confirmMessage}
      />
      </div>
    </div>
  );
}

