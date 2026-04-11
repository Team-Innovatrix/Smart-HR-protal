'use client'

import { useState, useEffect, useCallback } from 'react'
import { DEV_USER } from '../../../lib/devAuth'
import { useDevSafeUser } from '../../../lib/hooks/useDevSafeClerk'
import HRPortalLayout from '../../../components/hr/HRPortalLayout'
import DashboardSummaryCards from '../../../components/hr/DashboardSummaryCards'
import RecentActivityWidget from '../../../components/hr/RecentActivityWidget'
import TeamStatsView from '../../../components/hr/TeamStatsView'
import PredictiveAIFeatures from '../../../components/hr/PredictiveAIFeatures'
import { ProfileSyncStatus } from '../../../components/hr/ProfileSyncProvider'
import { useProfileSync } from '../../../lib/hooks/useProfileSync'
import { getHRPortalPath } from '../../../lib/urlUtils'
import { useTimezone } from '../../../lib/hooks/useTimezone'

import {
  ClockIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  UsersIcon,
  ArrowRightIcon,
  BoltIcon,
  ChartBarIcon as TrendingUpIcon,
  MoonIcon,
  SunIcon,
  BellIcon,
  SparklesIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

/* ─── Dark mode hook ─────────────────────────────────────────── */
function useDarkMode() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('hr-dark-mode')
    if (saved === 'true') setDark(true)
  }, [])

  const toggle = useCallback(() => {
    setDark(d => {
      localStorage.setItem('hr-dark-mode', String(!d))
      return !d
    })
  }, [])

  return { dark, toggle }
}

