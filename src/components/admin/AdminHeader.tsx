'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export default function AdminHeader({ onToggleSidebar, isSidebarCollapsed }: AdminHeaderProps) {
  const [companyName, setCompanyName] = useState<string>('HR Admin Dashboard');
  const [companyLogo, setCompanyLogo] = useState<string>('/api/image/logo.png');

  // Fetch company name and logo from settings
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.general) {
            if (data.data.general.companyName) {
              setCompanyName(data.data.general.companyName);
            }
            if (data.data.general.companyLogo) {
              setCompanyLogo(data.data.general.companyLogo);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch company settings:', error);
        // Keep the default fallbacks
      }
    };

    fetchCompanySettings();
  }, []);


  return (
    <header className="topbar-root sticky top-0 z-50">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-3">
          {/* Sidebar Toggle */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          )}

          {/* Logo + Name */}
          <Link href="/portal/admin" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg
                            group-hover:scale-105 transition-transform duration-200 overflow-hidden">
                {companyLogo ? (
                  <Image
                    src={companyLogo}
                    alt="Logo"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                    priority
                  />
                ) : (
                  <span className="text-white font-black text-lg">T</span>
                )}
              </div>
              {/* Pulse dot */}
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-orange-600 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight tracking-tight">{companyName}</h1>
              <p className="text-orange-200 text-[10px] font-medium tracking-widest uppercase">Admin Portal</p>
            </div>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side badge */}
          <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-white/90 text-xs font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Bottom shimmer line */}
      <div className="h-px w-full" style={{background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'}} />
    </header>
  );
}
