import React from 'react';
import SettingsConfiguration from '@/components/hr/SettingsConfiguration';
import HRPortalLayout from '../../../components/hr/HRPortalLayout';

export default function SettingsPage() {
  return (
    <HRPortalLayout currentPage="settings">
      <div className="min-h-screen p-4 sm:p-6 relative">
        <div className="ambient-bg"></div>
        <div className="mesh-overlay"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <SettingsConfiguration />
        </div>
      </div>
    </HRPortalLayout>
  );
}
