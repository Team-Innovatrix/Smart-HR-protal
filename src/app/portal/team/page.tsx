'use client';

import React, { useState, useEffect } from 'react';
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';;
import TeamManagement from '@/components/hr/TeamManagement';
import HRPortalLayout from '../../../components/hr/HRPortalLayout';

export default function TeamPage() {
  const { user, isLoaded } = useUser();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      const timer = setTimeout(() => setPageLoading(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, user]);

  if (!isLoaded || !user || pageLoading) {
    return (
      <HRPortalLayout currentPage="team" showSidebar={false}>
        <div className="min-h-screen flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg,#fff7ed,#ffffff,#fffbf7)' }}>
          <div className="text-center">
            <div className="relative mx-auto mb-5 w-16 h-16">
              <div className="w-16 h-16 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-amber-400 animate-spin"
                   style={{ animationDirection: 'reverse', animationDuration: '0.75s' }} />
            </div>
            <p className="text-orange-600 font-semibold text-lg">Loading Team...</p>
            <p className="text-neutral-400 text-sm mt-1">Setting up your workspace</p>
          </div>
        </div>
      </HRPortalLayout>
    );
  }

  return (
    <HRPortalLayout currentPage="team">
      <div className="min-h-screen p-4 sm:p-6"
           style={{
             background: 'linear-gradient(135deg,#fff7ed 0%,#ffffff 40%,#fffbf7 100%)',
             backgroundImage: 'radial-gradient(circle, rgba(251,146,60,0.06) 1px, transparent 1px)',
             backgroundSize: '28px 28px'
           }}>
        <div className="max-w-7xl mx-auto">
          <TeamManagement userId={user.id} />
        </div>
      </div>
    </HRPortalLayout>
  );
}