/* ─── Quick Action Card ───────────────────────────────────────── */
function QuickActionCard({
  title, description, icon: Icon, href, gradient, dark
}: { title: string; description: string; icon: React.ElementType; href: string; gradient: string; dark: boolean }) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300
                  hover:scale-[1.03] hover:shadow-xl overflow-hidden
                  ${dark
                    ? 'bg-neutral-800 border-neutral-700 hover:border-orange-500/50'
                    : 'bg-white border-orange-100 hover:border-orange-300'}`}
    >
      {/* Glow on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                       bg-gradient-to-br ${gradient} opacity-5 pointer-events-none`} />
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0
                       bg-gradient-to-br ${gradient}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${dark ? 'text-white' : 'text-neutral-900'}`}>{title}</p>
        <p className={`text-xs mt-0.5 truncate ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>{description}</p>
      </div>
      <ArrowRightIcon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1
                                  ${dark ? 'text-neutral-500' : 'text-neutral-400'}`} />
    </Link>
  )
}

/* ─── Stat Pill ───────────────────────────────────────────────── */
function StatPill({ label, value, icon: Icon, color, dark }: {
  label: string; value: string | number; icon: React.ElementType; color: string; dark: boolean
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200
                     ${dark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-orange-100'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${color} shadow-sm`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className={`text-lg font-black leading-none ${dark ? 'text-white' : 'text-neutral-900'}`}>{value}</p>
        <p className={`text-xs font-medium ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>{label}</p>
      </div>
    </div>
  )
}

/* ─── Main Page ───────────────────────────────────────────────── */
export default function HRPortalDashboard() {
  const { user, isLoaded } = useDevSafeUser()
  const { profile } = useProfileSync()
  const { formatTime, getToday } = useTimezone()
  const { dark, toggle: toggleDark } = useDarkMode()

  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [greeting, setGreeting] = useState('Welcome')
  const [showBanner, setShowBanner] = useState(true)

  useEffect(() => {
    const updateTime = () => {
      const now = getToday()
      setCurrentTime(now)
      const hour = now.getHours()
      setGreeting(hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening')
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [getToday])

  const quickActions = [
    { title: 'Clock In/Out', description: 'Record your attendance', icon: ClockIcon, href: getHRPortalPath('attendance'), gradient: 'from-orange-500 to-amber-600' },
    { title: 'Request Leave', description: 'Submit leave application', icon: CalendarIcon, href: getHRPortalPath('leaves'), gradient: 'from-emerald-500 to-teal-600' },
    { title: 'Update Profile', description: 'Manage your information', icon: UserIcon, href: getHRPortalPath('profile'), gradient: 'from-violet-500 to-purple-600' },
    { title: 'View Documents', description: 'Access HR documents', icon: DocumentTextIcon, href: getHRPortalPath('documents'), gradient: 'from-pink-500 to-rose-600' },
  ]

  const firstName = profile?.firstName || user?.firstName || 'there'

  /* Loading */
  if (!isLoaded) return (
    <HRPortalLayout currentPage="dashboard">
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#fff7ed,#ffffff,#fffbf7)' }}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-orange-600 font-semibold">Loading your workspace...</p>
        </div>
      </div>
    </HRPortalLayout>
  )

  /* Not signed in */
  if (!user) return (
    <HRPortalLayout currentPage="dashboard">
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Access Denied</h2>
          <p className="text-neutral-600">Please sign in to access the HR portal</p>
        </div>
      </div>
    </HRPortalLayout>
  )

  /* ── Root classes based on dark mode ── */
  const bg    = dark ? 'bg-neutral-900' : 'bg-orange-50'
  const card  = dark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-orange-100'
  const text  = dark ? 'text-white' : 'text-neutral-900'
  const muted = dark ? 'text-neutral-400' : 'text-neutral-500'

  return (
    <HRPortalLayout>
      <ProfileSyncStatus />

      <div className={`min-h-screen ${bg} transition-colors duration-300`}
           style={!dark ? { backgroundImage: 'radial-gradient(circle, rgba(251,146,60,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' } : {}}>

        {/* ── TOP HERO BANNER ───────────────────────────────── */}
        <div className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-6 pb-0">
          <div className="relative rounded-3xl overflow-hidden shadow-xl"
               style={{ background: dark
                 ? 'linear-gradient(135deg,#1c1007 0%,#7c2d12 50%,#1c0a03 100%)'
                 : 'linear-gradient(135deg,#ea580c 0%,#f97316 45%,#fb923c 100%)' }}>

            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-36 translate-x-36 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-24 -translate-x-24 blur-3xl" />

            <div className="relative z-10 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Greeting */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <SparklesIcon className="w-5 h-5 text-amber-300 animate-pulse" />
                    <span className="text-white/70 text-sm font-medium">{greeting}</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1">
                    {firstName}! 👋
                  </h1>
                  <p className="text-orange-100 text-sm">Here's what's happening at work today.</p>
                </div>

                {/* Clock */}
                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <div className="text-3xl font-black text-white tabular-nums">
                      {currentTime ? formatTime(currentTime, 'hh:mm') : '--:--'}
                      <span className="text-lg font-medium text-orange-200 ml-1">
                        {currentTime ? formatTime(currentTime, 'a') : ''}
                      </span>
                    </div>
                    <div className="text-orange-200 text-xs mt-0.5">
                      {currentTime ? formatTime(currentTime, 'EEEE, MMM d') : ''}
                    </div>
                  </div>

                  {/* Dark mode toggle */}
                  <button
                    onClick={toggleDark}
                    className="flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-all duration-200
                               border border-white/20 rounded-full px-4 py-2 text-white text-xs font-semibold
                               backdrop-blur-sm"
                  >
                    {dark ? <SunIcon className="w-4 h-4 text-amber-300" /> : <MoonIcon className="w-4 h-4" />}
                    {dark ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </div>
              </div>

              {/* Quick stat pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                {[
                  { label: 'Days Present', value: '18', icon: ClockIcon, color: 'from-white/20 to-white/10' },
                  { label: 'Leave Balance', value: '12d', icon: CalendarIcon, color: 'from-white/20 to-white/10' },
                  { label: 'Tasks Done', value: '7', icon: BoltIcon, color: 'from-white/20 to-white/10' },
                  { label: 'Notifications', value: '3', icon: BellIcon, color: 'from-white/20 to-white/10' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-white leading-none">{s.value}</p>
                      <p className="text-orange-200 text-[10px] font-medium">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── PAGE BODY ─────────────────────────────────────── */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* Dashboard summary */}
          <DashboardSummaryCards userId={user?.id || ''} />

          {/* Quick Actions  +  Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Quick Actions */}
            <div className={`rounded-3xl border p-6 shadow-sm ${card}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
                  <BoltIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`font-bold text-base ${text}`}>Quick Actions</h2>
                  <p className={`text-xs ${muted}`}>Common tasks at a glance</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickActions.map(a => (
                  <QuickActionCard key={a.title} {...a} dark={dark} />
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <RecentActivityWidget userId={user?.id || ''} />
          </div>

          {/* Team Stats */}
          <div className={`rounded-3xl border shadow-sm overflow-hidden ${card}`}>
            <div className="px-6 py-4 border-b flex items-center justify-between"
                 style={{ borderColor: dark ? '#404040' : '#ffedd5' }}>
              <div className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-orange-500" />
                <span className={`font-bold text-sm ${text}`}>Team Overview</span>
              </div>
              <Link href={getHRPortalPath('team')} className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1">
                View All <ChevronRightIcon className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4">
              <TeamStatsView userId={user?.id || ''} />
            </div>
          </div>

          {/* Predictive AI */}
          <div className={`rounded-3xl border shadow-sm overflow-hidden ${card}`}>
            <div className="px-6 py-4 border-b flex items-center gap-2"
                 style={{ borderColor: dark ? '#404040' : '#ffedd5' }}>
              <SparklesIcon className="w-5 h-5 text-orange-500" />
              <span className={`font-bold text-sm ${text}`}>AI Insights</span>
              <span className="ml-auto text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">BETA</span>
            </div>
            <div className="p-4">
              <PredictiveAIFeatures userId={user?.id || ''} />
            </div>
          </div>

          {/* Help Footer */}
          <div className={`rounded-3xl border p-6 shadow-sm ${card}`}
               style={{ background: dark ? '' : 'linear-gradient(135deg,#fff7ed,#fffbf7)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
                <TrendingUpIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-bold text-base ${text}`}>Need Help?</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Cog6ToothIcon, label: 'Settings', sub: 'Account preferences', href: getHRPortalPath('settings') },
                { icon: UsersIcon, label: 'Team', sub: 'Manage your team', href: getHRPortalPath('team') },
                { icon: DocumentTextIcon, label: 'Documents', sub: 'HR resources', href: getHRPortalPath('documents') },
              ].map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:shadow-md group
                              ${dark
                                ? 'bg-neutral-700 border-neutral-600 hover:border-orange-500/40'
                                : 'bg-white/80 border-orange-100 hover:border-orange-200'}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${text}`}>{item.label}</p>
                    <p className={`text-xs ${muted}`}>{item.sub}</p>
                  </div>
                  <ArrowRightIcon className={`w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform ${muted}`} />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </HRPortalLayout>
  )
}
