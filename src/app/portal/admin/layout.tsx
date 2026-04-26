"use client";

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('admin-sidebar-collapsed');
    if (savedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedState));
    } else {
      // Default to closed (collapsed) if no saved state
      setIsSidebarCollapsed(true);
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleSidebarHover = (isHovered: boolean) => {
    setIsSidebarHovered(isHovered);
  };

  return (
    <AdminAuthGuard>
      <div className="min-h-screen" style={{background:'linear-gradient(135deg, #f8fafc 0%, #eef2ff 40%, #f0fdfa 100%)'}}>
        {/* Subtle dot pattern */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.15]"
          style={{backgroundImage:'radial-gradient(circle, #818cf8 0.5px, transparent 0.5px)', backgroundSize:'28px 28px'}} />
        {/* Navbar */}
        <AdminHeader
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <div className="flex h-[calc(100vh-4rem)] relative">
          {/* Left Sidebar */}
          <AdminSidebar
            isCollapsed={isSidebarCollapsed}
            onToggle={toggleSidebar}
            onHoverChange={handleSidebarHover}
          />

          {/* Main Content Area */}
          <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            isSidebarCollapsed && !isSidebarHovered ? 'lg:ml-16' : 'lg:ml-64'
          }`}>
            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto animate-fade-in">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
                      <p className="text-sm text-indigo-500 font-medium">Loading...</p>
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
