'use client';

import React, { useState, useEffect } from 'react';
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';;
import DocumentManagement from '@/components/hr/DocumentManagement';
import HRPortalLayout from '../../../components/hr/HRPortalLayout';

export default function DocumentsPage() {
  const { user, isLoaded } = useUser();
  const [pageLoading, setPageLoading] = useState(true);

  // Handle page-level loading like other pages
  useEffect(() => {
    if (isLoaded && user) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setPageLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, user]);

  // Show loading state while checking authentication or during page load
  if (!isLoaded || !user || pageLoading) {
    return (
      <HRPortalLayout currentPage="documents" showSidebar={false}>
        <div className="min-h-screen flex items-center justify-center relative">
          <div className="ambient-bg"></div>
          <div className="mesh-overlay"></div>
          <div className="text-center relative z-10">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-pulse"></div>
            </div>
            <p className="text-gray-600 text-lg font-medium">Loading Documents...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait while we set up your workspace</p>
          </div>
        </div>
      </HRPortalLayout>
    );
  }

  return (
    <HRPortalLayout currentPage="documents">
      <div className="min-h-screen p-4 sm:p-6 relative">
        <div className="ambient-bg"></div>
        <div className="mesh-overlay"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <DocumentManagement />
        </div>
      </div>
    </HRPortalLayout>
  );
}
