'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    pendingLeaves: number;
    todayAttendance: number;
    totalTeams: number;
  };
  departmentStats: Array<{ _id: string; count: number }>;
  recentLeaves: Array<Record<string, unknown>>;
  todayAttendanceStats: Array<{ _id: string; count: number }>;
  adminUser: {
    name: string;
    employeeId: string;
    department: string;
    permissions: string[];
  };
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch data after AdminAuthGuard has verified admin access
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
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
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Welcome back, {dashboardData.adminUser.name}! 👋
        </h1>
        <p className="text-lg text-gray-600">
          Here&apos;s what&apos;s happening in your organization today.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.overview.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.overview.pendingLeaves}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today&apos;s Attendance</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.overview.todayAttendance}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Teams</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData.overview.totalTeams}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Stats and Recent Leaves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Department Distribution</h3>
          <div className="space-y-4">
            {dashboardData.departmentStats.map((dept) => (
              <div key={dept._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{dept._id}</span>
                <span className="text-sm font-semibold text-gray-900 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  {dept.count} employees
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Leave Requests</h3>
            <Link
              href="/portal/admin/leaves"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {dashboardData.recentLeaves.length > 0 ? (
              dashboardData.recentLeaves.map((leave: Record<string, unknown>) => (
                <div key={leave._id as string} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {(leave.userId as Record<string, unknown>)?.firstName as string} {(leave.userId as Record<string, unknown>)?.lastName as string}
                    </p>
                    <p className="text-xs text-gray-500">{(leave.userId as Record<string, unknown>)?.department as string}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {leave.status as string}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No pending leave requests</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/portal/admin/users"
            className="group flex items-center p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 hover:shadow-md"
          >
            <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="font-semibold text-gray-900 group-hover:text-blue-800 transition-colors">Manage Users</p>
              <p className="text-sm text-gray-500">Add, edit, or remove employees</p>
            </div>
          </Link>

          <Link
            href="/portal/admin/leaves"
            className="group flex items-center p-6 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-300 hover:shadow-md"
          >
            <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="font-semibold text-gray-900 group-hover:text-green-800 transition-colors">Review Leaves</p>
              <p className="text-sm text-gray-500">Approve or reject requests</p>
            </div>
          </Link>

          <Link
            href="/portal/admin/analytics"
            className="group flex items-center p-6 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 hover:shadow-md"
          >
            <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
              <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="font-semibold text-gray-900 group-hover:text-purple-800 transition-colors">View Reports</p>
              <p className="text-sm text-gray-500">Analytics and insights</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
