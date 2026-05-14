'use client';

import { useState, useMemo } from 'react';
import AdminSubNav from '@/components/admin/AdminSubNav';
import RiskCalendar from '@/components/admin/RiskCalendar';
import DateSearch from '@/components/admin/DateSearch';
import AIPredictionsTab from '@/components/admin/AIPredictionsTab';
import {
  SparklesIcon, CalendarDaysIcon, LightBulbIcon,
  ShieldCheckIcon, CheckCircleIcon, MagnifyingGlassIcon, CalendarIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

/* ── Indian Public Holidays 2025-2026 ── */
const INDIAN_HOLIDAYS = [
  // 2025
  { date: '2025-01-14', name: 'Makar Sankranti / Pongal', type: 'regional' as const },
  { date: '2025-01-26', name: 'Republic Day', type: 'gazetted' as const },
  { date: '2025-03-14', name: 'Holi', type: 'gazetted' as const },
  { date: '2025-03-31', name: 'Eid ul-Fitr', type: 'gazetted' as const },
  { date: '2025-04-06', name: 'Ram Navami', type: 'gazetted' as const },
  { date: '2025-04-10', name: 'Mahavir Jayanti', type: 'gazetted' as const },
  { date: '2025-04-14', name: 'Ambedkar Jayanti', type: 'gazetted' as const },
  { date: '2025-04-18', name: 'Good Friday', type: 'gazetted' as const },
  { date: '2025-05-01', name: 'May Day / Workers Day', type: 'regional' as const },
  { date: '2025-05-12', name: 'Buddha Purnima', type: 'gazetted' as const },
  { date: '2025-06-07', name: 'Eid ul-Adha (Bakrid)', type: 'gazetted' as const },
  { date: '2025-07-06', name: 'Muharram', type: 'gazetted' as const },
  { date: '2025-08-09', name: 'Raksha Bandhan', type: 'regional' as const },
  { date: '2025-08-15', name: 'Independence Day', type: 'gazetted' as const },
  { date: '2025-08-16', name: 'Janmashtami', type: 'gazetted' as const },
  { date: '2025-08-27', name: 'Ganesh Chaturthi', type: 'regional' as const },
  { date: '2025-09-05', name: 'Milad-un-Nabi', type: 'gazetted' as const },
  { date: '2025-10-02', name: 'Gandhi Jayanti / Dussehra', type: 'gazetted' as const },
  { date: '2025-10-20', name: 'Diwali', type: 'gazetted' as const },
  { date: '2025-10-21', name: 'Diwali (Day 2)', type: 'gazetted' as const },
  { date: '2025-11-01', name: 'Kannada Rajyotsava', type: 'regional' as const },
  { date: '2025-11-05', name: 'Guru Nanak Jayanti', type: 'gazetted' as const },
  { date: '2025-12-25', name: 'Christmas', type: 'gazetted' as const },
  // 2026
  { date: '2026-01-26', name: 'Republic Day', type: 'gazetted' as const },
  { date: '2026-03-03', name: 'Holi', type: 'gazetted' as const },
  { date: '2026-03-20', name: 'Eid ul-Fitr', type: 'gazetted' as const },
  { date: '2026-04-03', name: 'Good Friday', type: 'gazetted' as const },
  { date: '2026-04-14', name: 'Ambedkar Jayanti', type: 'gazetted' as const },
  { date: '2026-05-01', name: 'May Day / Workers Day', type: 'regional' as const },
  { date: '2026-05-27', name: 'Eid ul-Adha (Bakrid)', type: 'gazetted' as const },
  { date: '2026-05-31', name: 'Buddha Purnima', type: 'gazetted' as const },
  { date: '2026-08-15', name: 'Independence Day', type: 'gazetted' as const },
  { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'gazetted' as const },
  { date: '2026-10-08', name: 'Dussehra', type: 'gazetted' as const },
  { date: '2026-11-08', name: 'Diwali', type: 'gazetted' as const },
  { date: '2026-12-25', name: 'Christmas', type: 'gazetted' as const },
];

/* ── Helpers (monthly breakdown) ── */
function parseDate(s: string) { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); }
function fmt(d: Date) { return d.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'}); }
function dayName(d: Date) { return d.toLocaleDateString('en-IN',{weekday:'long'}); }
function diffDays(a: Date,b: Date) { return Math.ceil((b.getTime()-a.getTime())/86400000); }
function monthLabel(m: number,y: number) { return new Date(y,m,1).toLocaleDateString('en-IN',{month:'long',year:'numeric'}); }

function calcRisk(hDate: Date, all: {date:string}[]): {score:number;reason:string} {
  const dow = hDate.getDay();
  let score = 40, reason = 'Normal holiday — standard leave patterns expected.';
  if (dow===1){score+=30;reason='Monday holiday → bridge leaves likely on Friday.';}
  if (dow===5){score+=30;reason='Friday holiday → bridge leaves likely on Monday.';}
  if (dow===2){score+=15;reason='Tuesday holiday → some may take Monday off.';}
  if (dow===4){score+=15;reason='Thursday holiday → some may take Friday off.';}
  if (dow===3){score+=5;reason='Mid-week holiday — minimal bridge-leave risk.';}
  const nearby = all.filter(h=>{ const d=parseDate(h.date); const diff=Math.abs(diffDays(hDate,d)); return diff>0&&diff<=5; });
  if(nearby.length>=2){score+=25;reason+=' Multiple holidays cluster.';}
  else if(nearby.length===1){score+=12;reason+=' Adjacent holiday nearby.';}
  return {score:Math.min(score,100),reason};
}

function generatePredictions(now: Date) {
  const month=now.getMonth(), year=now.getFullYear();
  const months=[
    {m:month,y:year},
    {m:(month+1)%12,y:month+1>11?year+1:year},
    {m:(month+2)%12,y:month+2>11?year+1:year},
  ];
  return months.map(({m,y})=>{
    const holidays=INDIAN_HOLIDAYS.filter(h=>{ const d=parseDate(h.date); return d.getMonth()===m&&d.getFullYear()===y; });
    let weekends=0;
    const daysInMonth=new Date(y,m+1,0).getDate();
    for(let d=1;d<=daysInMonth;d++){ const day=new Date(y,m,d).getDay(); if(day===0||day===6)weekends++; }
    const workingDays=daysInMonth-weekends-holidays.length;
    const bridgeDays=holidays.map(h=>{ const d=parseDate(h.date); return {...h,parsedDate:d,...calcRisk(d,INDIAN_HOLIDAYS)}; });
    const avgRisk=bridgeDays.length>0?Math.round(bridgeDays.reduce((s,b)=>s+b.score,0)/bridgeDays.length):0;
    const tips: string[]=[];
    if(holidays.length>=3)tips.push(`⚡ High holiday density (${holidays.length} holidays). Schedule critical deliverables early.`);
    if(bridgeDays.some(b=>b.score>=70))tips.push('🚨 High bridge-leave risk detected. Expect 30-50% additional unplanned leaves.');
    if(holidays.length===0)tips.push('✅ No public holidays this month. Great window for sprints and milestones.');
    bridgeDays.filter(b=>b.score>=60).forEach(b=>{ const dow=b.parsedDate.getDay(); if(dow===1)tips.push(`📋 ${b.name} falls Monday — anticipate Friday leaves.`); if(dow===5)tips.push(`📋 ${b.name} falls Friday — anticipate Monday leaves.`); });
    if(holidays.some(h=>h.name.includes('Diwali')||h.name.includes('Christmas')||h.name.includes('Holi')))tips.push('🎉 Major festival month — proactively communicate leave policies.');
    tips.push(`📊 Effective working days: ${workingDays} of ${daysInMonth}. Plan capacity at ~${Math.round(workingDays/daysInMonth*100)}%.`);
    return {month:m,year:y,label:monthLabel(m,y),holidays,weekends,workingDays,totalDays:daysInMonth,bridgeDays,avgRisk,tips};
  });
}

/* ── Glass wrapper ── */
const Glass = ({children,className=''}:{children:React.ReactNode;className?:string}) => (
  <div className={`glass ${className}`}>{children}</div>
);

const RiskBadge = ({score}:{score:number}) => {
  const color=score>=70?'var(--color-danger)':score>=40?'var(--color-warning)':'var(--color-success)';
  const bg=score>=70?'rgba(248,113,113,0.12)':score>=40?'rgba(251,191,36,0.12)':'rgba(52,211,153,0.12)';
  const label=score>=70?'High Risk':score>=40?'Medium':'Low Risk';
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold" style={{background:bg,color}}>
      <span className="w-1.5 h-1.5 rounded-full" style={{background:color}} />{label} ({score}%)
    </span>
  );
};


