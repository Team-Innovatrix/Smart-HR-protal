/**
 * RiskCalendar.tsx
 * 
 * Component : RiskCalendar  (Admin  Predictive AI Studio  Annual Risk Calendar tab)
 * Purpose   : Renders a full 12-month visual calendar where each day is
 *             colour-coded by its leave/bridge-leave risk score.
 *
 * Colour key:
 *    Red     High risk  (score  70)   holiday near weekend or holiday cluster
 *    Amber   Medium risk (2569)       bridge-leave day or adjacent holiday
 *    Green   Holiday, Low risk
 *    Slate   Weekend (not a holiday)
 *    Indigo  Today
 *   White dot  Public holiday marker overlaid on any cell
 *
 * Exports:
 *   - HolidayEntry          (interface)    shape of an Indian public holiday
 *   - DayRisk               (interface)    computed risk data for a single date
 *   - calcDayRisk()                        pure function: date + holidays  DayRisk
 *   - buildYearRiskMap()                   pre-computes all 365 days for a year
 *   - RiskCalendar          (default)      the 12-month grid component
 *
 * Used by:
 *   src/app/portal/admin/predictive/page.tsx  (Annual Risk Calendar tab)
 *   src/components/admin/DateSearch.tsx       (imports calcDayRisk)
 * 
 */
'use client';

import { useState, useMemo } from 'react';

export interface HolidayEntry {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'gazetted' | 'restricted' | 'regional';
}

export interface DayRisk {
  dateStr: string;       // YYYY-MM-DD
  riskScore: number;     // 0100
  riskLevel: 'low' | 'medium' | 'high' | 'weekend' | 'holiday';
  isHoliday: boolean;
  holidayName?: string;
  holidayType?: string;
  isWeekend: boolean;
  reason: string;
}

/*  helpers  */
function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseYMD(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function diffDays(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / 86400000);
}

export function calcDayRisk(dateStr: string, allHolidays: HolidayEntry[]): DayRisk {
  const d = parseYMD(dateStr);
  const dow = d.getDay();
  const isWeekend = dow === 0 || dow === 6;
  const holiday = allHolidays.find(h => h.date === dateStr);
  const isHoliday = !!holiday;

  if (isWeekend && !isHoliday) {
    return { dateStr, riskScore: 0, riskLevel: 'weekend', isHoliday: false, isWeekend: true, reason: 'Weekend' };
  }

  if (!isHoliday) {
    // Check if it's a potential bridge day (day before/after a holiday)
    const nearby = allHolidays.find(h => {
      const hd = parseYMD(h.date);
      return Math.abs(diffDays(d, hd)) === 1;
    });
    const nearbyTwo = allHolidays.filter(h => {
      const hd = parseYMD(h.date);
      return Math.abs(diffDays(d, hd)) <= 3 && Math.abs(diffDays(d, hd)) > 0;
    });

    let score = 0;
    let reason = 'Normal working day';
    if (nearby && (dow === 1 || dow === 5)) { score = 55; reason = 'Likely bridge leave day (adjacent to holiday + weekend)'; }
    else if (nearbyTwo.length >= 2) { score = 35; reason = 'Near holiday cluster  some unplanned leaves expected'; }
    else if (nearby) { score = 25; reason = 'Adjacent to a holiday  minor leave risk'; }

    const level = score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';
    return { dateStr, riskScore: score, riskLevel: level, isHoliday: false, isWeekend, reason };
  }

  // It IS a holiday
  let score = 40;
  let reason = 'Public holiday  standard absence expected.';

  if (dow === 1) { score += 30; reason = 'Monday holiday  bridge leaves likely on Friday.'; }
  else if (dow === 5) { score += 30; reason = 'Friday holiday  bridge leaves likely on Monday.'; }
  else if (dow === 2) { score += 15; reason = 'Tuesday holiday  some may take Monday off.'; }
  else if (dow === 4) { score += 15; reason = 'Thursday holiday  some may take Friday off.'; }
  else if (dow === 3) { score += 5; reason = 'Mid-week holiday  minimal bridge-leave risk.'; }

  const nearby = allHolidays.filter(h => {
    const hd = parseYMD(h.date);
    const diff = Math.abs(diffDays(d, hd));
    return diff > 0 && diff <= 5;
  });
  if (nearby.length >= 2) { score += 25; reason += ' Multiple holidays cluster.'; }
  else if (nearby.length === 1) { score += 12; reason += ' Adjacent holiday nearby.'; }

  score = Math.min(100, score);
  const riskLevel = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

  return {
    dateStr, riskScore: score, riskLevel,
    isHoliday: true, holidayName: holiday?.name, holidayType: holiday?.type,
    isWeekend, reason,
  };
}

/*  build full-year risk map  */
export function buildYearRiskMap(year: number, holidays: HolidayEntry[]): Map<string, DayRisk> {
  const map = new Map<string, DayRisk>();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const s = toYMD(new Date(d));
    map.set(s, calcDayRisk(s, holidays));
  }
  return map;
}

