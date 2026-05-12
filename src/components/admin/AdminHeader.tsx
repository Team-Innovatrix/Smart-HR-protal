'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bars3Icon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/portal/admin/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--mac-window-bg-solid)] border-b border-[var(--mac-border)] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-3">
          {/* Sidebar Toggle */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 text-[var(--mac-text-secondary)] hover:text-[var(--mac-text-primary)] hover:bg-[var(--mac-border)] rounded-md transition-colors"
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          )}

          {/* Logo + Name */}
          <Link href="/portal/admin" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--mac-accent)] flex items-center justify-center text-white text-sm shadow-sm transition-transform duration-200 group-hover:scale-105">
              ⚡
            </div>
            <div>
              <div className="text-[9px] text-[var(--mac-text-secondary)] font-semibold tracking-widest uppercase leading-none mb-0.5">Innovatrix</div>
              <h1 className="text-[13px] font-bold text-[var(--mac-text-primary)] leading-none">Admin Portal</h1>
            </div>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side — Live badge + Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 border border-[var(--mac-border)] bg-[var(--mac-bg)] rounded-md px-2 py-0.5">
              <span className="w-1.5 h-1.5 bg-[#34c759] rounded-full animate-pulse" />
              <span className="text-[var(--mac-text-secondary)] text-[11px] font-medium">Live</span>
            </div>

            <button
              onClick={handleLogout}
              title="Sign out of Admin Portal"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--mac-bg)] hover:bg-[#ff3b3015] border border-[var(--mac-border)] hover:border-[#ff3b3030] text-[var(--mac-text-secondary)] hover:text-[#ff3b30] text-[12px] font-medium transition-all duration-150"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
