"use client";

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('admin-sidebar-collapsed');
    if (savedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => setIsSidebarCollapsed(p => !p);
  const handleSidebarHover = (isHovered: boolean) => setIsSidebarHovered(isHovered);

  //  Login page: render bare  no guard, no sidebar 
  if (pathname === '/portal/admin/login') {
    return <>{children}</>;
  }

  //  All other admin pages: require auth + full shell 
  return (
    <AdminAuthGuard>
      <div className="min-h-screen relative" style={{ background: 'var(--bg-base)' }}>
        {/* Ambient background */}
        <div className="ambient-bg" />
        <div className="mesh-overlay" />
        
        <AdminHeader
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        <div className="flex h-[calc(100vh-3.5rem)] relative">
          <AdminSidebar
            isCollapsed={isSidebarCollapsed}
            onToggle={toggleSidebar}
            onHoverChange={handleSidebarHover}
          />
          <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isSidebarCollapsed && !isSidebarHovered ? 'lg:ml-16' : 'lg:ml-64'
          }`}>
            <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative z-10">
              <div className="max-w-7xl mx-auto animate-fade-in">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-10 h-10">
                        <div className="absolute inset-0 rounded-full border-2 border-[var(--glass-border)]" />
                        <div className="absolute inset-0 rounded-full border-2 border-t-[var(--accent)] animate-spin" />
                      </div>
                      <p className="text-sm text-[var(--accent)] font-medium">Loading...</p>
                    </div>
                  </div>
                }>
                  {children}
                </Suspense>
              </div>
            </main>
          </div>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
