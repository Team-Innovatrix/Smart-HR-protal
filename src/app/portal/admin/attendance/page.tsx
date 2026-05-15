'use client';

import { useEffect, useState, useCallback } from 'react';
import { ClockIcon, CalendarIcon, ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTimezone } from '@/lib/hooks/useTimezone';
import AdminSubNav from '@/components/admin/AdminSubNav';
import AdminRegularizationModal from '@/components/admin/AdminRegularizationModal';

interface Attendance {
  _id: string;
  date: string;
  status: string;
  clockIn?: string;
  clockOut?: string;
  totalHours?: number;
  notes?: string;
  sessions?: Array<{
    _id: string;
    clockIn: string;
    clockOut?: string;
    duration?: number;
    notes?: string;
  }>;
  userId: string; // Clerk user ID string
  user: {
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
    department: string;
    position: string;
  };
}

interface AttendanceData {
  attendance: Attendance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  overview: {
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalOnLeave: number;
    averageHours: number;
  };
  departmentStats: Array<{ _id: string; present: number; absent: number; late: number }>;
}

interface PayrollData {
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  present: number;
  regularized: number;
  holiday: number;
  weekend: number;
  absent: number;
  halfDay: number;
  late: number;
  earlyLeave: number;
  clockOutMissing: number;
  workedDays: number;
}

