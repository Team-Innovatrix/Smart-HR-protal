'use client';

import { useState, useEffect, useCallback } from 'react';

/* ── Types ─────────────────────────────────────────────────────────── */
interface Vacancy {
  _id: string;
  title: string;
  department: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
  requirements: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  deadline?: string;
  isActive: boolean;
  createdAt: string;
}

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship'] as const;
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

const emptyForm = {
  title: '', department: '', location: '',
  jobType: 'full-time' as const,
  description: '', requirements: '',
  salaryMin: '', salaryMax: '', salaryCurrency: 'INR', deadline: '',
};

/* ── Vacancy Card ───────────────────────────────────────────────────── */
function VacancyCard({
  v, onToggle, onDelete,
}: { v: Vacancy; onToggle: (id: string, active: boolean) => void; onDelete: (id: string) => void }) {
  const typeColors: Record<string, string> = {
    'full-time': 'bg-[rgba(52,211,153,0.1)] text-[var(--color-success)]',
    'part-time': 'bg-[rgba(96,165,250,0.1)] text-blue-400',
    'contract': 'bg-[rgba(251,191,36,0.1)] text-[var(--color-warning)]',
    'internship': 'bg-[rgba(167,139,250,0.1)] text-purple-400',
  };
  return (
    <div className={`glass p-5 transition-all duration-300 ${!v.isActive ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-[15px] font-bold text-[var(--text-primary)] truncate">{v.title}</h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${typeColors[v.jobType]}`}>
              {v.jobType.replace('-', ' ')}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              v.isActive ? 'bg-[rgba(52,211,153,0.1)] text-[var(--color-success)]' : 'bg-[rgba(255,255,255,0.06)] text-[var(--text-muted)]'
            }`}>
              {v.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-[12px] text-[var(--text-secondary)]">
            {v.department} · {v.location}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onToggle(v._id, !v.isActive)}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 ${
              v.isActive
                ? 'border-[var(--glass-border)] text-[var(--text-muted)] hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]'
                : 'border-[rgba(52,211,153,0.3)] text-[var(--color-success)] hover:bg-[rgba(52,211,153,0.08)]'
            }`}
          >
            {v.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => onDelete(v._id)}
            className="text-[11px] font-medium px-3 py-1.5 rounded-lg border border-[rgba(248,113,113,0.2)] text-[var(--color-danger)] hover:bg-[rgba(248,113,113,0.08)] transition-all duration-200"
          >
            Delete
          </button>
        </div>
      </div>

      <p className="text-[12px] text-[var(--text-secondary)] line-clamp-2 mb-3">{v.description}</p>

      {v.requirements.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {v.requirements.slice(0, 4).map((r, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.04)] border border-[var(--glass-border)] text-[var(--text-muted)]">
              {r}
            </span>
          ))}
          {v.requirements.length > 4 && (
            <span className="text-[10px] px-2 py-0.5 text-[var(--text-muted)]">+{v.requirements.length - 4} more</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)]">
        {(v.salaryMin || v.salaryMax) && (
          <span>💰 {v.salaryMin && `${v.salaryCurrency} ${v.salaryMin.toLocaleString()}`}
            {v.salaryMin && v.salaryMax && ' – '}
            {v.salaryMax && `${v.salaryMax.toLocaleString()}`}
          </span>
        )}
        {v.deadline && <span>📅 Deadline: {new Date(v.deadline).toLocaleDateString('en-IN')}</span>}
        <span className="ml-auto">Posted {new Date(v.createdAt).toLocaleDateString('en-IN')}</span>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────── */
