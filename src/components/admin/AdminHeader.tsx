'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bars3Icon, ArrowRightOnRectangleIcon, SparklesIcon } from '@heroicons/react/24/outline';

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
    <header className="sticky top-0 z-50 border-b border-[var(--glass-border)]"
      style={{
        background: 'rgba(26, 26, 46, 0.6)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
      }}
    >
      <div className="max-w-full px-5 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-3">
          {/* Sidebar Toggle */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)] rounded-lg transition-all duration-200"
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          )}

          {/* Logo + Name */}
          <Link href="/portal/admin" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-transform duration-200 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.25), rgba(52, 211, 153, 0.08))',
                border: '1px solid rgba(52, 211, 153, 0.2)',
                boxShadow: '0 0 15px rgba(52, 211, 153, 0.08)',
              }}
            >
              ⚡
            </div>
            <div>
              <div className="text-[9px] text-[var(--text-muted)] font-semibold tracking-[0.15em] uppercase leading-none mb-0.5">Innovatrix</div>
              <h1 className="text-[13px] font-bold text-[var(--text-primary)] leading-none">Admin Portal</h1>
            </div>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* AI button */}
            <button className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[rgba(52,211,153,0.08)] transition-all duration-200" title="AI Assistant">
              <SparklesIcon className="w-[18px] h-[18px]" />
            </button>

            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-1.5 border border-[var(--glass-border)] rounded-lg px-2.5 py-1 bg-[rgba(255,255,255,0.03)]">
              <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse" style={{ boxShadow: '0 0 6px var(--accent-glow)' }} />
              <span className="text-[var(--text-secondary)] text-[11px] font-medium">Live</span>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              title="Sign out of Admin Portal"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(248,113,113,0.1)] border border-[var(--glass-border)] hover:border-[rgba(248,113,113,0.2)] text-[var(--text-secondary)] hover:text-[var(--color-danger)] text-[12px] font-medium transition-all duration-200"
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
