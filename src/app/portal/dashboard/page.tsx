'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useDevSafeUser } from '../../../lib/hooks/useDevSafeClerk'
import HRPortalLayout from '../../../components/hr/HRPortalLayout'
import RecentActivityWidget from '../../../components/hr/RecentActivityWidget'
import { ProfileSyncStatus } from '../../../components/hr/ProfileSyncProvider'
import { useProfileSync } from '../../../lib/hooks/useProfileSync'
import { getHRPortalPath } from '../../../lib/urlUtils'
import { useTimezone } from '../../../lib/hooks/useTimezone'
import Link from 'next/link'
import {
  ClockIcon, CalendarIcon, UserIcon, DocumentTextIcon, Cog6ToothIcon,
  UsersIcon, ArrowRightIcon, BoltIcon, MoonIcon, SunIcon, BellIcon,
  SparklesIcon, TrophyIcon, ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'

function useCountUp(target: number, dur = 1200, delay = 0) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      let s: number | null = null
      const step = (ts: number) => {
        if (!s) s = ts
        const p = Math.min((ts - s) / dur, 1)
        setV(Math.round((1 - Math.pow(1 - p, 3)) * target))
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(t)
  }, [target, dur, delay])
  return v
}

function useDarkMode() {
  const [dark, setDark] = useState(false)
  useEffect(() => { 
    if (localStorage.getItem('hr-dark-mode') === 'true') {
      setDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])
  const toggle = useCallback(() => {
    setDark(d => { 
      const next = !d
      localStorage.setItem('hr-dark-mode', String(next))
      if (next) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
      return next
    })
  }, [])
  return { dark, toggle }
}

function Ring({ pct, size = 64, stroke = 6, color = '#6366f1', bg = 'rgba(99,102,241,0.12)', children }: {
  pct: number; size?: number; stroke?: number; color?: string; bg?: string; children?: React.ReactNode
}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${c*pct/100} ${c}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

/* ── Glassmorphic wrapper ── */
const G = ({ dark, children, className = '' }: { dark: boolean; children: React.ReactNode; className?: string }) => (
  <div className={`glass-panel transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow-blue)] rounded-2xl ${className}`}>
    {children}
  </div>
)

export default function HRPortalDashboard() {
  const { user, isLoaded } = useDevSafeUser()
  const { profile } = useProfileSync()
  const { formatTime, getToday } = useTimezone()
  const { dark, toggle: toggleDark } = useDarkMode()
  const [now, setNow] = useState<Date | null>(null)
  const [greeting, setGreeting] = useState('Welcome')
  const [clockedIn, setClockedIn] = useState(false)
  const [elapsed, setElapsed] = useState('00:00:00')
  const startRef = useRef<Date | null>(null)

  // Real data state
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0, pct: 0 })
  const [leaveData, setLeaveData] = useState<{ label: string; used: number; total: number; color: string }[]>([])
  const [notifCount, setNotifCount] = useState(0)
  const [totalLeaveRemaining, setTotalLeaveRemaining] = useState(0)

  // Fetch real dashboard data
  useEffect(() => {
    if (!user?.id) return
    const uid = user.id
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    // Attendance
    fetch(`/api/attendance?userId=${uid}&month=${month}&year=${year}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const records = d.data || []
          const presentDays = records.filter((r: any) => r.clockInTime).length
          const workingDays = Math.max(presentDays, 1)
          // estimate total working days in month (weekdays so far)
          const daysInMonth = new Date(year, month, 0).getDate()
          let totalWorkDays = 0
          for (let i = 1; i <= daysInMonth; i++) {
            const day = new Date(year, month - 1, i).getDay()
            if (day !== 0 && day !== 6) totalWorkDays++
          }
          const pct = totalWorkDays > 0 ? Math.round((presentDays / totalWorkDays) * 100) : 0
          setAttendanceStats({ present: presentDays, total: totalWorkDays, pct })
        }
      })
      .catch(() => {})

    // Leave balance
    fetch(`/api/leaves/balance?userId=${uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          const colors = ['from-indigo-500 to-violet-500', 'from-fuchsia-400 to-pink-500', 'from-teal-400 to-emerald-500', 'from-amber-400 to-orange-500', 'from-cyan-400 to-blue-500']
          const mapped = (d.data.leaveTypes || []).map((lt: any, i: number) => ({
            label: lt.type.replace(' Leave', ''),
            used: lt.taken || 0,
            total: lt.total || 0,
            color: colors[i % colors.length],
          }))
          setLeaveData(mapped)
          setTotalLeaveRemaining(d.data.summary?.totalRemaining || 0)
        }
      })
      .catch(() => {})

    // Notifications
    fetch(`/api/notifications?userId=${uid}&unreadOnly=true&limit=100`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setNotifCount(d.data?.length || d.notifications?.length || 0)
      })
      .catch(() => {})
  }, [user?.id])

  useEffect(() => {
    const u = () => { const n = getToday(); setNow(n); const h = n.getHours(); setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening') }
    u(); const t = setInterval(u, 1000); return () => clearInterval(t)
  }, [getToday])

  useEffect(() => {
    if (!clockedIn) return
    const id = setInterval(() => {
      if (!startRef.current) return
      const d = Date.now() - startRef.current.getTime()
      const h = Math.floor(d/3600000), m = Math.floor((d%3600000)/60000), s = Math.floor((d%60000)/1000)
      setElapsed(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }, 1000)
    return () => clearInterval(id)
  }, [clockedIn])

  const toggleClock = () => {
    if (!clockedIn) { startRef.current = new Date(); setClockedIn(true) }
    else { setClockedIn(false); setElapsed('00:00:00'); startRef.current = null }
  }

  const firstName = profile?.firstName || user?.firstName || 'there'

  const actions = [
    { t: 'Clock In/Out', d: 'Record attendance', icon: ClockIcon, href: getHRPortalPath('attendance'), grad: 'from-indigo-500 to-violet-600' },
    { t: 'Request Leave', d: 'Submit application', icon: CalendarIcon, href: getHRPortalPath('leaves'), grad: 'from-fuchsia-500 to-pink-500' },
    { t: 'Update Profile', d: 'Your information', icon: UserIcon, href: getHRPortalPath('profile'), grad: 'from-teal-400 to-emerald-500' },
    { t: 'Documents', d: 'Access HR files', icon: DocumentTextIcon, href: getHRPortalPath('documents'), grad: 'from-cyan-400 to-blue-500' },
    { t: 'Team Chat', d: 'Message colleagues', icon: ChatBubbleLeftRightIcon, href: getHRPortalPath('chat'), grad: 'from-rose-400 to-pink-500' },
    { t: 'Achievements', d: 'Your milestones', icon: TrophyIcon, href: getHRPortalPath('profile'), grad: 'from-amber-400 to-orange-500' },
  ]

  if (!isLoaded) return (
    <HRPortalLayout currentPage="dashboard">
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
          </div>
          <p className="text-indigo-600 font-bold text-lg">Loading…</p>
        </div>
      </div>
    </HRPortalLayout>
  )

  if (!user) return (
    <HRPortalLayout currentPage="dashboard">
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-xl font-bold text-neutral-900">Please sign in</h2>
      </div>
    </HRPortalLayout>
  )

  const txt = 'text-[var(--mac-text-primary)]'
  const sub = 'text-[var(--mac-text-secondary)]'
  const leaves = leaveData.length > 0 ? leaveData : [
    { label: 'Annual', used: 0, total: 0, color: 'from-[#007aff] to-[#0052ad]' },
    { label: 'Sick', used: 0, total: 0, color: 'from-[#5856d6] to-[#4040b0]' },
    { label: 'Casual', used: 0, total: 0, color: 'from-[#34c759] to-[#248a3d]' },
  ]

  return (
    <HRPortalLayout>
      <ProfileSyncStatus />
      <div className="min-h-screen transition-colors duration-500">

        {/* ━━ HERO ━━ */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6">
          <div className="page-hero mb-8 animate-fade-in flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#34c759]" />
                <span className="text-[var(--mac-text-secondary)] text-[11px] font-semibold tracking-wide uppercase">System Active</span>
                <span className="text-[var(--mac-text-secondary)] text-[11px]">·</span>
                <span className="text-[var(--mac-text-secondary)] text-[11px]">{greeting}</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-1 text-[var(--mac-text-primary)]">
                Hey, {firstName}!
              </h1>
              <p className="text-[var(--mac-text-secondary)] text-[13px]">
                {now ? formatTime(now, 'EEEE, MMMM d') : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-1 hidden sm:block">
                <p className="text-2xl font-bold tabular-nums tracking-tight text-[var(--mac-text-primary)]">
                  {now ? formatTime(now, 'hh:mm') : '--:--'}
                  <span className="text-[13px] text-[var(--mac-text-secondary)] ml-1">{now ? formatTime(now, 'a') : ''}</span>
                </p>
              </div>
              <button onClick={toggleDark} className="p-2.5 rounded-full bg-[var(--mac-border)] hover:bg-[var(--mac-border-strong)] transition-all">
                {dark ? <SunIcon className="w-5 h-5 text-[var(--mac-text-primary)]" /> : <MoonIcon className="w-5 h-5 text-[var(--mac-text-primary)]" />}
              </button>
              <button className="relative p-2.5 rounded-full bg-[var(--mac-border)] hover:bg-[var(--mac-border-strong)] transition-all">
                <BellIcon className="w-5 h-5 text-[var(--mac-text-primary)]" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#ff3b30] rounded-full border-2 border-white" />
              </button>
            </div>
          </div>

          {/* Mini stat pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { l: 'Days Present', v: String(attendanceStats.present), icon: '📅' },
              { l: 'Leave Balance', v: `${totalLeaveRemaining}d`, icon: '🏖️' },
              { l: 'Attendance', v: `${attendanceStats.pct}%`, icon: '✅' },
              { l: 'Notifications', v: String(notifCount), icon: '🔔' },
            ].map(s => (
              <div key={s.l} className="card px-4 py-3 border border-[var(--mac-border)] shadow-[var(--mac-shadow)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{s.icon}</span>
                  <span className="text-[var(--mac-text-secondary)] text-[10px] font-medium uppercase tracking-wider">{s.l}</span>
                </div>
                <div className={`text-lg font-bold text-[var(--mac-text-primary)] tabular-nums`}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* ━━ WIDGETS ROW ━━ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 animate-fade-in-delay-1">
            {/* Attendance Ring */}
            <G dark={dark} className="p-5">
              <p className={`text-[11px] font-semibold uppercase tracking-wider mb-4 ${sub}`}>Monthly Attendance</p>
              <div className="flex items-center gap-5">
                <Ring pct={attendanceStats.pct} size={70} stroke={6} color="var(--mac-accent)" bg="var(--mac-border)">
                  <span className={`text-sm font-bold ${txt}`}>{attendanceStats.present}</span>
                </Ring>
                <div className="flex-1">
                  <p className={`text-xl font-bold ${txt}`}>{attendanceStats.pct}%</p>
                  <p className={`text-[12px] ${sub}`}>{attendanceStats.present} of {attendanceStats.total} working days</p>
                  <div className="flex gap-0.5 mt-2">
                    {Array.from({ length: Math.max(attendanceStats.total, 1) }).map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-sm transition-all duration-500 ${
                        i < attendanceStats.present ? 'bg-[var(--mac-accent)]' : 'bg-[var(--mac-border)]'
                      }`} style={{ transitionDelay: `${i * 20}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            </G>

            {/* Clock In/Out */}
            <G dark={dark} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className={`text-[11px] font-bold uppercase tracking-wider ${sub}`}>Clock In / Out</p>
                <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  clockedIn
                    ? 'bg-[#34c759]/10 text-[#34c759]'
                    : 'bg-[var(--mac-border)] text-[var(--mac-text-secondary)]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${clockedIn ? 'bg-[#34c759] animate-pulse' : 'bg-gray-400'}`} />
                  {clockedIn ? 'Active' : 'Offline'}
                </span>
              </div>
              <p className={`text-3xl font-bold tabular-nums mb-1 ${txt}`}>{elapsed}</p>
              <p className={`text-[12px] mb-4 ${sub}`}>{clockedIn ? 'Session running…' : 'Not clocked in yet'}</p>
              <button onClick={toggleClock} className={`w-full py-2 rounded-lg font-medium text-[13px] transition-all duration-150 ${
                clockedIn
                  ? 'bg-transparent border border-[var(--mac-border-strong)] text-[var(--mac-text-primary)] hover:bg-[var(--mac-border)]'
                  : 'bg-[var(--mac-accent)] text-white shadow-sm hover:bg-[var(--mac-accent-hover)]'
              }`}>
                {clockedIn ? '⏹ Clock Out' : '▶ Clock In'}
              </button>
            </G>

            {/* Leave Balance */}
            <G dark={dark} className="p-5">
              <p className={`text-[11px] font-bold uppercase tracking-[0.15em] mb-4 ${sub}`}>Leave Balance</p>
              <div className="space-y-3.5">
                {leaves.map(l => {
                  const pct = Math.round((l.used / l.total) * 100)
                  return (
                    <div key={l.label}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[12px] font-medium text-[var(--mac-text-secondary)]`}>{l.label}</span>
                        <span className={`text-[12px] font-bold ${txt}`}>{l.total - l.used} left</span>
                      </div>
                      <div className={`h-1.5 rounded-sm bg-[var(--mac-border)]`}>
                        <div className={`h-1.5 rounded-sm bg-gradient-to-r ${l.color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className={`text-[10px] mt-0.5 text-[var(--mac-text-muted)]`}>{l.used} used of {l.total}</p>
                    </div>
                  )
                })}
              </div>
            </G>
          </div>

          {/* ━━ DAILY GOALS + QUICK ACTIONS ━━ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6 animate-fade-in-delay-2">
            {/* Leave Summary */}
            <G dark={dark} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className={`text-[11px] font-bold uppercase tracking-[0.15em] ${sub}`}>Leave Summary</p>
                  <p className={`text-sm font-bold mt-0.5 ${txt}`}>{totalLeaveRemaining} days remaining</p>
                </div>
                <Ring pct={leaves.reduce((s, l) => s + l.total, 0) > 0 ? Math.round((leaves.reduce((s, l) => s + l.used, 0) / leaves.reduce((s, l) => s + l.total, 0)) * 100) : 0} size={44} stroke={4} color="var(--mac-success)" bg="var(--mac-border)">
                  <span className="text-[10px] font-bold text-[var(--mac-success)]">{totalLeaveRemaining}</span>
                </Ring>
              </div>
              <div className="space-y-2">
                {leaves.map(l => (
                  <div key={l.label} className={`flex items-center gap-3 p-2 rounded-lg bg-[var(--mac-bg)]`}>
                    <div className={`w-2 h-2 rounded-full bg-[var(--mac-accent)]`} />
                    <span className={`text-[12px] font-medium flex-1 text-[var(--mac-text-primary)]`}>{l.label}</span>
                    <span className={`text-[12px] font-bold ${txt}`}>{l.total - l.used} left</span>
                  </div>
                ))}
              </div>
            </G>

            {/* Quick Actions */}
            <G dark={dark} className="p-5 lg:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[var(--mac-accent)] flex items-center justify-center">
                  <BoltIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className={`font-semibold text-[13px] ${txt}`}>Quick Actions</h2>
                  <p className={`text-[11px] ${sub}`}>Common tasks at a glance</p>
                </div>
                <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--mac-border)] text-[var(--mac-text-secondary)]`}>
                  {actions.length} actions
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {actions.map((a, i) => (
                  <Link key={a.t} href={a.href}
                    className="group flex items-center gap-3 p-3 rounded-lg border border-[var(--mac-border)] transition-colors duration-150 hover:bg-[var(--mac-border)]">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--mac-accent)] flex-shrink-0">
                      <a.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-[12px] ${txt}`}>{a.t}</p>
                      <p className={`text-[11px] truncate ${sub}`}>{a.d}</p>
                    </div>
                    <ArrowRightIcon className={`w-3 h-3 flex-shrink-0 transition-transform group-hover:translate-x-0.5 text-[var(--mac-text-secondary)]`} />
                  </Link>
                ))}
              </div>
            </G>
          </div>

          {/* ━━ RECENT ACTIVITY ━━ */}
          <div className="mb-6 animate-fade-in-delay-3">
            <RecentActivityWidget userId={user?.id || ''} />
          </div>

          {/* ━━ EXPLORE MORE ━━ */}
          <div className="mb-8 animate-fade-in-delay-3">
            <G dark={dark} className="p-6" >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[var(--mac-accent)] flex items-center justify-center">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className={`font-semibold text-[13px] ${txt}`}>Explore More</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Cog6ToothIcon, label: 'Settings', s: 'Account preferences', href: getHRPortalPath('settings') },
                  { icon: UsersIcon, label: 'Team', s: 'Manage your team', href: getHRPortalPath('team') },
                  { icon: DocumentTextIcon, label: 'Documents', s: 'HR resources', href: getHRPortalPath('documents') },
                ].map(item => (
                  <Link key={item.label} href={item.href}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[var(--mac-border)] transition-colors duration-150 hover:bg-[var(--mac-border)] group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--mac-bg)]">
                      <item.icon className="w-4 h-4 text-[var(--mac-accent)]" />
                    </div>
                    <div>
                      <p className={`font-medium text-[12px] ${txt}`}>{item.label}</p>
                      <p className={`text-[11px] ${sub}`}>{item.s}</p>
                    </div>
                    <ArrowRightIcon className={`w-3 h-3 ml-auto group-hover:translate-x-0.5 transition-transform ${sub}`} />
                  </Link>
                ))}
              </div>
            </G>
          </div>
        </div>
      </div>
    </HRPortalLayout>
  )
}
