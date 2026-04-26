'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    pendingLeaves: number;
    todayAttendance: number;
    totalTeams: number;
  };
  departmentStats: Array<{ _id: string; count: number }>;
  recentLeaves: Array<Record<string, unknown>>;
  todayAttendanceStats: Array<{ _id: string; count: number }>;
  adminUser: {
    name: string;
    employeeId: string;
    department: string;
    permissions: string[];
  };
}

/* ── Animated counter ─────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1000, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let start: number | null = null;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [target, duration, delay]);
  return val;
}

/* ── Stat Card ────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, gradient, accentColor, delay, sub }: {
  label: string; value: number; icon: string; gradient: string;
  accentColor: string; delay: number; sub: string;
}) {
  const count = useCountUp(value, 900, delay);
  const pct = Math.min(value * 12, 100);
  const r = 20; const circ = 2 * Math.PI * r;

  return (
    <div className="group relative rounded-2xl p-6 overflow-hidden border transition-all duration-500
                     hover:-translate-y-2 hover:shadow-2xl cursor-default"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(99,102,241,0.08)',
      }}>
      {/* Gradient top accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${gradient}`} />
      {/* Hover glow */}
      <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-0 group-hover:opacity-40
                        transition-opacity duration-700 ${gradient.replace('bg-gradient-to-r', 'bg-gradient-to-br')}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5">{label}</p>
          <p className="text-4xl font-black text-slate-900 tabular-nums tracking-tight">{count}</p>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
            {sub}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${gradient}`}>
            {icon}
          </div>
          <svg width={48} height={48} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={24} cy={24} r={r} fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth={3.5} />
            <circle cx={24} cy={24} r={r} fill="none" stroke={accentColor} strokeWidth={3.5}
              strokeDasharray={`${circ * pct / 100} ${circ}`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.16,1,0.3,1)' }} />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ── Quick Action Card ────────────────────────────────────────────── */
function ActionCard({ href, icon, label, description, gradient, badgeText }: {
  href: string; icon: string; label: string; description: string; gradient: string; badgeText?: string;
}) {
  return (
    <Link href={href}
      className="group relative flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300
                 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.65)',
        backdropFilter: 'blur(16px)',
        borderColor: 'rgba(99,102,241,0.08)',
      }}>
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 ${gradient}`} />
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${gradient}`} />
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0
                        transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${gradient}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm text-slate-800">{label}</p>
          {badgeText && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${gradient}`}>{badgeText}</span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{description}</p>
      </div>
      <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-all duration-200 group-hover:translate-x-0.5 flex-shrink-0"
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

/* ── Department Row ───────────────────────────────────────────────── */
const DEPT_COLORS: Record<string, string> = {
  Executive: 'bg-gradient-to-r from-violet-500 to-purple-600',
  Engineering: 'bg-gradient-to-r from-indigo-500 to-blue-600',
  Product: 'bg-gradient-to-r from-fuchsia-500 to-pink-500',
  Design: 'bg-gradient-to-r from-rose-400 to-pink-500',
  Marketing: 'bg-gradient-to-r from-teal-400 to-emerald-500',
  Sales: 'bg-gradient-to-r from-cyan-400 to-sky-500',
  Finance: 'bg-gradient-to-r from-amber-400 to-orange-500',
  Operations: 'bg-gradient-to-r from-slate-400 to-slate-600',
  'Human Resources': 'bg-gradient-to-r from-rose-500 to-red-500',
};

