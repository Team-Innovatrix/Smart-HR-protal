'use client';

import Link from 'next/link';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export default function AdminHeader({ onToggleSidebar, isSidebarCollapsed }: AdminHeaderProps) {
  const companyName = 'Innovatrix Smart Dashboard';
  const companyLogo = '/innovatrix-logo.png';


  return (
    <header className="sticky top-0 z-50" style={{
      background: 'linear-gradient(90deg, #312e81 0%, #4338ca 30%, #6366f1 65%, #818cf8 100%)',
      boxShadow: '0 2px 16px rgba(99, 102, 241, 0.3)',
    }}>
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
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-lg text-2xl
                            group-hover:scale-105 transition-transform duration-200">
                ⚡
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-teal-400 rounded-full border-2 border-indigo-600 animate-pulse" />
            </div>
            <div>
              <div className="text-[9px] text-indigo-200 font-semibold tracking-widest uppercase">Innovatrix</div>
              <h1 className="text-sm font-black text-white leading-tight tracking-tight">Smart Dashboard</h1>
            </div>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side badge */}
          <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
            <span className="text-white/90 text-xs font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Bottom shimmer line */}
      <div className="h-px w-full" style={{background:'linear-gradient(90deg, transparent, rgba(45,212,191,0.5), transparent)'}} />
    </header>
  );
}
