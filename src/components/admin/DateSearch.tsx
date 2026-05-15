/**
 * DateSearch.tsx
 * 
 * Component : DateSearch  (used inside Annual Risk Calendar tab)
 * Purpose   : Lets HR managers type any date in natural language and instantly
 *             see the risk score for that day  no API call, fully client-side.
 *
 * Supported input formats (parsed by parseNaturalDate()):
 *    Festival names   "Diwali", "Holi", "Christmas", "Eid", etc.
 *    ISO format       "2025-10-20"
 *    Indian format    "20/10/2025" or "20-10-2025"
 *    Natural text     "15 August", "August 15", "26 January 2026"
 *    Relative         "today", "tomorrow", "yesterday"
 *
 * Risk result is computed by calcDayRisk() (imported from RiskCalendar.tsx)
 * and displayed in a colour-coded ResultCard with a risk progress bar.
 *
 * Props:
 *   holidays  HolidayEntry[]   list of Indian public holidays to check against
 *
 * Used by:
 *   src/app/portal/admin/predictive/page.tsx  (Annual Risk Calendar tab)
 * 
 */
'use client';

import { useState, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { calcDayRisk, buildYearRiskMap, HolidayEntry, DayRisk } from './RiskCalendar';

// Festival name  approximate date lookup (updated annually)
const FESTIVAL_MAP: Record<string, string> = {
  'diwali': '2025-10-20',
  'holi': '2025-03-14',
  'eid': '2025-03-31',
  'christmas': '2025-12-25',
  'republic day': '2026-01-26',
  'independence day': '2025-08-15',
  'dussehra': '2025-10-02',
  'janmashtami': '2025-08-16',
  'navratri': '2025-10-02',
  'ganesh chaturthi': '2025-08-27',
  'raksha bandhan': '2025-08-09',
};

function parseNaturalDate(input: string): string | null {
  const trimmed = input.trim().toLowerCase();

  // 1. Festival map
  for (const [name, date] of Object.entries(FESTIVAL_MAP)) {
    if (trimmed.includes(name)) return date;
  }

  // 2. ISO format YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return trimmed;

  // 3. DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }

  // 4. "15 August", "August 15", "15 August 2025"
  const months: Record<string, string> = {
    jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
    jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
    january:'01',february:'02',march:'03',april:'04',june:'06',
    july:'07',august:'08',september:'09',october:'10',november:'11',december:'12',
  };
  const textMatch = trimmed.match(/(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/) ||
                    trimmed.match(/([a-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?/);
  if (textMatch) {
    let day: string, monStr: string, yr: string;
    if (/^\d/.test(textMatch[1])) {
      [, day, monStr, yr] = textMatch;
    } else {
      [, monStr, day, yr] = textMatch;
    }
    const monNum = months[monStr?.toLowerCase()];
    if (monNum) {
      const year = yr ?? new Date().getFullYear().toString();
      return `${year}-${monNum}-${day.padStart(2,'0')}`;
    }
  }

  // 5. Relative: "today", "tomorrow"
  const now = new Date();
  if (trimmed === 'today') return toYMD(now);
  if (trimmed === 'tomorrow') { now.setDate(now.getDate()+1); return toYMD(now); }
  if (trimmed === 'yesterday') { now.setDate(now.getDate()-1); return toYMD(now); }

  return null;
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function parseYMD(s: string) {
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y, m-1, d);
}

/*  Result Card  */
function ResultCard({ risk, onClose }: { risk: DayRisk; onClose: () => void }) {
  const colors = {
    high:    { bg: 'bg-red-950/40',     border: 'border-red-500/40',     score: 'text-red-400',     badge: 'bg-red-500/20 text-red-300' },
    medium:  { bg: 'bg-amber-950/30',   border: 'border-amber-500/40',   score: 'text-amber-400',   badge: 'bg-amber-500/20 text-amber-300' },
    low:     { bg: 'bg-emerald-950/30', border: 'border-emerald-500/40', score: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
    weekend: { bg: 'bg-slate-800/60',   border: 'border-slate-600/40',   score: 'text-slate-400',   badge: 'bg-slate-700/40 text-slate-400' },
    holiday: { bg: 'bg-emerald-950/30', border: 'border-emerald-500/40', score: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  };
  const c = colors[risk.riskLevel] ?? colors.low;
  const displayDate = parseYMD(risk.dateStr).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const levelLabel = risk.isWeekend && !risk.isHoliday ? 'Weekend' :
    risk.riskLevel === 'high' ? ' High Risk' :
    risk.riskLevel === 'medium' ? ' Medium Risk' : ' Low Risk';

  return (
    <div className={`rounded-2xl border p-5 animate-fade-in ${c.bg} ${c.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <CalendarDaysIcon className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-base font-bold text-[var(--text-primary)]">{displayDate}</span>
          </div>
          {risk.isHoliday && (
            <p className="text-sm font-semibold text-[var(--accent)] mb-2">
               {risk.holidayName} <span className="text-xs font-normal text-[var(--text-muted)] capitalize">({risk.holidayType})</span>
            </p>
          )}
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${c.badge}`}>{levelLabel}</span>
          <p className="text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">{risk.reason}</p>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-5xl font-black tabular-nums ${c.score}`}>
            {risk.isWeekend && !risk.isHoliday ? '' : risk.riskScore}
          </div>
          <div className="text-xs text-[var(--text-muted)]">/ 100</div>
        </div>
      </div>

      {/* Risk bar */}
      {!risk.isWeekend && (
        <div className="mt-4">
          <div className="h-2 rounded-full bg-slate-700/60 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${risk.riskScore}%`,
                background: risk.riskLevel === 'high' ? '#ef4444' :
                            risk.riskLevel === 'medium' ? '#f59e0b' : '#10b981',
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
            <span>Safe</span><span>Risk Score: {risk.riskScore}%</span><span>Critical</span>
          </div>
        </div>
      )}

      <button onClick={onClose} className="mt-3 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1">
        <XMarkIcon className="w-3 h-3" /> Clear result
      </button>
    </div>
  );
}

/*  Main Export  */
interface DateSearchProps {
  holidays: HolidayEntry[];
}

export default function DateSearch({ holidays }: DateSearchProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<DayRisk | null>(null);
  const [error, setError]   = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSearch() {
    const parsed = parseNaturalDate(query);
    if (!parsed) {
      setError('Could not parse date. Try "15 August", "2025-10-02", "Diwali", or "tomorrow".');
      setResult(null);
      return;
    }
    setError('');
    const risk = calcDayRisk(parsed, holidays);
    setResult(risk);
  }

  function handleClear() {
    setQuery('');
    setResult(null);
    setError('');
    inputRef.current?.focus();
  }

  const suggestions = ['Today', 'Diwali', '15 August', '26 January 2026', 'Christmas'];

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder='Try "Diwali", "15 August", "2025-10-02", "tomorrow"'
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition"
          />
          {query && (
            <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          className="px-5 py-3 rounded-xl font-semibold text-sm transition-all"
          style={{ background: 'var(--accent)', color: '#0f172a' }}
        >
          Check Risk
        </button>
      </div>

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-[var(--text-muted)]">Quick:</span>
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => { setQuery(s); setError(''); }}
            className="text-xs px-2.5 py-1 rounded-full border border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>
      )}

      {/* Result */}
      {result && <ResultCard risk={result} onClose={handleClear} />}
    </div>
  );
}
