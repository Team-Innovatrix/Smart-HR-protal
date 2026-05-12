'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useDevSafeAuth as useAuth, useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk';;
import { 
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  BriefcaseIcon,
  SparklesIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/portal/admin', icon: <HomeIcon className="w-5 h-5" /> },
  { name: 'User Management', href: '/portal/admin/users', icon: <UsersIcon className="w-5 h-5" /> },
  { name: 'Leave Management', href: '/portal/admin/leaves', icon: <CalendarIcon className="w-5 h-5" /> },
  { name: 'Attendance', href: '/portal/admin/attendance', icon: <ClockIcon className="w-5 h-5" /> },
  { name: 'Team Management', href: '/portal/admin/teams', icon: <UserGroupIcon className="w-5 h-5" /> },
  { name: 'Recruitment', href: '/portal/admin/jobs', icon: <BriefcaseIcon className="w-5 h-5" /> },
  { name: 'Analytics', href: '/portal/admin/analytics', icon: <ChartBarIcon className="w-5 h-5" /> },
  { name: 'Predictive AI', href: '/portal/admin/predictive', icon: <SparklesIcon className="w-5 h-5" /> },
  { name: 'Risk Intelligence', href: '/portal/admin/risk', icon: <ShieldExclamationIcon className="w-5 h-5" /> },
  { name: 'Settings', href: '/portal/admin/settings', icon: <Cog6ToothIcon className="w-5 h-5" /> },
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onHoverChange?: (isHovered: boolean) => void;
}

export default function AdminSidebar({ isCollapsed, onToggle, onHoverChange }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector('[data-sidebar]');
      if (sidebar && !sidebar.contains(event.target as Node) && !isCollapsed) {
        onToggle();
      }
    };
    if (!isCollapsed) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCollapsed, onToggle]);

  const handleMouseEnter = () => {
    if (isCollapsed) { setIsHovered(true); onHoverChange?.(true); }
  };
  const handleMouseLeave = () => {
    if (isCollapsed) { setIsHovered(false); onHoverChange?.(false); }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        data-sidebar
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`hidden lg:flex lg:flex-col lg:fixed lg:top-14 lg:bottom-0 lg:left-0 lg:z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isCollapsed && !isHovered ? 'lg:w-16' : 'lg:w-64'
        }`}
        style={{
          background: 'rgba(22, 22, 42, 0.75)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          borderRight: '1px solid var(--glass-border)',
        }}
      >
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = item.href === '/portal/admin'
              ? pathname === '/portal/admin'
              : pathname.startsWith(item.href);
            const shouldShowDetails = !isCollapsed || isHovered;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`sidebar-nav-item ${isActive ? 'active' : ''} ${!shouldShowDetails ? 'justify-center' : ''}`}
                title={!shouldShowDetails ? item.name : undefined}
              >
                <span className={`flex-shrink-0 transition-colors duration-300 ${
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                }`}>
                  {item.icon}
                </span>
                {shouldShowDetails && (
                  <span className="ml-1 truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="px-3 py-3 border-t border-[var(--glass-border)]">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`w-full flex items-center p-2 text-[13px] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)] rounded-xl transition-colors ${
                isCollapsed && !isHovered ? 'justify-center' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent-muted)', border: '1px solid rgba(52,211,153,0.15)' }}
              >
                <span className="text-sm font-bold text-[var(--accent)]">
                  {user?.firstName?.charAt(0) || 'A'}
                </span>
              </div>
              {(!isCollapsed || isHovered) && (
                <>
                  <div className="ml-3 flex-1 text-left">
                    <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[11px] text-[var(--accent)] font-medium">Administrator</p>
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-[var(--text-muted)]" />
                </>
              )}
            </button>

            {isProfileOpen && (
              <div className={`absolute bottom-full left-0 mb-2 w-52 rounded-xl shadow-xl py-2 z-50 animate-fade-in ${
                isCollapsed ? 'left-4' : ''
              }`}
                style={{
                  background: 'rgba(30, 30, 55, 0.95)',
                  backdropFilter: 'blur(40px)',
                  border: '1px solid var(--glass-border-hover)',
                }}
              >
                <Link
                  href="/portal/profile"
                  className="block px-4 py-2.5 text-[13px] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--text-primary)] transition-colors rounded-lg mx-1"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Your Profile
                </Link>
                <Link
                  href="/portal/dashboard"
                  className="block px-4 py-2.5 text-[13px] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--text-primary)] transition-colors rounded-lg mx-1"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Employee Portal
                </Link>
                <div className="border-t border-[var(--glass-border)] my-1"></div>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2.5 text-[13px] text-[var(--color-danger)] hover:bg-[rgba(248,113,113,0.08)] transition-colors rounded-lg mx-1"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobile && !isCollapsed && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onToggle} />
          <div className="fixed top-0 left-0 bottom-0 w-64 z-50 flex flex-col animate-fade-in"
            style={{
              background: 'rgba(22, 22, 42, 0.95)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              borderRight: '1px solid var(--glass-border)',
            }}
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Navigation</h2>
              <button onClick={onToggle} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)] rounded-lg transition-colors" aria-label="Close sidebar">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = item.href === '/portal/admin'
                  ? pathname === '/portal/admin'
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onToggle}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <span className={`flex-shrink-0 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                      {item.icon}
                    </span>
                    <span className="ml-1 truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile User Profile */}
            <div className="px-4 py-4 border-t border-[var(--glass-border)]">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--accent-muted)', border: '1px solid rgba(52,211,153,0.15)' }}
                >
                  <span className="text-sm font-medium text-[var(--accent)]">
                    {user?.firstName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">{user?.emailAddresses?.[0]?.emailAddress || 'No email'}</p>
                </div>
              </div>
              <button
                onClick={() => { signOut(); onToggle(); }}
                className="mt-3 w-full flex items-center px-3 py-2.5 text-[13px] text-[var(--color-danger)] hover:bg-[rgba(248,113,113,0.08)] rounded-xl transition-colors font-medium"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
