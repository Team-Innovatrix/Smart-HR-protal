'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  HomeIcon, 
  ClockIcon, 
  CalendarIcon, 
  UserIcon, 
  UsersIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  ChevronRightIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { UserButton, OrganizationSwitcher } from '@clerk/nextjs'
import { useDevSafeUser, useDevSafeClerk } from '../../lib/hooks/useDevSafeClerk'
import MicIcon from './MicIcon'
import NotificationBell from './NotificationBell'
import { usePathname } from 'next/navigation'
import { getHRPortalPath } from '../../lib/urlUtils'

interface HRPortalLayoutProps {
  children: React.ReactNode
  currentPage?: string
  showSidebar?: boolean
}

const HRPortalLayout = ({ children, currentPage = 'home', showSidebar = true }: HRPortalLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [companyName, setCompanyName] = useState<string>('Innovatrix Smart Dashboard')
  const [userProfile, setUserProfile] = useState<{ position?: string; department?: string } | null>(null)
  const { user, isLoaded } = useDevSafeUser()
  const { signOut } = useDevSafeClerk()
  const router = useRouter()

  // Fetch company name from settings
  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.general?.companyName) {
            setCompanyName(data.data.general.companyName);
          }
        }
      } catch (error) {
        console.error('Failed to fetch company name:', error);
      }
    };
    fetchCompanyName();
  }, []);

  // Fetch user profile for role/position
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Always pass the logged-in user's own ID so the API returns the right profile
        const url = user?.id ? `/api/profile?userId=${encodeURIComponent(user.id)}` : '/api/profile';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) setUserProfile(data.data);
        }
      } catch {}
    };
    if (isLoaded && user) fetchProfile();
  }, [isLoaded, user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/portal/auth')
    }
  }, [isLoaded, user, router])

  // Show loading state while checking authentication
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8fafc, #eef2ff, #f0fdfa)' }}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-400 animate-pulse"></div>
          </div>
          <p className="text-indigo-600 text-lg font-medium">Loading HR Portal...</p>
          <p className="text-slate-400 text-sm mt-2">Please wait while we set up your workspace</p>
        </div>
      </div>
    )
  }

  const baseNavigation = [
    { name: 'Dashboard', href: getHRPortalPath('dashboard'), icon: HomeIcon, current: currentPage === 'home', description: 'Overview and insights' },
    { name: 'Attendance', href: getHRPortalPath('attendance'), icon: ClockIcon, current: currentPage === 'attendance', description: 'Clock in/out and tracking' },
    { name: 'Leaves', href: getHRPortalPath('leaves'), icon: CalendarIcon, current: currentPage === 'leaves', description: 'Request and manage time off' },
    { name: 'Profile', href: getHRPortalPath('profile'), icon: UserIcon, current: currentPage === 'profile', description: 'Personal information' },
    { name: 'Team', href: getHRPortalPath('team'), icon: UsersIcon, current: currentPage === 'team', description: 'Team management' },
    { name: 'Chat', href: getHRPortalPath('chat'), icon: ChatBubbleLeftRightIcon, current: currentPage === 'chat', description: 'Employee communication' },
    { name: 'Documents', href: getHRPortalPath('documents'), icon: DocumentTextIcon, current: currentPage === 'documents', description: 'File management' },
    { name: 'Settings', href: getHRPortalPath('settings'), icon: Cog6ToothIcon, current: currentPage === 'settings', description: 'Preferences and security' },
  ]

  // CEO and HR Managers both get admin portal access
  const isAdmin = 
    user?.publicMetadata?.role === 'admin' ||
    user?.publicMetadata?.role === 'HR Manager' ||
    user?.publicMetadata?.role === 'Chief Executive Officer' ||
    user?.publicMetadata?.role === 'CEO' ||
    user?.publicMetadata?.roleId === 'admin' ||
    userProfile?.position === 'Chief Executive Officer' ||
    userProfile?.position === 'CEO' ||
    userProfile?.department?.toLowerCase() === 'hr' ||
    userProfile?.department?.toLowerCase() === 'human resources' ||
    userProfile?.position?.toLowerCase().includes('hr') ||
    // dev_user_admin_001 is always admin
    user?.id === 'dev_user_admin_001'

  const navigation = isAdmin 
    ? [...baseNavigation, { 
        name: 'Admin Portal', 
        href: '/portal/admin', 
        icon: ShieldCheckIcon, 
        current: false, 
        description: '👑 Command Centre' 
      }]
    : baseNavigation

  const isCurrentPage = (href: string) => {
    if (href === getHRPortalPath('dashboard') && currentPage === 'dashboard') return true
    if (href === getHRPortalPath('dashboard') && currentPage === 'home') return true
    return href.includes(currentPage)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (!showSidebar) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc, #eef2ff, #f0fdfa)' }}>
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc, #eef2ff, #f0fdfa)' }}>
        {/* Sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

      {/* Sidebar (moved to right, hidden by default) */}
      <div className={`fixed inset-y-0 right-0 z-[60] w-72 bg-white/95 backdrop-blur-xl shadow-2xl border-l border-gray-200/50 transform transition-all duration-300 ease-in-out flex flex-col ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Sidebar Brand Header */}
        <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
          <Link href={getHRPortalPath('dashboard')} className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl shadow-md flex-shrink-0">
              🚀
            </div>
            <div className="leading-tight">
              <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest">Innovatrix</div>
              <div className="text-xs font-bold text-gray-900">Smart Dashboard</div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* User Info Header */}
        <div className="px-8 py-5 border-b border-gray-200/50 bg-white">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-semibold">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </span>
            </div>
            <div className="ml-4">
              <p className="text-base font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-600">
                {user?.emailAddresses[0]?.emailAddress}
              </p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>


        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                     isCurrentPage(item.href)
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/60 hover:shadow-md'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`mr-3 h-5 w-5 transition-all duration-200 ${
                    isCurrentPage(item.href) ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'
                  }`} />
                  <div className="flex-1">
                    <div className="font-semibold">{item.name}</div>
                    <div className={`text-xs mt-0.5 transition-all duration-200 ${
                      isCurrentPage(item.href) ? 'text-blue-100' : 'text-gray-500 group-hover:text-blue-500'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                  {isCurrentPage(item.href) && (
                    <ChevronRightIcon className="h-4 w-4 text-blue-100 ml-2" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        

        {/* Sign Out is now handled by the UserButton in the header */}
        <div className="flex-shrink-0 px-6 pb-6 pt-2 border-t border-gray-100">
        </div>
      </div>

      {/* Main Content */}
      <div>
        {/* Top Header */}
        <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left: Brand */}
            <div className="flex items-center">
              <Link href={getHRPortalPath('dashboard')} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl shadow-md flex-shrink-0">
                  ⚡
                </div>
                <div className="leading-tight">
                  <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Innovatrix</div>
                  <div className="text-sm font-bold text-gray-900">Smart Dashboard</div>
                </div>
              </Link>
            </div>


            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationBell />

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
                   <p className="text-xs font-semibold" style={{ color: '#6366f1' }}>
                     {userProfile?.position || (user?.publicMetadata?.role as string) || 'Employee'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <OrganizationSwitcher 
                    hidePersonal={true}
                    afterSelectOrganizationUrl="/portal/dashboard"
                    appearance={{
                      elements: {
                        rootBox: "shadow-sm border border-slate-200 rounded-lg px-2",
                        organizationSwitcherTrigger: "focus:shadow-none"
                      }
                    }}
                  />
                  <UserButton 
                    afterSignOutUrl="/portal/auth"
                    appearance={{
                      elements: {
                        avatarBox: "h-9 w-9 rounded-xl shadow-md"
                      }
                    }}
                  />
                </div>
                {/* Sidebar toggle (3 bars) beside initials */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
                  aria-label="Toggle sidebar"
                >
                  <Bars3Icon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="min-h-screen p-3 sm:p-6">
          {children}
        </main>
      </div>

      {/* Floating Mic Icon */}
      <MicIcon />
    </div>
  )
}

export default HRPortalLayout
