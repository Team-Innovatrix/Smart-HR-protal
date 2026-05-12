'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  HomeIcon, 
  ClockIcon, 
  CalendarIcon, 
  UserIcon, 
  UsersIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  ChevronRightIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
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
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [companyName, setCompanyName] = useState<string>('HR Dashboard')
  const [companyLogo, setCompanyLogo] = useState<string>('')
  const [userProfile, setUserProfile] = useState<{ position?: string; department?: string } | null>(null)
  const [cursorMotion, setCursorMotion] = useState(true)
  const cursorRef = useRef<HTMLDivElement>(null)
  const { user, isLoaded } = useDevSafeUser()
  const { signOut } = useDevSafeClerk()
  const router = useRouter()

  // Cursor glow effect
  useEffect(() => {
    if (!cursorMotion) return
    const handleMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`
        cursorRef.current.style.top = `${e.clientY}px`
      }
    }
    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMove)
  }, [cursorMotion])

  // Fetch company name & logo from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
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
      }
    };
    fetchSettings();
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }} suppressHydrationWarning>
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--glass-border)]" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[var(--accent)] animate-spin" />
          </div>
          <p className="text-[var(--accent)] text-sm font-medium">Loading Portal...</p>
          <p className="text-[var(--text-muted)] text-xs mt-1">Setting up your workspace</p>
        </div>
      </div>
    )
  }

  const navigation = [
    { name: 'Dashboard', href: getHRPortalPath('dashboard'), icon: HomeIcon, current: currentPage === 'home', description: 'Overview and insights' },
    { name: 'Attendance', href: getHRPortalPath('attendance'), icon: ClockIcon, current: currentPage === 'attendance', description: 'Clock in/out' },
    { name: 'Leaves', href: getHRPortalPath('leaves'), icon: CalendarIcon, current: currentPage === 'leaves', description: 'Time off requests' },
    { name: 'Profile', href: getHRPortalPath('profile'), icon: UserIcon, current: currentPage === 'profile', description: 'Your information' },
    { name: 'Team', href: getHRPortalPath('team'), icon: UsersIcon, current: currentPage === 'team', description: 'Team directory' },
    { name: 'Chat', href: getHRPortalPath('chat'), icon: ChatBubbleLeftRightIcon, current: currentPage === 'chat', description: 'Messages' },
    { name: 'Documents', href: getHRPortalPath('documents'), icon: DocumentTextIcon, current: currentPage === 'documents', description: 'HR files' },
    { name: 'Settings', href: getHRPortalPath('settings'), icon: Cog6ToothIcon, current: currentPage === 'settings', description: 'Preferences' },
  ]

  const isCurrentPage = (href: string) => {
    if (href === getHRPortalPath('dashboard') && currentPage === 'dashboard') return true
    if (href === getHRPortalPath('dashboard') && currentPage === 'home') return true
    return href.includes(currentPage)
  }

  if (!showSidebar) {
    return (
      <div className="min-h-screen" suppressHydrationWarning>
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg-base)' }} suppressHydrationWarning>
      {/* Ambient background effects */}
      <div className="ambient-bg" />
      <div className="mesh-overlay" />

      {/* Cursor glow */}
      <div ref={cursorRef} className={`cursor-glow ${!cursorMotion ? 'disabled' : ''}`} />

      {/* Hover trigger area to open sidebar */}
      <div 
        className="fixed left-0 top-0 bottom-0 w-6 z-40 hidden lg:block"
        onMouseEnter={() => setSidebarHovered(true)}
      />

      {/* ═══ FLOATING LEFT SIDEBAR ═══ */}
      <aside 
        className={`fixed left-0 top-0 bottom-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hidden lg:flex flex-col w-[260px] shadow-2xl ${
          (sidebarHovered || sidebarPinned) ? 'translate-x-0' : '-translate-x-[260px]'
        }`}
        onMouseLeave={() => setSidebarHovered(false)}
        style={{
          background: 'rgba(22, 22, 42, 0.75)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          borderRight: '1px solid var(--glass-border)',
        }}
      >
        {/* Sidebar Brand */}
        <div className="px-4 pt-5 pb-4 border-b border-[var(--glass-border)]">
          <Link href={getHRPortalPath('dashboard')} className="flex items-center gap-3">
            {companyLogo ? (
              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-[rgba(255,255,255,0.1)]">
                <Image src={companyLogo} alt={companyName} width={36} height={36} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.25), rgba(52, 211, 153, 0.08))',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  boxShadow: '0 0 20px rgba(52, 211, 153, 0.1)',
                }}
              >
                ⚡
              </div>
            )}
            <div className="leading-tight animate-fade-in">
              <div className="text-[13px] font-bold text-[var(--text-primary)]">{companyName}</div>
              <div className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-[0.15em]">Dashboard</div>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isCurrentPage(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
                title={item.name}
              >
                <Icon className={`h-[18px] w-[18px] flex-shrink-0 transition-colors duration-300 ${
                  active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                }`} />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-3 pb-4 border-t border-[var(--glass-border)] pt-3">
          <button 
            onClick={() => setSidebarPinned(!sidebarPinned)}
            className="sidebar-nav-item w-full justify-center"
          >
            <ChevronRightIcon className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-300 ${sidebarPinned ? 'rotate-180' : ''}`} />
            <span className="text-[12px] text-[var(--text-muted)]">{sidebarPinned ? 'Unpin' : 'Pin Sidebar'}</span>
          </button>
        </div>
      </aside>

      {/* ═══ MOBILE SIDEBAR OVERLAY ═══ */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] flex flex-col animate-fade-in"
            style={{
              background: 'rgba(22, 22, 42, 0.92)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              borderRight: '1px solid var(--glass-border)',
            }}
          >
            {/* Mobile sidebar header */}
            <div className="px-5 pt-5 pb-3 border-b border-[var(--glass-border)] flex items-center justify-between">
              <Link href={getHRPortalPath('dashboard')} className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
                {companyLogo ? (
                  <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 border border-[rgba(255,255,255,0.1)]">
                    <Image src={companyLogo} alt={companyName} width={32} height={32} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                    style={{
                      background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.25), rgba(52, 211, 153, 0.08))',
                      border: '1px solid rgba(52, 211, 153, 0.2)',
                    }}
                  >⚡</div>
                )}
                <div className="leading-tight">
                  <div className="text-[12px] font-bold text-[var(--text-primary)]">{companyName}</div>
                  <div className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-widest">Dashboard</div>
                </div>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)] transition-all">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile User Info */}
            <div className="px-5 py-4 border-b border-[var(--glass-border)]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl flex items-center justify-center text-sm font-semibold text-[var(--accent)]"
                  style={{ background: 'var(--accent-muted)', border: '1px solid rgba(52,211,153,0.15)' }}
                >
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{user?.emailAddresses[0]?.emailAddress}</p>
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const active = isCurrentPage(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`sidebar-nav-item ${active ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <div className={`relative z-10 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        sidebarPinned ? 'lg:ml-[260px]' : 'lg:ml-0'
      }`}>
        {/* ═══ TOP NAVBAR ═══ */}
        <header className="sticky top-0 z-30 border-b border-[var(--glass-border)]"
          style={{
            background: 'rgba(26, 26, 46, 0.6)',
            backdropFilter: 'blur(32px) saturate(180%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          }}
        >
          <div className="flex items-center h-14 px-5 gap-4">
            {/* Mobile menu button */}
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)] transition-all">
              <Bars3Icon className="h-5 w-5" />
            </button>

            {/* Search bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md">
              <div className="relative w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="w-full pl-9 pr-4 py-2 text-[13px] rounded-xl bg-[rgba(255,255,255,0.04)] border border-[var(--glass-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(52,211,153,0.1)] transition-all duration-300"
                />
              </div>
            </div>

            <div className="flex-1 md:hidden" />

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* AI Assistant shortcut */}
              <button className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[rgba(52,211,153,0.08)] transition-all duration-200" title="AI Assistant">
                <SparklesIcon className="h-[18px] w-[18px]" />
              </button>

              {/* Notifications */}
              <NotificationBell />

              {/* User info + Controls */}
              <div className="flex items-center gap-2 ml-1">
                <div className="text-right hidden sm:block">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[11px] font-medium text-[var(--accent)]">
                    {userProfile?.position || (user?.publicMetadata?.role as string) || 'Employee'}
                  </p>
                </div>
                <OrganizationSwitcher 
                  hidePersonal={true}
                  afterSelectOrganizationUrl="/portal/dashboard"
                  appearance={{
                    elements: {
                      rootBox: "shadow-sm border border-[var(--glass-border)] rounded-lg",
                      organizationSwitcherTrigger: "focus:shadow-none"
                    }
                  }}
                />
                <UserButton 
                  afterSignOutUrl="/portal/auth"
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8 rounded-xl shadow-md ring-2 ring-[var(--glass-border)]"
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Floating Mic Icon */}
      <MicIcon />
    </div>
  )
}

export default HRPortalLayout
