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
function StatCard({ label, value, icon, delay, sub }: {
  label: string; value: number; icon: string; delay: number; sub: string;
}) {
  const count = useCountUp(value, 900, delay);
  const pct = Math.min(value * 12, 100);
  const r = 20; const circ = 2 * Math.PI * r;

  return (
    <div className="card group relative p-6">
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mac-text-secondary)] mb-1.5">{label}</p>
          <p className="text-4xl font-bold text-[var(--mac-text-primary)] tabular-nums tracking-tight">{count}</p>
          <p className="text-[11px] text-[var(--mac-text-secondary)] mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--mac-success)' }} />
            {sub}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-[var(--mac-bg)] border border-[var(--mac-border)]">
            {icon}
          </div>
          <svg width={48} height={48} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={24} cy={24} r={r} fill="none" stroke="var(--mac-border)" strokeWidth={3} />
            <circle cx={24} cy={24} r={r} fill="none" stroke="var(--mac-accent)" strokeWidth={3}
              strokeDasharray={`${circ * pct / 100} ${circ}`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.16,1,0.3,1)' }} />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ── Quick Action Card ────────────────────────────────────────────── */
function ActionCard({ href, icon, label, description, badgeText }: {
  href: string; icon: string; label: string; description: string; badgeText?: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-3 p-4 rounded-xl border border-[var(--mac-border)] transition-colors duration-150 hover:bg-[var(--mac-border)] bg-[var(--mac-window-bg)]">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 bg-[var(--mac-accent)] text-white">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[13px] text-[var(--mac-text-primary)]">{label}</p>
          {badgeText && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--mac-border-strong)] text-[var(--mac-text-primary)]">{badgeText}</span>
          )}
        </div>
        <p className="text-[11px] text-[var(--mac-text-secondary)] mt-0.5 truncate">{description}</p>
      </div>
      <svg className="w-4 h-4 text-[var(--mac-text-secondary)] group-hover:text-[var(--mac-text-primary)] transition-all duration-200 group-hover:translate-x-0.5 flex-shrink-0"
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

