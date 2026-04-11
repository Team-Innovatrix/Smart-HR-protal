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
  {
    name: 'Dashboard',
    href: '/portal/admin',
    icon: <HomeIcon className="w-5 h-5" />
  },
  {
    name: 'User Management',
    href: '/portal/admin/users',
    icon: <UsersIcon className="w-5 h-5" />
  },
  {
    name: 'Leave Management',
    href: '/portal/admin/leaves',
    icon: <CalendarIcon className="w-5 h-5" />
  },
  {
    name: 'Attendance',
    href: '/portal/admin/attendance',
    icon: <ClockIcon className="w-5 h-5" />
  },
  {
    name: 'Team Management',
    href: '/portal/admin/teams',
    icon: <UserGroupIcon className="w-5 h-5" />
  },
  {
    name: 'Recruitment',
    href: '/portal/admin/jobs',
    icon: <BriefcaseIcon className="w-5 h-5" />
  },
  {
    name: 'Analytics',
    href: '/portal/admin/analytics',
    icon: <ChartBarIcon className="w-5 h-5" />
  },
  {
    name: 'Predictive AI',
    href: '/portal/admin/predictive',
    icon: <SparklesIcon className="w-5 h-5" />
  },
  {
    name: 'Risk Intelligence',
    href: '/portal/admin/risk',
    icon: <ShieldExclamationIcon className="w-5 h-5" />
  },
  {
    name: 'Settings',
    href: '/portal/admin/settings',
    icon: <Cog6ToothIcon className="w-5 h-5" />
  },
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
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  // Handle outside click to close sidebar when expanded
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector('[data-sidebar]');
      if (sidebar && !sidebar.contains(event.target as Node) && !isCollapsed) {
        onToggle();
      }
    };

    if (!isCollapsed) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCollapsed, onToggle]);

  // Handle hover to open/close sidebar
  const handleMouseEnter = () => {
    if (isCollapsed) {
      setIsHovered(true);
      onHoverChange?.(true);
    }
  };

  const handleMouseLeave = () => {
    if (isCollapsed) {
      setIsHovered(false);
      onHoverChange?.(false);
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        data-sidebar
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`hidden lg:flex lg:flex-col lg:fixed lg:top-16 lg:bottom-0 lg:left-0 lg:z-50 transition-all duration-300 ease-in-out sidebar-root ${
          isCollapsed && !isHovered ? 'lg:w-16' : 'lg:w-64'
        }`}
      >


        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = item.href === '/portal/admin'
              ? pathname === '/portal/admin'
              : pathname.startsWith(item.href);
            const shouldShowDetails = !isCollapsed || isHovered;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'nav-item-active'
                    : 'nav-item-inactive'
                } ${!shouldShowDetails ? 'justify-center' : ''}`}
                title={!shouldShowDetails ? item.name : undefined}
              >
                <span className={`flex-shrink-0 ${
                  isActive ? 'text-white' : 'text-neutral-400 group-hover:text-orange-600'
                }`}>
                  {item.icon}
                </span>
                {shouldShowDetails && (
                  <span className="ml-3 truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="px-4 py-4 border-t border-orange-100">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`w-full flex items-center p-2 text-sm text-neutral-700 hover:bg-orange-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors ${
                isCollapsed && !isHovered ? 'justify-center' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#fb923c,#ea580c)'}}>
                <span className="text-sm font-bold text-white">
                  {user?.firstName?.charAt(0) || 'A'}
                </span>
              </div>
              {(!isCollapsed || isHovered) && (
                <>
                  <div className="ml-3 flex-1 text-left">
                    <p className="text-sm font-semibold text-neutral-900 truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-orange-500 font-medium">Administrator</p>
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </>
              )}
            </button>

            {isProfileOpen && (
              <div className={`absolute bottom-full left-0 mb-2 w-52 bg-white rounded-2xl shadow-xl py-2 z-50 border border-orange-100 animate-fade-in ${
                isCollapsed ? 'left-4' : ''
              }`}>
                <Link
                  href="/portal/profile"
                  className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-orange-50 hover:text-orange-700 transition-colors rounded-xl mx-1"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Your Profile
                </Link>
                <Link
                  href="/portal/dashboard"
                  className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-orange-50 hover:text-orange-700 transition-colors rounded-xl mx-1"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Employee Portal
                </Link>
                <div className="border-t border-orange-100 my-1"></div>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-xl mx-1"
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
          {/* Mobile Overlay */}
          <div 
            className="fixed inset-0 bg-black/20" 
            onClick={onToggle}
          />
          
          {/* Mobile Sidebar */}
          <div className="fixed top-0 left-0 bottom-0 w-64 bg-white shadow-2xl z-50 border-r border-orange-100">
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-orange-100">
                <h2 className="text-base font-bold text-neutral-900">Navigation</h2>
                <button
                  onClick={onToggle}
                  className="p-2 text-neutral-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  aria-label="Close sidebar"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                  const isActive = item.href === '/portal/admin'
                    ? pathname === '/portal/admin'
                    : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onToggle} // Close mobile sidebar when navigating
                      className={`group relative flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'nav-item-active'
                          : 'nav-item-inactive'
                      }`}
                    >
                      <span className={`flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-neutral-400 group-hover:text-orange-600'
                      }`}>
                        {item.icon}
                      </span>
                      <span className="ml-3 truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile User Profile Section */}
              <div className="px-4 py-4 border-t border-orange-100">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{background:'linear-gradient(135deg,#fb923c,#ea580c)'}}>
                      <span className="text-sm font-medium text-white">
                        {user?.firstName?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-semibold text-neutral-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-orange-500">{user?.emailAddresses?.[0]?.emailAddress || 'No email'}</p>
                  </div>
                </div>
                
                {/* Mobile Sign Out Button */}
                <button
                  onClick={() => {
                    signOut();
                    onToggle();
                  }}
                  className="mt-3 w-full flex items-center px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
