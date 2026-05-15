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
  UsersIcon, ArrowRightIcon, BoltIcon, BellIcon,
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

function Ring({ pct, size = 64, stroke = 6, color = 'var(--accent)', bg = 'rgba(255,255,255,0.06)', children }: {
  pct: number; size?: number; stroke?: number; color?: string; bg?: string; children?: React.ReactNode
}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${c*pct/100} ${c}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 4px ${color})` }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

/* ── Glass Card Wrapper ── */
const GlassCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`glass transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${className}`}>
    {children}
  </div>
)

export default function HRPortalDashboard() {
  const { user, isLoaded } = useDevSafeUser()
  const { profile } = useProfileSync()
  const { formatTime, getToday } = useTimezone()
  const [now, setNow] = useState<Date | null>(null)
  const [greeting, setGreeting] = useState('Welcome')

  // Real data state
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0, pct: 0 })
  const [leaveData, setLeaveData] = useState<{ label: string; used: number; total: number; color: string }[]>([])
  const [notifCount, setNotifCount] = useState(0)
  const [totalLeaveRemaining, setTotalLeaveRemaining] = useState(0)
  const [priorityMsg, setPriorityMsg] = useState<{message: string, senderName: string} | null>(null)

  // Fetch real dashboard data
  useEffect(() => {
    if (!isLoaded || !user?.id) return
    const uid = user.id
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    // Attendance
    fetch(`/api/attendance?userId=${uid}&month=${month}&year=${year}`)
      .then(r => {
        if (!r.ok) return null
        return r.json()
      })
      .then(d => {
        if (!d?.success) return
        // Handle both older array format and newer {records, summary} format
        const records = Array.isArray(d.data) ? d.data : (d.data?.records || [])
        const presentDays = d.data?.summary?.presentDays || records.filter((r: any) => r.clockIn).length

        const daysInMonth = new Date(year, month, 0).getDate()
        let totalWorkDays = 0
        for (let i = 1; i <= daysInMonth; i++) {
          const day = new Date(year, month - 1, i).getDay()
          if (day !== 0 && day !== 6) totalWorkDays++
        }
        const pct = totalWorkDays > 0 ? Math.round((presentDays / totalWorkDays) * 100) : 0
        setAttendanceStats({ present: presentDays, total: totalWorkDays, pct })
      })
      .catch(() => {})

    // Leave balance
    fetch(`/api/leaves/balance?userId=${uid}`)
      .then(r => {
        if (!r.ok) return null
        return r.json()
      })
      .then(d => {
        if (!d?.success || !d.data) return
        const colors = ['var(--accent)', '#60a5fa', '#a78bfa', '#fbbf24', '#fb923c']
        const mapped = (d.data.leaveTypes || []).map((lt: any, i: number) => ({
          label: lt.type.replace(' Leave', ''),
          used: lt.taken || 0,
          total: lt.total || 0,
          color: colors[i % colors.length],
        }))
        setLeaveData(mapped)
        setTotalLeaveRemaining(d.data.summary?.totalRemaining || 0)
      })
      .catch(() => {})

    // Notifications
    fetch(`/api/notifications?userId=${uid}&unreadOnly=true&limit=100`)
      .then(r => {
        if (!r.ok) return null
        return r.json()
      })
      .then(d => {
        if (d?.success) setNotifCount(d.data?.length || d.notifications?.length || 0)
      })
      .catch(() => {})

    // Priority Message
    fetch('/api/priority-msg')
      .then(r => {
        if (!r.ok) return null
        return r.json()
      })
      .then(d => {
        if (d?.success && d.data) setPriorityMsg(d.data)
      })
      .catch(() => {})
  }, [isLoaded, user?.id])

  useEffect(() => {
    const u = () => { const n = getToday(); setNow(n); const h = n.getHours(); setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening') }
    u(); const t = setInterval(u, 1000); return () => clearInterval(t)
  }, [getToday])

  const firstName = profile?.firstName || user?.firstName || 'there'

  const actions = [
    { t: 'Clock In/Out', d: 'Record attendance', icon: ClockIcon, href: getHRPortalPath('attendance') },
    { t: 'Request Leave', d: 'Submit application', icon: CalendarIcon, href: getHRPortalPath('leaves') },
    { t: 'Update Profile', d: 'Your information', icon: UserIcon, href: getHRPortalPath('profile') },
    { t: 'Documents', d: 'Access HR files', icon: DocumentTextIcon, href: getHRPortalPath('documents') },
    { t: 'Team Chat', d: 'Message colleagues', icon: ChatBubbleLeftRightIcon, href: getHRPortalPath('chat') },
    { t: 'Achievements', d: 'Your milestones', icon: TrophyIcon, href: getHRPortalPath('profile') },
  ]

  if (!isLoaded) return (
    <HRPortalLayout currentPage="dashboard">
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--glass-border)]" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[var(--accent)] animate-spin" />
          </div>
          <p className="text-[var(--accent)] font-medium text-sm">Loading…</p>
        </div>
      </div>
    </HRPortalLayout>
  )

  if (!user) return (
    <HRPortalLayout currentPage="dashboard">
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Please sign in</h2>
      </div>
    </HRPortalLayout>
  )

  const leaves = leaveData.length > 0 ? leaveData : [
    { label: 'Annual', used: 0, total: 0, color: 'var(--accent)' },
    { label: 'Sick', used: 0, total: 0, color: '#60a5fa' },
    { label: 'Casual', used: 0, total: 0, color: '#a78bfa' },
  ]

  return (
    <HRPortalLayout>
      <ProfileSyncStatus />
      <div className="min-h-screen transition-colors duration-500">

        {/* ━━ HERO BANNER ━━ */}
        <div className="mb-8 animate-fade-in">
          <div className="page-hero relative overflow-hidden">
            {/* Ambient glow inside hero */}
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[100px] opacity-30 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(52, 211, 153, 0.3), transparent)' }}
            />
            <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(96, 165, 250, 0.3), transparent)' }}
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" style={{ boxShadow: '0 0 8px var(--accent-glow)' }} />
                  <span className="text-[var(--text-muted)] text-[11px] font-medium tracking-wider uppercase">{greeting}</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-1.5 text-[var(--text-primary)]">
                  Hey, <span className="text-gradient">{firstName}</span>!
                </h1>
                <p className="text-[var(--text-secondary)] text-[14px]">
                  {now ? formatTime(now, 'EEEE, MMMM d') : ''} — Ready to make today productive?
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-3xl font-bold tabular-nums tracking-tight text-[var(--text-primary)]" style={{ fontFeatureSettings: '"tnum"' }}>
                    {now ? formatTime(now, 'hh:mm') : '--:--'}
                  </p>
                  <p className="text-[12px] text-[var(--text-muted)] uppercase tracking-wider">{now ? formatTime(now, 'a') : ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ━━ PRIORITY MESSAGE ━━ */}
        {priorityMsg && (
          <div className="mb-8 animate-fade-in-delay-1">
            <div className="relative overflow-hidden rounded-2xl p-6"
              style={{
                background: 'rgba(248, 113, 113, 0.08)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                boxShadow: '0 4px 20px rgba(248, 113, 113, 0.1)'
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-danger)] rounded-full blur-[60px] opacity-20 pointer-events-none" />
              <div className="relative z-10 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(248, 113, 113, 0.2)', border: '1px solid rgba(248, 113, 113, 0.4)' }}
                >
                  <span className="text-xl">🚨</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-danger)] mb-1">PRIORITY ANNOUNCEMENT</h3>
                  <p className="text-[14px] text-[var(--text-primary)] font-medium leading-relaxed">{priorityMsg.message}</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-2">Sent by {priorityMsg.senderName}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ━━ STAT PILLS ━━ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-fade-in-delay-1">
          {[
            { l: 'Days Present', v: String(attendanceStats.present), icon: '📅', glow: false },
            { l: 'Leave Balance', v: `${totalLeaveRemaining}d`, icon: '🏖️', glow: false },
            { l: 'Attendance', v: `${attendanceStats.pct}%`, icon: '✅', glow: true },
            { l: 'Notifications', v: String(notifCount), icon: '🔔', glow: false },
          ].map(s => (
            <GlassCard key={s.l} className={`px-5 py-4 ${s.glow ? 'animate-glow' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{s.icon}</span>
                <span className="text-[var(--text-muted)] text-[10px] font-semibold uppercase tracking-wider">{s.l}</span>
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">{s.v}</div>
            </GlassCard>
          ))}
        </div>

        {/* ━━ WIDGETS ROW ━━ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 animate-fade-in-delay-1">
          {/* Attendance Ring */}
          <GlassCard className="p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-5">Monthly Attendance</p>
            <div className="flex items-center gap-5">
              <Ring pct={attendanceStats.pct} size={76} stroke={5} color="var(--accent)" bg="rgba(255,255,255,0.06)">
                <span className="text-sm font-bold text-[var(--accent)]">{attendanceStats.present}</span>
              </Ring>
              <div className="flex-1">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{attendanceStats.pct}%</p>
                <p className="text-[12px] text-[var(--text-secondary)]">{attendanceStats.present} of {attendanceStats.total} days</p>
                <div className="flex gap-0.5 mt-3">
                  {Array.from({ length: Math.max(attendanceStats.total, 1) }).map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                      i < attendanceStats.present ? 'bg-[var(--accent)]' : 'bg-[rgba(255,255,255,0.06)]'
                    }`} style={{ transitionDelay: `${i * 20}ms`, boxShadow: i < attendanceStats.present ? '0 0 4px rgba(52,211,153,0.3)' : 'none' }} />
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Record Attendance Link */}
          <GlassCard className="p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Quick Action</p>
              </div>
              <div className="flex items-center gap-4 mb-5">
                <div className="h-12 w-12 rounded-full bg-[rgba(52,211,153,0.12)] flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Record Attendance</h3>
                  <p className="text-[12px] text-[var(--text-secondary)]">Log your daily work hours</p>
                </div>
              </div>
            </div>
            <Link 
              href={getHRPortalPath('attendance')} 
              className="w-full py-2.5 rounded-xl font-semibold text-[13px] bg-[var(--accent)] text-[#0f172a] hover:bg-[var(--accent-hover)] transition-all duration-300 flex justify-center items-center gap-2" 
              style={{ boxShadow: '0 4px 20px rgba(52,211,153,0.25)' }}
            >
              <ClockIcon className="h-4 w-4" />
              Go to Attendance
            </Link>
          </GlassCard>

          {/* Leave Balance */}
          <GlassCard className="p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-5">Leave Balance</p>
            <div className="space-y-4">
              {leaves.map(l => {
                const pct = l.total > 0 ? Math.round((l.used / l.total) * 100) : 0
                return (
                  <div key={l.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[12px] font-medium text-[var(--text-secondary)]">{l.label}</span>
                      <span className="text-[12px] font-bold text-[var(--text-primary)]">{l.total - l.used} left</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)]">
                      <div className="h-1.5 rounded-full transition-all duration-1000" style={{ 
                        width: `${pct}%`, 
                        background: l.color,
                        boxShadow: `0 0 8px ${l.color}40`
                      }} />
                    </div>
                    <p className="text-[10px] mt-1 text-[var(--text-muted)]">{l.used} used of {l.total}</p>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </div>

        {/* ━━ LEAVE SUMMARY + QUICK ACTIONS ━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8 animate-fade-in-delay-2">
          {/* Leave Summary */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Leave Summary</p>
                <p className="text-lg font-bold mt-1 text-[var(--text-primary)]">{totalLeaveRemaining} <span className="text-[13px] font-normal text-[var(--text-secondary)]">days remaining</span></p>
              </div>
              <Ring pct={leaves.reduce((s, l) => s + l.total, 0) > 0 ? Math.round((leaves.reduce((s, l) => s + l.used, 0) / leaves.reduce((s, l) => s + l.total, 0)) * 100) : 0} size={48} stroke={4} color="var(--accent)" bg="rgba(255,255,255,0.06)">
                <span className="text-[10px] font-bold text-[var(--accent)]">{totalLeaveRemaining}</span>
              </Ring>
            </div>
            <div className="space-y-2">
              {leaves.map(l => (
                <div key={l.label} className="flex items-center gap-3 p-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.04)]">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.color, boxShadow: `0 0 6px ${l.color}40` }} />
                  <span className="text-[12px] font-medium flex-1 text-[var(--text-primary)]">{l.label}</span>
                  <span className="text-[12px] font-bold text-[var(--text-primary)]">{l.total - l.used} left</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--accent-muted)', border: '1px solid rgba(52,211,153,0.15)' }}
              >
                <BoltIcon className="w-[18px] h-[18px] text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="font-semibold text-[14px] text-[var(--text-primary)]">Quick Actions</h2>
                <p className="text-[11px] text-[var(--text-muted)]">Common tasks at a glance</p>
              </div>
              <span className="ml-auto text-[10px] font-medium px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)] border border-[var(--glass-border)]">
                {actions.length} actions
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {actions.map((a) => (
                <Link key={a.t} href={a.href}
                  className="group flex items-center gap-3 p-3.5 rounded-xl border border-[var(--glass-border)] bg-[rgba(255,255,255,0.02)] transition-all duration-300 hover:bg-[rgba(255,255,255,0.05)] hover:border-[var(--glass-border-hover)] hover:-translate-y-0.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105"
                    style={{ background: 'var(--accent-muted)', border: '1px solid rgba(52,211,153,0.12)' }}
                  >
                    <a.icon className="w-4 h-4 text-[var(--accent)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[12px] text-[var(--text-primary)]">{a.t}</p>
                    <p className="text-[11px] truncate text-[var(--text-muted)]">{a.d}</p>
                  </div>
                  <ArrowRightIcon className="w-3 h-3 flex-shrink-0 transition-transform group-hover:translate-x-1 text-[var(--text-muted)] group-hover:text-[var(--accent)]" />
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* ━━ RECENT ACTIVITY ━━ */}
        <div className="mb-8 animate-fade-in-delay-3">
          <RecentActivityWidget userId={user?.id || ''} />
        </div>

        {/* ━━ EXPLORE MORE ━━ */}
        <div className="mb-10 animate-fade-in-delay-3">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--accent-muted)', border: '1px solid rgba(52,211,153,0.15)' }}
              >
                <ArrowTrendingUpIcon className="w-[18px] h-[18px] text-[var(--accent)]" />
              </div>
              <h3 className="font-semibold text-[14px] text-[var(--text-primary)]">Explore More</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Cog6ToothIcon, label: 'Settings', s: 'Account preferences', href: getHRPortalPath('settings') },
                { icon: UsersIcon, label: 'Team', s: 'Manage your team', href: getHRPortalPath('team') },
                { icon: DocumentTextIcon, label: 'Documents', s: 'HR resources', href: getHRPortalPath('documents') },
              ].map(item => (
                <Link key={item.label} href={item.href}
                  className="flex items-center gap-3 p-4 rounded-xl border border-[var(--glass-border)] bg-[rgba(255,255,255,0.02)] transition-all duration-300 hover:bg-[rgba(255,255,255,0.05)] hover:border-[var(--glass-border-hover)] hover:-translate-y-0.5 group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(255,255,255,0.04)] border border-[var(--glass-border)]">
                    <item.icon className="w-4 h-4 text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[13px] text-[var(--text-primary)]">{item.label}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{item.s}</p>
                  </div>
                  <ArrowRightIcon className="w-3 h-3 ml-auto group-hover:translate-x-0.5 transition-transform text-[var(--text-muted)] group-hover:text-[var(--accent)]" />
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </HRPortalLayout>
  )
}