/* ── Department Row ───────────────────────────────────────────────── */
function DeptRow({ name, count, max }: { name: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 group">
      <div className="w-2 h-2 rounded-full bg-[var(--mac-accent)] flex-shrink-0" />
      <span className="text-[13px] text-[var(--mac-text-primary)] font-medium w-36 truncate">{name}</span>
      <div className="flex-1 h-2 rounded-sm bg-[var(--mac-border)] overflow-hidden">
        <div className="h-2 rounded-sm bg-[var(--mac-accent)] transition-all duration-1000"
          style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-medium text-[var(--mac-text-secondary)] w-14 text-right tabular-nums">{count} {count === 1 ? 'emp' : 'emps'}</span>
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
      <div className="text-center text-[var(--mac-text-secondary)]">
        <div className="relative w-10 h-10 mx-auto mb-4 animate-spin">
           <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
           </svg>
        </div>
        <p className="font-medium text-[13px]">Loading command centre…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="card p-8 max-w-md text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-[var(--mac-danger)] font-bold mb-2">Failed to load dashboard</h3>
        <p className="text-[var(--mac-text-secondary)] text-[13px] mb-4">{error}</p>
        <button onClick={fetchData} className="btn-primary">
          Retry
        </button>
      </div>
    </div>
  );

  if (!data) return null;

  const { overview, departmentStats, recentLeaves } = data;
  const maxDept = Math.max(...departmentStats.map(d => d.count), 1);

  const stats = [
    { label: 'Employees', value: overview.totalUsers, icon: '👥', delay: 0, sub: 'Active headcount' },
    { label: 'Pending Leaves', value: overview.pendingLeaves, icon: '📅', delay: 120, sub: 'Awaiting review' },
    { label: "Today's Attendance", value: overview.todayAttendance, icon: '✅', delay: 240, sub: 'Clocked in today' },
    { label: 'Active Teams', value: overview.totalTeams, icon: '🏢', delay: 360, sub: 'Teams configured' },
  ];

  const quickActions = [
    { href: '/portal/admin/users', icon: '👤', label: 'Manage Employees', description: 'Add, edit, and manage your team', badgeText: `${overview.totalUsers} total` },
    { href: '/portal/admin/leaves', icon: '📋', label: 'Leave Requests', description: 'Review and approve leave applications', badgeText: overview.pendingLeaves > 0 ? `${overview.pendingLeaves} pending` : undefined },
    { href: '/portal/admin/attendance', icon: '🕐', label: 'Attendance Log', description: 'Track daily attendance records' },
    { href: '/portal/admin/teams', icon: '🏢', label: 'Team Management', description: 'Organise departments and teams' },
    { href: '/portal/admin/analytics', icon: '📊', label: 'Analytics & Reports', description: 'Performance insights and trends' },
    { href: '/portal/admin/predictive', icon: '🤖', label: 'AI Predictions', description: 'ML-powered workforce forecasting', badgeText: 'BETA' },
    { href: '/portal/admin/risk', icon: '🛡️', label: 'Risk Intelligence', description: 'Attrition and compliance monitoring' },
    { href: '/portal/admin/settings', icon: '⚙️', label: 'Settings', description: 'System configuration and preferences' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── HERO BANNER ───────────────────────────────────────── */}
      <div className="page-hero">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="w-2 h-2 rounded-full bg-[var(--mac-success)]" />
               <span className="text-[var(--mac-text-secondary)] text-[11px] font-semibold tracking-wide uppercase">System Active</span>
               <span className="text-[var(--mac-text-secondary)] text-[11px]">·</span>
               <span className="text-[var(--mac-text-secondary)] text-[11px]">{greeting}</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-[var(--mac-text-primary)] tracking-tight mb-1">
              {data.adminUser.name.split(' ')[0]}!
            </h1>
            <p className="text-[var(--mac-text-secondary)] text-[13px]">
              {dateStr}
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="badge badge-gray">
                👑 Chief Executive Officer
              </span>
              <span className="badge badge-gray">
                🛡️ Administrator
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2">
            <div className="text-right">
              <div className="text-3xl font-bold text-[var(--mac-text-primary)] tabular-nums tracking-tight">
                {timeStr.split(' ')[0]}
                <span className="text-[13px] text-[var(--mac-text-secondary)] ml-1">{timeStr.split(' ')[1]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* ── QUICK ACTIONS ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-4 mt-6">
          <div className="w-8 h-8 rounded-lg bg-[var(--mac-accent)] text-white flex items-center justify-center text-sm">⚡</div>
          <h2 className="text-lg font-bold text-[var(--mac-text-primary)]">Command Centre</h2>
          <span className="ml-auto text-[11px] font-medium text-[var(--mac-text-secondary)] bg-[var(--mac-border)] px-2 py-0.5 rounded-md">{quickActions.length} modules</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(a => <ActionCard key={a.label} {...a} />)}
        </div>
      </div>

      {/* ── DEPARTMENTS + RECENT LEAVES ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Department Distribution */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-[var(--mac-accent)] text-white flex items-center justify-center text-sm">🏛️</div>
            <div>
              <h3 className="font-bold text-[13px] text-[var(--mac-text-primary)]">Department Distribution</h3>
              <p className="text-[11px] text-[var(--mac-text-secondary)]">Employees per department</p>
            </div>
            <span className="ml-auto px-2 py-0.5 rounded-md bg-[var(--mac-border)] text-[var(--mac-text-secondary)] text-[11px] font-medium">{departmentStats.length} depts</span>
          </div>
          {departmentStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-[var(--mac-text-secondary)] font-medium text-[13px]">No departments populated yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {departmentStats.map(d => <DeptRow key={d._id} name={d._id} count={d.count} max={maxDept} />)}
            </div>
          )}
        </div>

        {/* Recent Leaves */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-[var(--mac-accent)] text-white flex items-center justify-center text-sm">📋</div>
            <div>
              <h3 className="font-bold text-[13px] text-[var(--mac-text-primary)]">Recent Leave Requests</h3>
              <p className="text-[11px] text-[var(--mac-text-secondary)]">Latest applications</p>
            </div>
            <Link href="/portal/admin/leaves" className="ml-auto text-[11px] font-medium text-[var(--mac-accent)] hover:underline flex items-center gap-1 transition-colors">
              View all →
            </Link>
          </div>
          {recentLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-[var(--mac-text-secondary)] font-medium text-[13px]">No leave requests yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentLeaves.map((leave) => (
                <div key={leave._id as string}
                  className="flex items-center justify-between p-3 bg-[var(--mac-bg)] rounded-lg border border-[var(--mac-border)]">
                  <div>
                    <p className="text-[13px] font-medium text-[var(--mac-text-primary)]">
                      {(leave.userId as Record<string, unknown>)?.firstName as string} {(leave.userId as Record<string, unknown>)?.lastName as string}
                    </p>
                    <p className="text-[11px] text-[var(--mac-text-secondary)]">{(leave.userId as Record<string, unknown>)?.department as string}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md
                    ${leave.status === 'pending' ? 'bg-[#ffcc0020] text-[#d4a000]' :
                      leave.status === 'approved' ? 'bg-[#34c75920] text-[#34c759]' :
                      'bg-[#ff3b3020] text-[#ff3b30]'}`}>
                    {leave.status as string}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
