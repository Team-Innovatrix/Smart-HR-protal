'use client';

import { useState } from 'react';
import { UserPlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import UserEditModal from '@/components/admin/UserEditModal';
import ClerkUsersModal from '@/components/admin/ClerkUsersModal';
import AdminSubNav, { adminSubNavConfigs } from '@/components/admin/AdminSubNav';

export default function OnboardingPage() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showClerkUsersModal, setShowClerkUsersModal] = useState(false);

  return (
    <div className="space-y-8">
      {/* Sub Navigation */}
      <AdminSubNav
        title="User Management"
        items={adminSubNavConfigs.users.items}
      />
      
      <div className="p-6">
        {/* Page Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-8 shadow-xl mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-2">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <UserPlusIcon className="w-8 h-8 text-blue-200" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Add / Detach Employee</h1>
          </div>
          <p className="text-blue-200 max-w-2xl text-lg ml-16">
            Easily onboard new employees to the HR database or link existing workspace authentication logic to existing employee accounts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Add Employee Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
            <UserPlusIcon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Create Core Employee Profile</h2>
          <p className="text-gray-600 mb-8 min-h-[48px]">
            Manually enter a team member into the HR system. Establish their corporate hierarchy, department, and initial compensation.
          </p>
          <button
            onClick={() => setShowEditModal(true)}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
          >
            <UserPlusIcon className="w-5 h-5 mr-2" />
            Launch Create Profile Form
          </button>
        </div>

        {/* Link / Detach Auth Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
            <MagnifyingGlassIcon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Attach/Detach Authentication</h2>
          <p className="text-gray-600 mb-8 min-h-[48px]">
            Map user login records safely to Database Employee records. Revoke access from offboarded personnel instantly.
          </p>
          <button
            onClick={() => setShowClerkUsersModal(true)}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
          >
            <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
            Open Auth Manager Toolbar
          </button>
        </div>
      </div>

      <UserEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        userId={null}
        onUserUpdated={() => setShowEditModal(false)}
      />

      <ClerkUsersModal
        isOpen={showClerkUsersModal}
        onClose={() => setShowClerkUsersModal(false)}
        onUsersAdded={() => setShowClerkUsersModal(false)}
      />
      </div>
    </div>
  );
}