function DeptRow({ name, count, max }: { name: string; count: number; max: number }) {
  const grad = DEPT_COLORS[name] || 'bg-gradient-to-r from-slate-400 to-slate-500';
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 group">
      <div className={`w-2.5 h-2.5 rounded-full ${grad} flex-shrink-0 transition-transform duration-200 group-hover:scale-125`} />
      <span className="text-sm text-slate-600 font-medium w-36 truncate">{name}</span>
      <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-2.5 rounded-full ${grad} transition-all duration-1000`}
          style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-500 w-14 text-right tabular-nums">{count} {count === 1 ? 'emp' : 'emps'}</span>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const json = await res.json();
      if (json.success) setData(json.data);
      else throw new Error(json.error || 'Failed to fetch');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
        </div>
        <p className="text-indigo-600 font-bold">Loading command centre…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="rounded-2xl p-8 max-w-md text-center border"
        style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(16px)', borderColor: 'rgba(239,68,68,0.2)' }}>
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-red-700 font-bold mb-2">Failed to load dashboard</h3>
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button onClick={fetchData}
          className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold hover:shadow-lg transition-all">
          Retry
        </button>
      </div>
    </div>
  );

  if (!data) return null;

  const { overview, departmentStats, recentLeaves } = data;
  const maxDept = Math.max(...departmentStats.map(d => d.count), 1);

  const stats = [
    { label: 'Total Employees', value: overview.totalUsers, icon: '👥', gradient: 'bg-gradient-to-r from-indigo-500 to-violet-600', accentColor: '#6366f1', delay: 0, sub: 'Active headcount' },
    { label: 'Pending Leaves', value: overview.pendingLeaves, icon: '📅', gradient: 'bg-gradient-to-r from-fuchsia-500 to-pink-500', accentColor: '#d946ef', delay: 120, sub: 'Awaiting review' },
    { label: "Today's Attendance", value: overview.todayAttendance, icon: '✅', gradient: 'bg-gradient-to-r from-teal-400 to-emerald-500', accentColor: '#14b8a6', delay: 240, sub: 'Clocked in today' },
    { label: 'Active Teams', value: overview.totalTeams, icon: '🏢', gradient: 'bg-gradient-to-r from-cyan-400 to-blue-500', accentColor: '#06b6d4', delay: 360, sub: 'Teams configured' },
  ];

  const quickActions = [
    { href: '/portal/admin/users', icon: '👤', label: 'Manage Employees', description: 'Add, edit, and manage your team', gradient: 'bg-gradient-to-r from-indigo-500 to-violet-600', badgeText: `${overview.totalUsers} total` },
    { href: '/portal/admin/leaves', icon: '📋', label: 'Leave Requests', description: 'Review and approve leave applications', gradient: 'bg-gradient-to-r from-fuchsia-500 to-pink-500', badgeText: overview.pendingLeaves > 0 ? `${overview.pendingLeaves} pending` : undefined },
    { href: '/portal/admin/attendance', icon: '🕐', label: 'Attendance Log', description: 'Track daily attendance records', gradient: 'bg-gradient-to-r from-teal-400 to-emerald-500' },
    { href: '/portal/admin/teams', icon: '🏢', label: 'Team Management', description: 'Organise departments and teams', gradient: 'bg-gradient-to-r from-cyan-400 to-blue-500' },
    { href: '/portal/admin/analytics', icon: '📊', label: 'Analytics & Reports', description: 'Performance insights and trends', gradient: 'bg-gradient-to-r from-rose-400 to-pink-500' },
    { href: '/portal/admin/predictive', icon: '🤖', label: 'AI Predictions', description: 'ML-powered workforce forecasting', gradient: 'bg-gradient-to-r from-amber-400 to-orange-500', badgeText: 'BETA' },
    { href: '/portal/admin/risk', icon: '🛡️', label: 'Risk Intelligence', description: 'Attrition and compliance monitoring', gradient: 'bg-gradient-to-r from-red-400 to-rose-500' },
    { href: '/portal/admin/settings', icon: '⚙️', label: 'Settings', description: 'System configuration and preferences', gradient: 'bg-gradient-to-r from-slate-400 to-slate-600' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── HERO BANNER ───────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #312e81 0%, #4338ca 20%, #6366f1 45%, #818cf8 70%, #a5b4fc 100%)',
        }}>
        {/* Mesh gradient overlays */}
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 80% 20%, rgba(45,212,191,0.25) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(244,63,94,0.15) 0%, transparent 50%)',
          }} />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        {/* Floating orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle, #2dd4bf, transparent)', transform: 'translate(25%,-25%)' }} />
        <div className="absolute bottom-0 left-0 w-52 h-52 rounded-full blur-3xl opacity-15 animate-float"
          style={{ background: 'radial-gradient(circle, #f43f5e, transparent)', transform: 'translate(-25%,25%)', animationDelay: '2s' }} />

        <div className="relative z-10 p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              {/* Brand pill */}
              <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-4">
                <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center text-sm">⚡</div>
                <span className="text-white/90 text-xs font-semibold tracking-wide">Innovatrix Smart Dashboard</span>
                <span className="flex items-center gap-1 text-teal-300 text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  Live
                </span>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/60 text-sm">✨ {greeting}</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-2">
                {data.adminUser.name.split(' ')[0]}! 🚀
              </h1>
              <p className="text-indigo-200/80 text-sm">
                {dateStr} · Command Centre
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 bg-teal-400/20 border border-teal-400/30 text-teal-200 text-xs font-bold px-3 py-1 rounded-full">
                  👑 Chief Executive Officer
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/80 text-xs font-bold px-3 py-1 rounded-full">
                  🛡️ Administrator
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start lg:items-end gap-4">
              <div className="text-right">
                <div className="text-5xl font-black text-white tabular-nums tracking-tight">{timeStr.split(' ')[0]}</div>
                <div className="text-indigo-200 text-sm font-medium">{timeStr.split(' ')[1]}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
                <div className="text-3xl font-black text-white">Day 1</div>
                <div className="text-indigo-200 text-xs font-semibold mt-0.5">of Innovatrix 🎉</div>
              </div>
            </div>
          </div>

          {/* Mini stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {[
              { label: 'Employees', value: overview.totalUsers, icon: '👥' },
              { label: 'Teams', value: overview.totalTeams, icon: '🏢' },
              { label: 'Leaves Pending', value: overview.pendingLeaves, icon: '📅' },
              { label: 'Present Today', value: overview.todayAttendance, icon: '✅' },
            ].map(s => (
              <div key={s.label}
                className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3 hover:bg-white/20 transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">{s.icon}</span>
                </div>
                <div className="text-2xl font-black text-white tabular-nums">{s.value}</div>
                <div className="text-indigo-200/70 text-[10px] font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── QUICK ACTIONS ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md text-base">⚡</div>
          <h2 className="text-lg font-black text-slate-800">Command Centre</h2>
          <span className="ml-auto text-xs font-semibold text-slate-400">{quickActions.length} modules</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(a => <ActionCard key={a.label} {...a} />)}
        </div>
      </div>

      {/* ── DEPARTMENTS + RECENT LEAVES ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="rounded-2xl border p-6"
          style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', borderColor: 'rgba(99,102,241,0.08)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-base shadow-md">🏛️</div>
            <div>
              <h3 className="font-black text-sm text-slate-800">Department Distribution</h3>
              <p className="text-xs text-slate-400">Employees per department</p>
            </div>
            <span className="ml-auto px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-500 text-xs font-semibold">{departmentStats.length} depts</span>
          </div>
          {departmentStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="text-4xl mb-3">🏗️</div>
              <p className="text-slate-500 font-semibold text-sm">No departments populated yet</p>
              <p className="text-slate-400 text-xs mt-1">Add employees to see distribution</p>
            </div>
          ) : (
            <div className="space-y-3">
              {departmentStats.map(d => <DeptRow key={d._id} name={d._id} count={d.count} max={maxDept} />)}
            </div>
          )}
        </div>

        {/* Recent Leaves */}
        <div className="rounded-2xl border p-6"
          style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', borderColor: 'rgba(99,102,241,0.08)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center text-base shadow-md">📋</div>
            <div>
              <h3 className="font-black text-sm text-slate-800">Recent Leave Requests</h3>
              <p className="text-xs text-slate-400">Latest applications</p>
            </div>
            <Link href="/portal/admin/leaves" className="ml-auto text-xs font-semibold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
              View all →
            </Link>
          </div>
          {recentLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="text-4xl mb-3">🌅</div>
              <p className="text-slate-500 font-semibold text-sm">No leave requests yet</p>
              <p className="text-slate-400 text-xs mt-1">Day 1 — the board is clean!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLeaves.map((leave) => (
                <div key={leave._id as string}
                  className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl hover:bg-indigo-50/50 transition-all duration-200 border border-transparent hover:border-indigo-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {(leave.userId as Record<string, unknown>)?.firstName as string} {(leave.userId as Record<string, unknown>)?.lastName as string}
                    </p>
                    <p className="text-xs text-slate-500">{(leave.userId as Record<string, unknown>)?.department as string}</p>
                  </div>
                  <span className={`px-3 py-1.5 text-xs font-bold rounded-full
                    ${leave.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      'bg-red-100 text-red-700 border border-red-200'}`}>
                    {leave.status as string}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── WELCOME FOOTER ────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden border shadow-md"
        style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(16px)', borderColor: 'rgba(99,102,241,0.1)' }}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-7">
          <div className="text-5xl flex-shrink-0">🚀</div>
          <div className="flex-1">
            <h3 className="font-black text-xl text-slate-900">Welcome to Innovatrix 🎉</h3>
            <p className="text-slate-500 text-sm mt-0.5">
              Today is Day 1. Your Smart Dashboard is live and ready. Start by adding your first employees, 
              configuring teams, and setting up your HR workflows.
            </p>
          </div>
          <Link href="/portal/admin/users"
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
            Add First Employee →
          </Link>
        </div>
      </div>

    </div>
  );
}