/*  colour helpers  */
function cellBg(r: DayRisk, isToday: boolean) {
  if (isToday) return 'bg-indigo-500 text-white font-bold ring-2 ring-indigo-300';
  if (r.isWeekend && !r.isHoliday) return 'bg-slate-800/40 text-slate-500';
  if (r.riskLevel === 'high') return 'bg-red-500/90 text-white';
  if (r.riskLevel === 'medium') return 'bg-amber-400/90 text-slate-900';
  if (r.isHoliday && r.riskLevel === 'low') return 'bg-emerald-500/80 text-white';
  if (r.riskScore >= 25) return 'bg-amber-400/50 text-slate-800';
  return 'text-slate-300 hover:bg-slate-700/40';
}

/*  Month grid  */
function MonthGrid({ year, month, riskMap, onDayClick, today }: {
  year: number; month: number;
  riskMap: Map<string, DayRisk>;
  onDayClick: (d: DayRisk) => void;
  today: string;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'short' });
  const cells: (DayRisk | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const s = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push(riskMap.get(s) ?? null);
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-700/50 p-3">
      <p className="text-center text-xs font-bold text-slate-300 mb-2 uppercase tracking-widest">{monthName}</p>
      <div className="grid grid-cols-7 gap-px">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-center text-[9px] font-semibold text-slate-500 pb-1">{d}</div>
        ))}
        {cells.map((r, i) => {
          if (!r) return <div key={i} />;
          const isToday = r.dateStr === today;
          return (
            <button
              key={i}
              onClick={() => onDayClick(r)}
              title={r.holidayName ?? r.reason}
              className={`relative aspect-square rounded-sm text-[10px] font-medium flex items-center justify-center transition-all hover:scale-110 hover:z-10 cursor-pointer ${cellBg(r, isToday)}`}
            >
              {parseInt(r.dateStr.split('-')[2])}
              {r.isHoliday && (
                <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/*  Main Export  */
interface RiskCalendarProps {
  holidays: HolidayEntry[];
  year: number;
}

export default function RiskCalendar({ holidays, year }: RiskCalendarProps) {
  const [selected, setSelected] = useState<DayRisk | null>(null);
  const todayStr = toYMD(new Date());
  const riskMap = useMemo(() => buildYearRiskMap(year, holidays), [year, holidays]);

  const highCount = [...riskMap.values()].filter(r => r.riskLevel === 'high').length;
  const medCount  = [...riskMap.values()].filter(r => r.riskLevel === 'medium').length;
  const holCount  = holidays.filter(h => h.date.startsWith(String(year))).length;

  return (
    <div className="space-y-5">
      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: `${holCount} Holidays`, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: `${highCount} High-Risk Days`, color: 'bg-red-500/20 text-red-300 border-red-500/30' },
          { label: `${medCount} Medium-Risk Days`, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
        ].map(p => (
          <span key={p.label} className={`px-3 py-1 rounded-full text-xs font-semibold border ${p.color}`}>{p.label}</span>
        ))}
        <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Click any date for details</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
        {[
          { color: 'bg-red-500', label: 'High Risk (70)' },
          { color: 'bg-amber-400', label: 'Medium Risk (2569)' },
          { color: 'bg-emerald-500', label: 'Holiday (Low Risk)' },
          { color: 'bg-slate-700', label: 'Weekend' },
          { color: 'bg-indigo-500', label: 'Today' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm ${l.color}`} />
            {l.label}
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-600 flex items-end justify-end"><span className="w-1.5 h-1.5 rounded-full bg-white/80" /></span>
          White dot = Holiday
        </div>
      </div>

      {/* 12-month grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, m) => (
          <MonthGrid
            key={m} year={year} month={m}
            riskMap={riskMap} onDayClick={setSelected} today={todayStr}
          />
        ))}
      </div>

      {/* Detail card */}
      {selected && (
        <div className={`rounded-xl p-5 border animate-fade-in ${
          selected.riskLevel === 'high' ? 'bg-red-500/10 border-red-500/30' :
          selected.riskLevel === 'medium' ? 'bg-amber-500/10 border-amber-500/30' :
          selected.isWeekend ? 'bg-slate-800/60 border-slate-600/30' :
          'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {parseYMD(selected.dateStr).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              {selected.isHoliday && (
                <p className="text-sm text-[var(--accent)] font-semibold mt-0.5"> {selected.holidayName} ({selected.holidayType})</p>
              )}
              <p className="text-sm text-[var(--text-secondary)] mt-2">{selected.reason}</p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-black tabular-nums ${
                selected.riskLevel === 'high' ? 'text-red-400' :
                selected.riskLevel === 'medium' ? 'text-amber-400' :
                selected.isWeekend ? 'text-slate-500' : 'text-emerald-400'
              }`}>{selected.isWeekend && !selected.isHoliday ? 'WE' : selected.riskScore}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                {selected.isWeekend && !selected.isHoliday ? 'Weekend' : 'Risk Score'}
              </div>
            </div>
          </div>
          <button onClick={() => setSelected(null)} className="mt-3 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"> Close</button>
        </div>
      )}
    </div>
  );
}