export default function AttendanceManagementPage() {
  const { formatTime, formatDateString, getTodayDateString, getToday, parseDateString } = useTimezone();
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'payroll' | 'sheet'>('summary');
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('2025-09'); // Default to September 2025 where we have data
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [regularizationModal, setRegularizationModal] = useState<{
    isOpen: boolean;
    record: Attendance | null;
  }>({ isOpen: false, record: null });

  const safeFormatDate = (dateString: string, format: string) => {
    if (!dateString || dateString === 'Invalid Date' || dateString === 'null' || dateString === 'undefined') {
      return 'Invalid Date'
    }
    
    // Try to parse the date string
    let date: Date
    try {
      if (typeof dateString === 'string') {
        // Handle various date formats
        if (dateString.includes('T')) {
          // ISO string
          date = new Date(dateString)
        } else if (dateString.includes('-')) {
          // Date string (YYYY-MM-DD)
          date = parseDateString(dateString)
        } else {
          // Try parsing as is
          date = new Date(dateString)
        }
      } else {
        date = new Date(dateString)
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString)
        return 'Invalid Date'
      }
      
      // Double-check the ISO string is valid
      const isoString = date.toISOString()
      if (!isoString || isoString === 'Invalid Date') {
        console.error('Invalid ISO string generated:', { dateString, date, isoString })
        return 'Invalid Date'
      }
      
      return formatDateString(isoString, format)
    } catch (error) {
      console.error('Error in safeFormatDate:', { dateString, error })
      return 'Invalid Date'
    }
  };
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Set default date range to last 30 days to show more attendance records
  const thirtyDaysAgo = getToday();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState(getTodayDateString());
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);

  // Update departments when attendance data changes
  useEffect(() => {
    if (attendanceData?.departmentStats) {
      const departmentNames = attendanceData.departmentStats.map(dept => dept._id);
      setDepartments(departmentNames);
      
      // Reset selected department if it's not in the current filtered results
      if (selectedDepartment && !departmentNames.includes(selectedDepartment)) {
        setSelectedDepartment('');
      }
    }
  }, [attendanceData, selectedDepartment]);

  const fetchAttendance = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(selectedDepartment && { department: selectedDepartment }),
        ...(selectedStatus && { status: selectedStatus })
      });

      // Add cache-busting parameter if force refresh is requested
      if (forceRefresh) {
        params.append('_t', Date.now().toString());
      }

      const response = await fetch(`/api/admin/attendance?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      const data = await response.json();
      if (data.success) {
        setAttendanceData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch attendance');
      }
    } catch (error) {
      console.error('Attendance fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch attendance');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, startDate, endDate, selectedDepartment, selectedStatus]);

  const fetchPayrollData = useCallback(async () => {
    try {
      setPayrollLoading(true);
      const response = await fetch(`/api/admin/payroll?month=${selectedMonth}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setPayrollData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch payroll data');
      }
    } catch (error) {
      console.error('Payroll fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch payroll data');
    } finally {
      setPayrollLoading(false);
    }
  }, [selectedMonth]);

  // Fetch data when filters change
  useEffect(() => {
    if (activeTab === 'summary') {
      fetchAttendance();
    } else if (activeTab === 'payroll') {
      fetchPayrollData();
    }
  }, [activeTab, currentPage, startDate, endDate, selectedDepartment, selectedStatus, selectedMonth, fetchAttendance, fetchPayrollData]);

  // Filter changes are now handled automatically by useEffect when filter states change

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewSessions = (record: Attendance) => {
    setSelectedRecord(record);
    setShowSessionsModal(true);
  };

  const closeSessionsModal = () => {
    setSelectedRecord(null);
    setShowSessionsModal(false);
  };

  const handleRegularize = (record: Attendance) => {
    setRegularizationModal({ isOpen: true, record });
  };

  // Check if a record can be regularized
  const canRegularize = (record: Attendance) => {
    // Don't show regularization option if status is regularized, present, full day, holiday, or weekly-off
    if (record.status === 'regularized' || 
        record.status === 'present' || 
        record.status === 'full-day' || 
        record.status === 'holiday' || 
        record.status === 'weekly-off') {
      return false;
    }
    return true;
  };

  const handleConfirmRegularize = async () => {
    if (!regularizationModal.record) return;

    try {
      const response = await fetch('/api/admin/attendance', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendanceId: regularizationModal.record._id,
          updates: {
            status: 'regularized',
            notes: regularizationModal.record.notes ? `${regularizationModal.record.notes} (Regularized by Admin)` : 'Regularized by Admin'
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Force refresh the attendance data to bypass cache
        await fetchAttendance(true);
      } else {
        throw new Error(data.error || 'Failed to regularize attendance');
      }
    } catch (error) {
      console.error('Regularize attendance error:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  const exportAttendanceData = () => {
    if (!attendanceData) return;

    // Export daily attendance records
    const headers = ['Employee ID', 'Date', 'Status', 'Clock In', 'Clock Out', 'Total Hours', 'Notes', 'Sessions Count'];
    const csvContent = [
      headers.join(','),
      ...attendanceData.attendance.map(record => [
        record.userId.substring(0, 8), // Show first 8 chars of Clerk user ID
        safeFormatDate(record.date, 'MM/dd/yyyy'),
        record.status === 'full-day' ? 'Full Day' : 
        record.status === 'half-day' ? 'Half Day' : 
        record.status === 'absent' ? 'Absent' : 
        record.status,
        record.clockIn ? formatTime(new Date(record.clockIn), 'hh:mm a') : '-',
        record.clockOut ? formatTime(new Date(record.clockOut), 'hh:mm a') : '-',
        record.totalHours ? `${record.totalHours.toFixed(2)}h` : '-',
        record.notes || '-',
        record.sessions ? record.sessions.length.toString() : '0'
      ].join(','))
    ].join('\n');
    
    const filename = `attendance_${startDate}_to_${endDate}.csv`;

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPayrollData = () => {
    if (!payrollData || payrollData.length === 0) return;

    // Export payroll data
    const headers = [
      'Employee ID', 
      'Employee Name', 
      'Department', 
      'Position',
      'Present', 
      'Regularized', 
      'Holiday', 
      'Weekend', 
      'Absent', 
      'Half Day', 
      'Late', 
      'Early Leave', 
      'Clock-out Missing', 
      'Worked Days'
    ];
    
    const csvContent = [
      headers.join(','),
      ...payrollData.map(employee => [
        employee.employeeId,
        `"${employee.employeeName}"`, // Wrap in quotes in case name contains commas
        `"${employee.department}"`,
        `"${employee.position}"`,
        employee.present.toString(),
        employee.regularized.toString(),
        employee.holiday.toString(),
        employee.weekend.toString(),
        employee.absent.toString(),
        employee.halfDay.toString(),
        employee.late.toString(),
        employee.earlyLeave.toString(),
        employee.clockOutMissing.toString(),
        employee.workedDays.toString()
      ].join(','))
    ].join('\n');
    
    const filename = `payroll_${selectedMonth}.csv`;

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full-day':
        return 'bg-green-100 text-green-800';
      case 'half-day':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'holiday':
        return 'bg-purple-100 text-purple-800';
      case 'weekly-off':
        return 'bg-indigo-100 text-indigo-800';
      case 'late':
        return 'bg-orange-100 text-orange-800';
      case 'early-leave':
        return 'bg-blue-100 text-blue-800';
      case 'clock-out-missing':
        return 'bg-gray-100 text-gray-800';
      case 'regularized':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading && !attendanceData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !attendanceData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading attendance</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={() => fetchAttendance(true)}
              className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sub Navigation */}
      <AdminSubNav
        title=""
        items={[
          {
            id: 'summary',
            label: 'Summary',
            href: '#',
            icon: <ChartBarIcon className="w-4 h-4" />,
          },
          {
            id: 'payroll',
            label: 'Payroll',
            href: '#',
            icon: <ClockIcon className="w-4 h-4" />,
          },
          {
            id: 'sheet',
            label: 'Google Sheet',
            href: '#',
            icon: <CalendarIcon className="w-4 h-4" />,
          },
        ]}
        variant="tabs"
        onItemClick={(itemId) => setActiveTab(itemId as 'summary' | 'payroll' | 'sheet')}
        activeItem={activeTab}
      />

      {/* Header */}
      {activeTab !== 'sheet' && (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
          </div>
        </div>
        
        {/* Date Range Selection - Summary Tab */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Status</option>
              <option value="full-day">Full Day</option>
              <option value="half-day">Half Day</option>
              <option value="absent">Absent</option>
              <option value="regularized">Regularized</option>
            </select>
          </div>

          {/* Export Button */}
          <div className="flex items-end">
            <button
              onClick={exportAttendanceData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Export Data
            </button>
          </div>
        </div>
        )}

        {/* Payroll Tab - Month Selection */}
        {activeTab === 'payroll' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex items-end space-x-3">
              <button
                onClick={fetchPayrollData}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
              <button
                onClick={exportPayrollData}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Export CSV
              </button>
            </div>
          </div>
        )}
      </div>
      )}



      {/* Summary Tab Content */}
      {activeTab === 'summary' && (
        <>
          {/* Overview Cards */}
      {attendanceData && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <ClockIcon className="w-7 h-7 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Present</p>
                <p className="text-3xl font-bold text-gray-900">{attendanceData.overview.totalPresent}</p>
                <p className="text-xs text-gray-500">in selected period</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-xl">
                <ExclamationTriangleIcon className="w-7 h-7 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="text-3xl font-bold text-gray-900">{attendanceData.overview.totalAbsent}</p>
                <p className="text-xs text-gray-500">in selected period</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <ExclamationTriangleIcon className="w-7 h-7 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Late</p>
                <p className="text-3xl font-bold text-gray-900">{attendanceData.overview.totalLate}</p>
                <p className="text-xs text-gray-500">in selected period</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <CalendarIcon className="w-7 h-7 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">On Leave</p>
                <p className="text-3xl font-bold text-gray-900">{attendanceData.overview.totalOnLeave}</p>
                <p className="text-xs text-gray-500">in selected period</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <ChartBarIcon className="w-7 h-7 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Hours</p>
                <p className="text-3xl font-bold text-gray-900">{attendanceData.overview.averageHours}</p>
                <p className="text-xs text-gray-500">in selected period</p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Department Stats */}
      {attendanceData && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Department Attendance Overview</h3>
          <p className="text-sm text-gray-600 mb-6">Statistics for the selected date range and filters</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {attendanceData.departmentStats.map((dept) => (
              <div key={dept._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-300">
                <h4 className="font-semibold text-gray-900 mb-4 text-lg">{dept._id}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Present:</span>
                    <span className="font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm">
                      {dept.present}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Absent:</span>
                    <span className="font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full text-sm">
                      {dept.absent}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Late:</span>
                    <span className="font-semibold text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full text-sm">
                      {dept.late}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Attendance Table */}
      {attendanceData && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
            <p className="text-sm text-gray-600">Showing {attendanceData.attendance.length} of {attendanceData.pagination.total} records for the selected period</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock In
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock Out
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceData.attendance.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {record.user?.firstName?.charAt(0) + record.user?.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {record.user?.firstName} {record.user?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.user?.employeeId}  {record.user?.department}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {safeFormatDate(record.date, 'MM/dd/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                        {record.status === 'full-day' ? 'Full Day' : 
                         record.status === 'half-day' ? 'Half Day' : 
                         record.status === 'absent' ? 'Absent' : 
                         record.status === 'holiday' ? 'Holiday' :
                         record.status === 'weekly-off' ? 'Weekly Off' :
                         record.status === 'late' ? 'Late' :
                         record.status === 'early-leave' ? 'Early Leave' :
                         record.status === 'clock-out-missing' ? 'Clock-out Missing' :
                         record.status === 'regularized' ? 'Regularized' :
                         record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.clockIn ? formatTime(new Date(record.clockIn), 'hh:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.clockOut ? formatTime(new Date(record.clockOut), 'hh:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.totalHours ? `${record.totalHours.toFixed(2)}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {canRegularize(record) && (
                        <button 
                          onClick={() => handleRegularize(record)}
                          className="text-green-600 hover:text-green-900 transition-colors mr-3"
                        >
                          Regularize
                        </button>
                      )}
                      <button 
                        onClick={() => handleViewSessions(record)}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        View
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{record.notes || '-'}</div>
                        {record.sessions && record.sessions.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {record.sessions.length} session{record.sessions.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {attendanceData.pagination.pages > 1 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {attendanceData.pagination.page} of {attendanceData.pagination.pages}
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
                    disabled={currentPage === attendanceData.pagination.pages}
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

      {/* Embedded Google Sheet at the Bottom of Summary */}
      <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden" style={{ height: '800px' }}>
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span></span> Google Sheet Live Sync
          </h2>
        </div>
        <iframe
          src="https://docs.google.com/spreadsheets/d/1wn-SwY7ieUnTkZISRkY_ibQlwYNda85CWUVLQb8yM-0/edit?rm=minimal&gid=1132078744"
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          title="Google Sheets Attendance Tracker"
        ></iframe>
      </div>

      {/* Sessions Modal */}
      {showSessionsModal && selectedRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-8 border w-11/12 max-w-4xl shadow-lg rounded-xl bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Attendance Sessions - {selectedRecord.user?.firstName || 'Unknown'} {selectedRecord.user?.lastName || 'User'}
              </h3>
              <button
                onClick={closeSessionsModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Date:</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {safeFormatDate(selectedRecord.date, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <p className="text-lg font-semibold text-gray-900">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRecord.status)}`}>
                      {selectedRecord.status === 'full-day' ? 'Full Day' : 
                       selectedRecord.status === 'half-day' ? 'Half Day' : 
                       selectedRecord.status === 'absent' ? 'Absent' : 
                       selectedRecord.status === 'holiday' ? 'Holiday' :
                       selectedRecord.status === 'weekly-off' ? 'Weekly Off' :
                       selectedRecord.status === 'late' ? 'Late' :
                       selectedRecord.status === 'early-leave' ? 'Early Leave' :
                       selectedRecord.status === 'clock-out-missing' ? 'Clock-out Missing' :
                       selectedRecord.status === 'regularized' ? 'Regularized' :
                       selectedRecord.status}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Total Hours:</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedRecord.totalHours ? `${selectedRecord.totalHours.toFixed(2)}h` : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Clock Sessions</h4>
              {selectedRecord.sessions && selectedRecord.sessions.length > 0 ? (
                <div className="space-y-4">
                  {selectedRecord.sessions.map((session, index) => (
                    <div key={session._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <span className="text-sm font-medium text-gray-600">Session {index + 1}</span>
                            <span className="text-xs text-gray-500">ID: {session._id}</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm font-medium text-gray-600">Clock In:</span>
                              <p className="text-lg font-semibold text-green-600">
                                {formatTime(new Date(session.clockIn), 'hh:mm a')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {safeFormatDate(getTodayDateString(), 'MM/dd/yyyy')}
                              </p>
                            </div>
                            
                            <div>
                              <span className="text-sm font-medium text-gray-600">Clock Out:</span>
                              {session.clockOut ? (
                                <>
                                  <p className="text-lg font-semibold text-red-600">
                                    {formatTime(new Date(session.clockOut), 'hh:mm a')}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {safeFormatDate(getTodayDateString(), 'MM/dd/yyyy')}
                                  </p>
                                </>
                              ) : (
                                <p className="text-lg font-semibold text-gray-400">Not clocked out</p>
                              )}
                            </div>
                          </div>

                          {session.duration && (
                            <div className="mt-3">
                              <span className="text-sm font-medium text-gray-600">Duration:</span>
                              <p className="text-lg font-semibold text-blue-600">
                                {session.duration.toFixed(2)} hours
                              </p>
                            </div>
                          )}

                          {session.notes && (
                            <div className="mt-3">
                              <span className="text-sm font-medium text-gray-600">Notes:</span>
                              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-1">
                                {session.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No detailed sessions available</p>
                  <p className="text-sm">Only main clock-in/out times are recorded</p>
                </div>
              )}
            </div>

            {selectedRecord.notes && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">General Notes</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedRecord.notes}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={closeSessionsModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Payroll Tab Content */}
      {activeTab === 'payroll' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Payroll Data</h3>
            <p className="text-sm text-gray-600">Employee attendance summary for {selectedMonth}</p>
          </div>
          
          {payrollLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : payrollData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-500 mb-4">No attendance data found for {selectedMonth}</p>
              <button
                onClick={fetchPayrollData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Present
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Regularized
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Holiday
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weekend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Absent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Half Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Late
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Early Leave
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clock-out Missing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Worked Days
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrollData.map((employee) => (
                  <tr key={employee.employeeId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {employee.employeeName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.employeeName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.position}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.present}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.regularized}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.holiday}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.weekend}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.absent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.halfDay}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.late}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.earlyLeave}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.clockOutMissing}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {employee.workedDays}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* Admin Regularization Modal */}
      <AdminRegularizationModal
        isOpen={regularizationModal.isOpen}
        onClose={() => setRegularizationModal({ isOpen: false, record: null })}
        attendanceRecord={regularizationModal.record}
        onConfirm={handleConfirmRegularize}
      />
    </div>
  );
}