/* ── Main Page ── */
export default function PredictiveAIPage() {
  const [activeTab, setActiveTab] = useState<'predictions'|'holidays'|'calendar'>('predictions');
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const now = useMemo(()=>new Date(),[]);
  const predictions = useMemo(()=>generatePredictions(now),[now]);
  const totalHolidays = predictions.reduce((s,p)=>s+p.holidays.length,0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="page-hero relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px] opacity-20 pointer-events-none" style={{background:'radial-gradient(circle,rgba(52,211,153,0.35),transparent)'}} />
        <div className="absolute bottom-0 left-0 w-52 h-52 rounded-full blur-[80px] opacity-15 pointer-events-none" style={{background:'radial-gradient(circle,rgba(167,139,250,0.3),transparent)'}} />
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-2">
            <div className="p-3 rounded-xl" style={{background:'var(--accent-muted)',border:'1px solid rgba(52,211,153,0.15)',boxShadow:'0 0 20px rgba(52,211,153,0.1)'}}>
              <SparklesIcon className="w-7 h-7 text-[var(--accent)]" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] tracking-tight">Predictive AI Studio</h1>
          </div>
          <p className="text-[var(--text-secondary)] max-w-2xl text-[14px] ml-16">
            ML-powered workforce analytics, holiday risk intelligence, and a full 1-year risk calendar to anticipate disruptions before they happen.
          </p>
        </div>
      </div>

      {/* Tab Nav */}
      <AdminSubNav
        title=""
        items={[
          { id:'predictions', label:'AI Predictions', href:'#', icon:<CpuChipIcon className="w-4 h-4" /> },
          { id:'holidays',    label:'Monthly Intelligence', href:'#', icon:<CalendarDaysIcon className="w-4 h-4" />, badge:totalHolidays },
          { id:'calendar',    label:'Annual Risk Calendar', href:'#', icon:<CalendarIcon className="w-4 h-4" /> },
        ]}
        variant="tabs"
        onItemClick={(id)=>setActiveTab(id as typeof activeTab)}
        activeItem={activeTab}
      />

      {/* ══ TAB 1: AI Predictions ══ */}
      {activeTab==='predictions' && (
        <div className="animate-fade-in">
          <AIPredictionsTab />
        </div>
      )}

      {/* ══ TAB 2: Monthly Intelligence ══ */}
      {activeTab==='holidays' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {l:'Next 3 Months Holidays',v:totalHolidays,icon:'🏖️'},
              {l:'High-Risk Dates',v:predictions.reduce((s,p)=>s+p.bridgeDays.filter(b=>b.score>=70).length,0),icon:'🚨'},
              {l:'Avg Working Days',v:Math.round(predictions.reduce((s,p)=>s+p.workingDays,0)/3),icon:'📊'},
              {l:'Bridge Leave Risk',v:`${Math.round(predictions.reduce((s,p)=>s+p.avgRisk,0)/3)}%`,icon:'⚡'},
            ].map(s=>(
              <Glass key={s.l} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">{s.icon}</span>
                  <span className="text-[var(--text-muted)] text-[10px] font-semibold uppercase tracking-wider">{s.l}</span>
                </div>
                <div className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">{s.v}</div>
              </Glass>
            ))}
          </div>

          {predictions.map((pred,idx)=>(
            <Glass key={pred.label} className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{background:'var(--accent-muted)',border:'1px solid rgba(52,211,153,0.15)'}}>📅</div>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] text-lg">{pred.label}</h3>
                    <p className="text-[12px] text-[var(--text-muted)]">
                      {pred.totalDays} days · {pred.weekends} weekends · {pred.holidays.length} holidays · <span className="text-[var(--accent)] font-semibold">{pred.workingDays} working days</span>
                    </p>
                  </div>
                </div>
                <RiskBadge score={pred.avgRisk} />
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Effective Capacity</span>
                  <span className="text-[12px] font-bold text-[var(--accent)]">{Math.round(pred.workingDays/pred.totalDays*100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                  <div className="h-2 rounded-full transition-all duration-1000" style={{
                    width:`${Math.round(pred.workingDays/pred.totalDays*100)}%`,
                    background:pred.avgRisk>=70?'var(--color-danger)':pred.avgRisk>=40?'var(--color-warning)':'var(--accent)',
                  }} />
                </div>
              </div>

              {pred.holidays.length>0?(
                <div className="rounded-xl border border-[var(--glass-border)] overflow-hidden mb-6">
                  <table className="min-w-full">
                    <thead><tr className="bg-[rgba(255,255,255,0.02)]">
                      {['Holiday','Date','Day','Leave Risk','Prediction'].map(h=>(
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {pred.bridgeDays.map((bd,i)=>(
                        <tr key={i} className="border-t border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{bd.type==='gazetted'?'🏛️':(bd.type as string)==='restricted'?'📌':'🌍'}</span>
                              <div>
                                <p className="text-[13px] font-medium text-[var(--text-primary)]">{bd.name}</p>
                                <p className="text-[10px] text-[var(--text-muted)] capitalize">{bd.type}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-[var(--text-secondary)] tabular-nums">{fmt(bd.parsedDate)}</td>
                          <td className="px-4 py-3 text-[12px] text-[var(--text-secondary)]">{dayName(bd.parsedDate)}</td>
                          <td className="px-4 py-3"><RiskBadge score={bd.score} /></td>
                          <td className="px-4 py-3 text-[11px] text-[var(--text-muted)] max-w-xs">{bd.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ):(
                <div className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.1)'}}>
                  <CheckCircleIcon className="w-5 h-5 text-[var(--accent)]" />
                  <p className="text-[13px] text-[var(--text-secondary)]">No public holidays this month. Ideal for project sprints and deadlines.</p>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <LightBulbIcon className="w-4 h-4 text-[var(--color-warning)]" />
                  <h4 className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-muted)]">AI Action Tips</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {pred.tips.map((tip,i)=>(
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
                      <span className="text-[12px] leading-relaxed text-[var(--text-secondary)]">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Glass>
          ))}

          <Glass className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheckIcon className="w-4 h-4 text-[var(--accent)]" />
              <h4 className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Understanding Risk Scores</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {label:'Low Risk (0-39%)',color:'var(--color-success)',bg:'rgba(52,211,153,0.08)',desc:'Mid-week holidays with minimal bridge-leave impact.'},
                {label:'Medium Risk (40-69%)',color:'var(--color-warning)',bg:'rgba(251,191,36,0.08)',desc:'Near-weekend holidays. Some employees may take bridge leaves.'},
                {label:'High Risk (70-100%)',color:'var(--color-danger)',bg:'rgba(248,113,113,0.08)',desc:'Adjacent to weekends/other holidays. Expect 30-50% extra absences.'},
              ].map(item=>(
                <div key={item.label} className="flex items-start gap-2.5 p-3 rounded-xl" style={{background:item.bg,border:`1px solid ${item.color}20`}}>
                  <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{background:item.color}} />
                  <div>
                    <p className="text-[12px] font-semibold" style={{color:item.color}}>{item.label}</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Glass>
        </div>
      )}

      {/* ══ TAB 3: Annual Risk Calendar ══ */}
      {activeTab==='calendar' && (
        <div className="space-y-6 animate-fade-in">
          {/* Year selector + Date search */}
          <Glass className="p-5 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[var(--accent)]" />
                <h2 className="text-base font-bold text-[var(--text-primary)]">Annual Risk Calendar</h2>
                <span className="text-xs text-[var(--text-muted)] bg-[var(--accent-muted)] px-2 py-0.5 rounded-full border border-[rgba(52,211,153,0.2)]">1 Year View</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={()=>setCalYear(y=>y-1)}
                  className="px-3 py-1.5 rounded-lg text-sm border border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50 transition-colors"
                >← {calYear-1}</button>
                <span className="px-4 py-1.5 rounded-lg text-sm font-bold text-[var(--accent)] bg-[var(--accent-muted)] border border-[rgba(52,211,153,0.2)]">{calYear}</span>
                <button
                  onClick={()=>setCalYear(y=>y+1)}
                  className="px-3 py-1.5 rounded-lg text-sm border border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50 transition-colors"
                >{calYear+1} →</button>
              </div>
            </div>

            {/* Date Search */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MagnifyingGlassIcon className="w-4 h-4 text-[var(--text-muted)]" />
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Check Risk for Any Date</h3>
              </div>
              <DateSearch holidays={INDIAN_HOLIDAYS} />
            </div>
          </Glass>

          {/* Calendar */}
          <Glass className="p-5">
            <RiskCalendar holidays={INDIAN_HOLIDAYS} year={calYear} />
          </Glass>
        </div>
      )}
    </div>
  );
}