export default function RequirementsPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  /* Fetch */
  const fetchVacancies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vacancies');
      const data = await res.json();
      if (data.success) setVacancies(data.data);
    } catch {
      setError('Failed to load vacancies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVacancies(); }, [fetchVacancies]);

  /* Auto-dismiss flash messages */
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 4000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); }
  }, [error]);

  /* Create */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          requirements: form.requirements.split('\n').map(r => r.trim()).filter(Boolean),
          salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to create');
      setVacancies(prev => [data.data, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
      setSuccess('Vacancy posted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vacancy');
    } finally {
      setSubmitting(false);
    }
  };

  /* Toggle */
  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/vacancies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setVacancies(prev => prev.map(v => v._id === id ? { ...v, isActive } : v));
      setSuccess(`Vacancy ${isActive ? 'activated' : 'deactivated'}`);
    } catch {
      setError('Failed to update vacancy');
    }
  };

  /* Delete */
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vacancy? This cannot be undone.')) return;
    try {
      await fetch(`/api/vacancies/${id}`, { method: 'DELETE' });
      setVacancies(prev => prev.filter(v => v._id !== id));
      setSuccess('Vacancy deleted');
    } catch {
      setError('Failed to delete vacancy');
    }
  };

  const filtered = vacancies.filter(v => {
    if (filter === 'active') return v.isActive;
    if (filter === 'inactive') return !v.isActive;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="page-hero relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.4), transparent)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" style={{ boxShadow: '0 0 8px var(--accent-glow)' }} />
              <span className="text-[var(--text-muted)] text-[11px] font-medium tracking-wider uppercase">Job Postings</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)]">
              Requirements & <span className="text-gradient">Vacancies</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-[13px] mt-1">
              Post open positions and manage active job listings
            </p>
          </div>
          <button
            onClick={() => setShowForm(p => !p)}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-lg">{showForm ? '✕' : '+'}</span>
            {showForm ? 'Cancel' : 'Post Vacancy'}
          </button>
        </div>
      </div>

      {/* ── Flash messages ───────────────────────────────────────── */}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.08)] text-[var(--color-success)] text-[13px] font-medium animate-fade-in">
          <span>✅</span> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] text-[var(--color-danger)] text-[13px] font-medium animate-fade-in">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── Create Form ──────────────────────────────────────────── */}
      {showForm && (
        <div className="glass p-6 animate-fade-in">
          <h2 className="text-[15px] font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{ background: 'var(--accent-muted)', border: '1px solid rgba(52,211,153,0.15)' }}>📋</span>
            New Job Vacancy
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Job Title *</label>
                <input
                  required value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] bg-[rgba(255,255,255,0.04)] border border-[var(--glass-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Department *</label>
                <input
                  required value={form.department}
                  onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  placeholder="e.g. Engineering"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] bg-[rgba(255,255,255,0.04)] border border-[var(--glass-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Location *</label>
                <input
                  required value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Nagpur, Maharashtra"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] bg-[rgba(255,255,255,0.04)] border border-[var(--glass-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Job Type *</label>
                <select
                  required value={form.jobType}
                  onChange={e => setForm(p => ({ ...p, jobType: e.target.value as typeof emptyForm['jobType'] }))}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] bg-[rgba(255,255,255,0.04)] border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                >
                  {JOB_TYPES.map(t => <option key={t} value={t} className="bg-[#1a1a2e]">{t.replace('-', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Currency</label>
                <select
                  value={form.salaryCurrency}
                  onChange={e => setForm(p => ({ ...p, salaryCurrency: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] bg-[rgba(255,255,255,0.04)] border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                >
                  {CURRENCIES.map(c => <option key={c} value={c} className="bg-[#1a1a2e]">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Salary Min</label>
                <input
                  type="number" min="0" value={form.salaryMin}
                  onChange={e => setForm(p => ({ ...p, salaryMin: e.target.value }))}
                  placeholder="e.g. 500000"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] bg-[rgba(255,255,255,0.04)] border border-[var(--glass-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Salary Max</label>
                <input
                  type="number" min="0" value={form.salaryMax}
                  onChange={e => setForm(p => ({ ...p, salaryMax: e.target.value }))}
                  placeholder="e.g. 1200000"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] bg-[rgba(255,255,255,0.04)] border border-[var(--glass-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Description *</label>
              <textarea
                required rows={4} value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe the role, responsibilities, and what makes it exciting..."
                className="w-full px-3 py-2.5 rounded-xl text-[13px] bg-[rgba(255,255,255,0.04)] border border-[var(--glass-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
              />
            </div>

            {/* Requirements + Deadline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Requirements <span className="normal-case font-normal text-[var(--text-muted)]">(one per line)</span>
                </label>
                <textarea
                  rows={4} value={form.requirements}
                  onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))}
                  placeholder={"5+ years of experience\nStrong problem-solving skills\nBachelor's in CS or related field"}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] bg-[rgba(255,255,255,0.04)] border border-[var(--glass-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Application Deadline</label>
                <input
                  type="date" value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] bg-[rgba(255,255,255,0.04)] border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }}
                className="px-4 py-2 text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--glass-border)] rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-t-transparent border-current animate-spin" />Posting...</>
                ) : '📢 Post Vacancy'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filter + Stats ───────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-lg capitalize transition-all duration-200 ${
                filter === f
                  ? 'bg-[var(--accent)] text-[#0a0a1a]'
                  : 'border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--glass-border-hover)]'
              }`}
            >
              {f} {f === 'all' ? `(${vacancies.length})` : f === 'active' ? `(${vacancies.filter(v => v.isActive).length})` : `(${vacancies.filter(v => !v.isActive).length})`}
            </button>
          ))}
        </div>
        <button onClick={fetchVacancies} className="text-[12px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors flex items-center gap-1">
          🔄 Refresh
        </button>
      </div>

      {/* ── Vacancies List ───────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--glass-border)]" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[var(--accent)] animate-spin" />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-[var(--text-secondary)] font-medium">
            {vacancies.length === 0 ? 'No vacancies posted yet' : `No ${filter} vacancies`}
          </p>
          <p className="text-[var(--text-muted)] text-[13px] mt-1">
            {vacancies.length === 0 && 'Click "Post Vacancy" to add your first opening'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(v => (
            <VacancyCard key={v._id} v={v} onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
