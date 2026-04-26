'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DEV_USER } from '../../../lib/devAuth'
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
  SparklesIcon, CheckCircleIcon, TrophyIcon, ArrowTrendingUpIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'

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
  useEffect(() => { if (localStorage.getItem('hr-dark-mode') === 'true') setDark(true) }, [])
  const toggle = useCallback(() => {
    setDark(d => { localStorage.setItem('hr-dark-mode', String(!d)); return !d })
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
  <div className={`rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
    dark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white/60 border-indigo-100/40'
  } ${className}`} style={{ backdropFilter: 'blur(20px)' }}>{children}</div>
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
  const [goals, setGoals] = useState([
    { id: 1, text: 'Submit Q2 attendance report', done: true },
    { id: 2, text: 'Review leave applications (3)', done: true },
    { id: 3, text: 'Complete profile update', done: false },
    { id: 4, text: 'Team sync meeting at 3 PM', done: false },
  ])

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
  const completed = goals.filter(g => g.done).length

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

  const txt = dark ? 'text-white' : 'text-slate-900'
  const sub = dark ? 'text-neutral-400' : 'text-slate-500'
  const leaves = [
    { label: 'Annual', used: 3, total: 18, color: 'from-indigo-500 to-violet-500' },
    { label: 'Sick', used: 2, total: 12, color: 'from-fuchsia-400 to-pink-500' },
    { label: 'Casual', used: 4, total: 12, color: 'from-teal-400 to-emerald-500' },
  ]

  return (
    <HRPortalLayout>
      <ProfileSyncStatus />
      <div className="min-h-screen transition-colors duration-500" style={{
        background: dark
          ? 'radial-gradient(ellipse at 0% 0%, rgba(99,102,241,0.06) 0%, transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(14,184,166,0.04) 0%, transparent 50%), #0a0a0f'
          : 'radial-gradient(ellipse at 0% 0%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(ellipse at 100% 80%, rgba(14,184,166,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.04) 0%, transparent 40%), #f0f2ff'
      }}>

        {/* ━━ HERO ━━ */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6">
          <div className="relative rounded-3xl overflow-hidden p-8 lg:p-10 mb-8 animate-fade-in" style={{
            background: dark
              ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #3730a3 60%, #4338ca 100%)'
              : 'linear-gradient(135deg, #312e81 0%, #4338ca 25%, #6366f1 55%, #818cf8 80%, #a5b4fc 100%)'
          }}>
            {/* Mesh */}
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse at 80% 20%, rgba(45,212,191,0.2) 0%, transparent 50%), radial-gradient(ellipse at 10% 80%, rgba(244,63,94,0.12) 0%, transparent 50%)'
            }} />
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 animate-float" style={{ background: 'radial-gradient(circle, #2dd4bf, transparent)' }} />

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                    <span className="text-white/80 text-[11px] font-semibold tracking-wide">All systems live</span>
                    <span className="text-white/40 text-[11px]">·</span>
                    <span className="text-white/60 text-[11px]">{greeting}</span>
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-1">
                    Hey, {firstName}! <span className="inline-block animate-bounce-in">✨</span>
                  </h1>
                  <p className="text-indigo-200/70 text-sm">
                    {now ? formatTime(now, 'EEEE, MMMM d') : ''} · Your personal workspace
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-1 hidden sm:block">
                    <p className="text-3xl font-black text-white tabular-nums tracking-tight">
                      {now ? formatTime(now, 'hh:mm') : '--:--'}
                      <span className="text-sm font-bold text-indigo-200 ml-1">{now ? formatTime(now, 'a') : ''}</span>
                    </p>
                  </div>
                  <button onClick={toggleDark} className="p-2.5 rounded-full bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all">
                    {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                  </button>
                  <button className="relative p-2.5 rounded-full bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all">
                    <BellIcon className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-indigo-600" />
                  </button>
                </div>
              </div>

              {/* Mini stat pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">
                {[
                  { l: 'Days Present', v: '18', icon: '📅' },
                  { l: 'Leave Balance', v: '15d', icon: '🏖️' },
                  { l: 'Tasks Done', v: '7', icon: '✅' },
                  { l: 'Notifications', v: '3', icon: '🔔' },
                ].map(s => (
                  <div key={s.l} className="bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] rounded-2xl px-4 py-3 hover:bg-white/[0.14] transition-all duration-300">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{s.icon}</span>
                      <span className="text-white/50 text-[10px] font-medium">{s.l}</span>
                    </div>
                    <div className="text-xl font-black text-white tabular-nums">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ━━ WIDGETS ROW ━━ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 animate-fade-in-delay-1">
            {/* Attendance Ring */}
            <G dark={dark} className="p-5">
              <p className={`text-[11px] font-bold uppercase tracking-[0.15em] mb-4 ${sub}`}>Monthly Attendance</p>
              <div className="flex items-center gap-5">
                <Ring pct={82} size={80} stroke={7} color={dark ? '#818cf8' : '#6366f1'} bg={dark ? 'rgba(129,140,248,0.12)' : 'rgba(99,102,241,0.1)'}>
                  <span className={`text-sm font-black ${txt}`}>18</span>
                </Ring>
                <div className="flex-1">
                  <p className={`text-2xl font-black ${txt}`}>82%</p>
                  <p className={`text-xs ${sub}`}>18 of 22 working days</p>
                  <div className="flex gap-1 mt-2">
                    {Array.from({ length: 22 }).map((_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                        i < 18 ? (dark ? 'bg-indigo-400' : 'bg-indigo-500') : (dark ? 'bg-white/10' : 'bg-indigo-100')
                      }`} style={{ transitionDelay: `${i * 30}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            </G>

            {/* Clock In/Out */}
            <G dark={dark} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className={`text-[11px] font-bold uppercase tracking-[0.15em] ${sub}`}>Clock In / Out</p>
                <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                  clockedIn
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : dark ? 'bg-white/5 text-white/40 border-white/10' : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${clockedIn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                  {clockedIn ? 'Active' : 'Offline'}
                </span>
              </div>
              <p className={`text-3xl font-black tabular-nums mb-1 ${txt}`}>{elapsed}</p>
              <p className={`text-xs mb-4 ${sub}`}>{clockedIn ? 'Session running…' : 'Not clocked in yet'}</p>
              <button onClick={toggleClock} className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 ${
                clockedIn
                  ? dark ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                  : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
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
                        <span className={`text-xs font-medium ${dark ? 'text-neutral-300' : 'text-slate-600'}`}>{l.label}</span>
                        <span className={`text-xs font-bold ${txt}`}>{l.total - l.used} left</span>
                      </div>
                      <div className={`h-2 rounded-full ${dark ? 'bg-white/10' : 'bg-slate-100'}`}>
                        <div className={`h-2 rounded-full bg-gradient-to-r ${l.color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className={`text-[10px] mt-0.5 ${dark ? 'text-neutral-500' : 'text-slate-400'}`}>{l.used} used of {l.total}</p>
                    </div>
                  )
                })}
              </div>
            </G>
          </div>

          {/* ━━ DAILY GOALS + QUICK ACTIONS ━━ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6 animate-fade-in-delay-2">
            {/* Daily Goals */}
            <G dark={dark} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className={`text-[11px] font-bold uppercase tracking-[0.15em] ${sub}`}>Daily Goals</p>
                  <p className={`text-sm font-bold mt-0.5 ${txt}`}>{completed}/{goals.length} complete</p>
                </div>
                <Ring pct={Math.round((completed/goals.length)*100)} size={44} stroke={4} color="#10b981" bg="rgba(16,185,129,0.1)">
                  <span className="text-[10px] font-black text-emerald-500">{Math.round((completed/goals.length)*100)}%</span>
                </Ring>
              </div>
              <div className="space-y-1.5">
                {goals.map(g => (
                  <button key={g.id} onClick={() => setGoals(prev => prev.map(x => x.id === g.id ? { ...x, done: !x.done } : x))}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
                      dark ? 'hover:bg-white/5' : 'hover:bg-indigo-50/50'
                    }`}>
                    {g.done
                      ? <CheckCircleSolid className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      : <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${dark ? 'border-white/20' : 'border-slate-300'}`} />}
                    <span className={`text-xs font-medium ${g.done ? 'line-through text-slate-400' : dark ? 'text-neutral-200' : 'text-slate-700'}`}>{g.text}</span>
                  </button>
                ))}
              </div>
            </G>

            {/* Quick Actions */}
            <G dark={dark} className="p-5 lg:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <BoltIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`font-bold text-sm ${txt}`}>Quick Actions</h2>
                  <p className={`text-[11px] ${sub}`}>Common tasks at a glance</p>
                </div>
                <span className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full ${dark ? 'bg-white/5 text-white/40' : 'bg-indigo-50 text-indigo-500'}`}>
                  {actions.length} actions
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {actions.map((a, i) => (
                  <Link key={a.t} href={a.href}
                    className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden ${
                      dark ? 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]' : 'bg-white/50 border-indigo-100/40 hover:border-indigo-200'
                    }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br ${a.grad} transition-transform duration-300 group-hover:scale-110 flex-shrink-0`}>
                      <a.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-xs ${txt}`}>{a.t}</p>
                      <p className={`text-[11px] truncate ${sub}`}>{a.d}</p>
                    </div>
                    <ArrowRightIcon className={`w-3.5 h-3.5 flex-shrink-0 transition-all group-hover:translate-x-0.5 ${dark ? 'text-white/20 group-hover:text-white/50' : 'text-slate-300 group-hover:text-indigo-500'}`} />
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
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
                  <ArrowTrendingUpIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className={`font-bold text-sm ${txt}`}>Explore More</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Cog6ToothIcon, label: 'Settings', s: 'Account preferences', href: getHRPortalPath('settings') },
                  { icon: UsersIcon, label: 'Team', s: 'Manage your team', href: getHRPortalPath('team') },
                  { icon: DocumentTextIcon, label: 'Documents', s: 'HR resources', href: getHRPortalPath('documents') },
                ].map(item => (
                  <Link key={item.label} href={item.href}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group ${
                      dark ? 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]' : 'bg-white/50 border-indigo-100/40 hover:border-indigo-200'
                    }`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${dark ? 'bg-white/10' : 'bg-indigo-50'}`}>
                      <item.icon className={`w-5 h-5 ${dark ? 'text-white/60' : 'text-indigo-500'}`} />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${txt}`}>{item.label}</p>
                      <p className={`text-xs ${sub}`}>{item.s}</p>
                    </div>
                    <ArrowRightIcon className={`w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform ${sub}`} />
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
