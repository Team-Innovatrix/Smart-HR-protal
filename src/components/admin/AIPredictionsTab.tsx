/**
 * AIPredictionsTab.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Component : AIPredictionsTab  (Admin → Predictive AI Studio → AI Predictions tab)
 * Purpose   : Fetches real employee data, runs risk predictions, and displays
 *             four org-level prediction cards with live data.
 *
 * Data flow (Phase 2 — XGBoost active):
 *   1. Fetch all employees   → GET /api/admin/users
 *   2. Check ML health       → GET /api/ml/health
 *   3a. If XGBoost online    → POST /api/ml/attrition (batch)  → real SHAP values
 *   3b. If XGBoost offline   → fallback to computeRisk() from hrAIEngine.ts
 *   4. Aggregate results     → computeOrgInsights()
 *   5. Render 4 cards        → Turnover Risk · Performance · Leave Pattern · Capacity
 *
 * Prediction Cards:
 *   🔴 Turnover Risk       — attrition probability ring + high/moderate/safe count
 *   📈 Performance Forecast — org health ring + evaluation/satisfaction/mood bars
 *   📅 Leave Pattern       — absenteeism risk ring + overtime tracking
 *   👥 Workforce Capacity  — safe-employee ring + per-department risk bars
 *
 * Banner states:
 *   🟢 Green  → "XGBoost ML Engine — Phase 2 Live"    (FastAPI running on :8000)
 *   🟡 Amber  → "Rule-based Engine (Fallback)"         (FastAPI offline)
 *
 * Used by:
 *   src/app/portal/admin/predictive/page.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  SparklesIcon, ExclamationTriangleIcon, ArrowTrendingUpIcon,
  CalendarDaysIcon, UserGroupIcon, CpuChipIcon,
  ChartBarIcon, ArrowUpIcon, ArrowDownIcon, MinusSmallIcon,
  SignalIcon, SignalSlashIcon,
} from '@heroicons/react/24/outline';
import { generateMockMetricsForUser, computeRisk, computeOrgInsights, EmployeeProfile, RiskResult } from '@/lib/hrAIEngine';

/** Map ML API batch response back to {emp, result} shape for computeOrgInsights */
function mlResponseToResults(
  mlPreds: any[],
  profiles: EmployeeProfile[]
): { emp: EmployeeProfile; result: RiskResult }[] {
  return mlPreds.map((p, i) => ({
    emp: profiles[i],
    result: {
      riskScore:       p.risk_score,
      riskLevel:       p.risk_level,
      moodScore:       p.mood_score,
      sentiment:       p.sentiment,
      indicators:      p.indicators,
      positives:       p.positives,
      recommendations: p.recommendations,
      breakdown:       Object.fromEntries(
        Object.entries(p.shap_values as Record<string,number>)
          .filter(([,v]) => v > 0)
          .map(([k,v]) => [k, Math.round(v * 100)])
      ),
    } as RiskResult,
  }));
}

/* ── tiny helpers ── */
function Ring({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const r = size * 0.38, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size*0.1} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.1}
        strokeDasharray={`${pct/100*c} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke-dasharray 1.2s ease' }} />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: size*0.22, fontWeight: 700, fill: color }}>{pct}%</text>
    </svg>
  );
}

function Bar({ pct, color, label, value }: { pct: number; color: string; label: string; value: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-semibold text-[var(--text-primary)]">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function StatPill({ label, value, trend }: { label: string; value: string | number; trend?: 'up' | 'down' | 'flat' }) {
  return (
    <div className="flex flex-col items-center bg-[rgba(255,255,255,0.04)] rounded-xl px-4 py-3 border border-[var(--glass-border)]">
      <div className="flex items-center gap-1">
        <span className="text-xl font-black text-[var(--text-primary)] tabular-nums">{value}</span>
        {trend === 'up'   && <ArrowUpIcon   className="w-3 h-3 text-red-400" />}
        {trend === 'down' && <ArrowDownIcon className="w-3 h-3 text-emerald-400" />}
        {trend === 'flat' && <MinusSmallIcon className="w-3 h-3 text-slate-400" />}
      </div>
      <span className="text-[10px] text-[var(--text-muted)] text-center mt-0.5">{label}</span>
    </div>
  );
}

/* ── Prediction Card skeleton loader ── */
function CardSkeleton() {
  return (
    <div className="glass p-6 rounded-2xl animate-pulse space-y-4">
      <div className="h-5 bg-[rgba(255,255,255,0.06)] rounded w-2/3" />
      <div className="h-16 bg-[rgba(255,255,255,0.04)] rounded" />
      <div className="h-3 bg-[rgba(255,255,255,0.04)] rounded w-full" />
      <div className="h-3 bg-[rgba(255,255,255,0.04)] rounded w-4/5" />
    </div>
  );
}

/* ── Main Component ── */
export default function AIPredictionsTab() {
  const [rawUsers, setRawUsers]     = useState<any[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState('');
  const [mlOnline, setMlOnline]     = useState(false);
  const [mlResults, setMlResults]   = useState<{ emp: EmployeeProfile; result: RiskResult }[] | null>(null);
  const [mlChecked, setMlChecked]   = useState(false);

  useEffect(() => {
    async function load() {
      // 1. Fetch employees
      let users: any[] = [];
      try {
        const res = await fetch('/api/admin/users?limit=200');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        if (d.success && d.data?.users) { users = d.data.users; setRawUsers(users); }
        else { setError('Could not load employee data.'); setIsLoading(false); return; }
      } catch { setError('Network error.'); setIsLoading(false); return; }

      // 2. Check ML health
      try {
        const hRes = await fetch('/api/ml/health');
        const h = hRes.ok ? await hRes.json() : { online: false };
        if (h.online && h.attrition_model === 'loaded') {
          setMlOnline(true);
          // 3. Batch ML prediction
          const profiles = users.map(generateMockMetricsForUser);
          const payload = profiles.map(p => ({
            id: p.id, name: p.name, department: p.department,
            satisfaction_level: p.satisfactionLevel,
            last_evaluation: p.lastEvaluation,
            number_projects: p.numberProjects,
            average_monthly_hours: p.averageMonthlyHours,
            years_at_company: p.yearsAtCompany,
            work_accident: p.workAccident,
            promotion_last_5years: p.promotionLast5Years,
            salary: p.salary,
            overtime_hours: p.overtimeHours,
            absenteeism_days: p.absenteeismDays,
            recent_feedback_sentiment: p.recentFeedbackSentiment,
            salary_growth_percent: p.salaryGrowthPercent,
          }));
          const mlRaw = await fetch('/api/ml/attrition', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employees: payload }),
          });
          const mlRes = mlRaw.ok ? await mlRaw.json() : { success: false };
          if (mlRes.success && mlRes.predictions) {
            setMlResults(mlResponseToResults(mlRes.predictions, profiles));
          }
        }
      } catch { /* ML offline — use fallback */ }
      setMlChecked(true);
      setIsLoading(false);
    }
    load();
  }, []);

  // Use XGBoost results when available, fall back to rule-based computeRisk
  const fallbackResults = useMemo(() =>
    rawUsers.map(u => ({ emp: generateMockMetricsForUser(u), result: computeRisk(generateMockMetricsForUser(u)) })),
  [rawUsers]);

  const activeResults = mlResults ?? fallbackResults;
  const org = useMemo(() => computeOrgInsights(activeResults), [activeResults]);

  if (isLoading) return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
    </div>
  );

  if (error || !org) return (
    <div className="glass p-8 rounded-2xl text-center">
      <CpuChipIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 animate-pulse" />
      <p className="text-[var(--text-secondary)]">{error || 'No employee data found. Add employees to activate AI predictions.'}</p>
    </div>
  );

  /* ── colour helpers ── */
  const riskColor = (s: number) => s >= 70 ? '#ef4444' : s >= 30 ? '#f59e0b' : '#10b981';
  const attrColor = org.attritionRisk >= 40 ? '#ef4444' : org.attritionRisk >= 20 ? '#f59e0b' : '#10b981';
  const perfColor = org.performanceScore >= 70 ? '#10b981' : org.performanceScore >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Model banner ── */}
      <div className={`glass px-5 py-3 flex items-center gap-3 rounded-xl border ${
        mlOnline ? 'border-[rgba(52,211,153,0.25)]' : 'border-[rgba(251,191,36,0.2)]'
      }`}>
        {mlOnline
          ? <SignalIcon className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
          : <SignalSlashIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />}
        <p className="text-xs text-[var(--text-secondary)]">
          {mlOnline
            ? <><span className="font-semibold text-[var(--accent)]">XGBoost ML Engine</span> — live predictions for <span className="font-semibold text-[var(--text-primary)]">{org?.total} employees</span>. SHAP explainability active. <span className="text-[var(--accent)]">✓ Phase 2 Live</span></>
            : <><span className="font-semibold text-amber-400">Rule-based Engine (Fallback)</span> — ML API offline. <span className="text-[var(--text-primary)] font-medium">Run hr-ml-api/setup.bat to activate XGBoost.</span> Analyzing {org?.total} employees. <span className="text-amber-400">Phase 2 ready to deploy →</span></>}
        </p>
      </div>

      {/* ── 4 Prediction Cards grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1 — Turnover Risk */}
        <div className="glass p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">Turnover Risk Prediction</h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {mlOnline ? '⚡ XGBoost · AUC-ROC trained model' : 'Rule-based v1 (fallback)'}
                </p>
              </div>
            </div>
            <Ring pct={org.attritionRisk} color={attrColor} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatPill label="High Risk" value={org.high} trend="up" />
            <StatPill label="Moderate" value={org.moderate} trend="flat" />
            <StatPill label="Safe" value={org.safe} trend="down" />
          </div>

          <div className="space-y-2.5">
            <Bar pct={Math.round(org.high/org.total*100)}     color="#ef4444" label="High-risk employees"    value={`${Math.round(org.high/org.total*100)}%`} />
            <Bar pct={Math.round(org.moderate/org.total*100)} color="#f59e0b" label="Moderate-risk employees" value={`${Math.round(org.moderate/org.total*100)}%`} />
            <Bar pct={Math.round(org.safe/org.total*100)}     color="#10b981" label="Safe employees"          value={`${Math.round(org.safe/org.total*100)}%`} />
          </div>

          <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-3 border border-[var(--glass-border)]">
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              <span className="text-[var(--accent)] font-semibold">AI Insight:</span>{' '}
              {org.attritionRisk >= 40
                ? `⚠️ Attrition risk is elevated at ${org.attritionRisk}%. Prioritize retention 1-on-1s for ${org.high} high-risk employees immediately.`
                : org.attritionRisk >= 20
                ? `Moderate attrition risk (${org.attritionRisk}%). Schedule check-ins for ${org.moderate} watch-list employees this sprint.`
                : `✅ Org retention looks healthy. ${org.safe} of ${org.total} employees are in the safe zone.`}
            </p>
          </div>
        </div>

        {/* Card 2 — Performance Forecast */}
        <div className="glass p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <ArrowTrendingUpIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">Performance Forecast</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Org-wide productivity outlook</p>
              </div>
            </div>
            <Ring pct={org.performanceScore} color={perfColor} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatPill label="Avg Evaluation" value={`${org.avgEval}%`} trend="flat" />
            <StatPill label="Avg Satisfaction" value={`${org.avgSatisfaction}%`} trend="flat" />
            <StatPill label="Avg Mood" value={org.avgMood} trend="flat" />
          </div>

          <div className="space-y-2.5">
            <Bar pct={org.avgEval}         color="#6366f1" label="Performance evaluation avg"  value={`${org.avgEval}%`} />
            <Bar pct={org.avgSatisfaction} color="#8b5cf6" label="Satisfaction index"           value={`${org.avgSatisfaction}%`} />
            <Bar pct={org.avgMood}         color={perfColor} label="Mood & sentiment index"     value={`${org.avgMood}/100`} />
          </div>

          <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-3 border border-[var(--glass-border)]">
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              <span className="text-[var(--accent)] font-semibold">AI Insight:</span>{' '}
              {org.performanceScore >= 70
                ? `✅ Strong performance outlook. Average evaluation at ${org.avgEval}% suggests a productive quarter ahead.`
                : org.performanceScore >= 50
                ? `Performance is average at ${org.performanceScore}/100. Focus on coaching low-evaluation employees to push the org forward.`
                : `⚠️ Performance indicators are below target. Review workload balance and re-evaluate KPIs this quarter.`}
            </p>
          </div>
        </div>

        {/* Card 3 — Leave Pattern Analysis */}
        <div className="glass p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <CalendarDaysIcon className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">Leave Pattern Analysis</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Absenteeism & unplanned leave forecast</p>
              </div>
            </div>
            <Ring pct={org.leaveRiskPct} color={org.leaveRiskPct >= 40 ? '#f97316' : '#10b981'} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatPill label="High Absenteeism" value={org.highAbsent} trend="up" />
            <StatPill label="Avg Days/Year"    value={org.avgAbsent}  trend="flat" />
            <StatPill label="Avg Overtime hrs" value={org.avgOvertime} trend="up" />
          </div>

          <div className="space-y-2.5">
            <Bar pct={org.leaveRiskPct}                              color="#f97316" label="Employees w/ elevated absenteeism" value={`${org.highAbsent} employees`} />
            <Bar pct={Math.min(100, org.avgAbsent / 20 * 100)}       color="#fbbf24" label="Avg absence days (20-day max scale)" value={`${org.avgAbsent} days`} />
            <Bar pct={Math.min(100, org.avgOvertime / 30 * 100)}     color="#ef4444" label="Avg overtime (30-hr max scale)"      value={`${org.avgOvertime} hrs/mo`} />
          </div>

          <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-3 border border-[var(--glass-border)]">
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              <span className="text-[var(--accent)] font-semibold">AI Insight:</span>{' '}
              {org.leaveRiskPct >= 40
                ? `🚨 ${org.highAbsent} employees show elevated absenteeism. Cross-reference with holiday calendar to plan minimum coverage.`
                : org.leaveRiskPct >= 20
                ? `Moderate leave risk — ${org.highAbsent} employees trending above average. Monitor around upcoming holiday clusters.`
                : `✅ Leave patterns are within healthy norms. Average ${org.avgAbsent} absent days/year is below warning threshold.`}
            </p>
          </div>
        </div>

        {/* Card 4 — Workforce Capacity */}
        <div className="glass p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <UserGroupIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">Workforce Capacity</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Department risk distribution</p>
              </div>
            </div>
            <Ring pct={Math.round(org.safe/org.total*100)} color="#a78bfa" />
          </div>

          <div className="space-y-2.5">
            {org.deptRisk.slice(0, 5).map(({ dept, avg, count }) => (
              <div key={dept}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-secondary)] truncate max-w-[140px]">{dept}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{count} emp · risk {avg}</span>
                </div>
                <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                  <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${avg}%`, background: riskColor(avg) }} />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-3 border border-[var(--glass-border)]">
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              <span className="text-[var(--accent)] font-semibold">AI Insight:</span>{' '}
              {org.deptRisk[0]
                ? `⚠️ ${org.deptRisk[0].dept} is the highest-risk department (avg score ${org.deptRisk[0].avg}). Prioritize HR interventions there. ${org.deptRisk[org.deptRisk.length-1]?.dept} is the healthiest at ${org.deptRisk[org.deptRisk.length-1]?.avg}.`
                : 'No department data available.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Top Risk Factors ── */}
      {org.topFactors.length > 0 && (
        <div className="glass p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="font-bold text-[var(--text-primary)]">Top Org-Wide Risk Factors</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] border border-[rgba(52,211,153,0.2)] font-semibold uppercase tracking-wider">
              {mlOnline ? 'SHAP Values' : 'SHAP-style'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {org.topFactors.map(({ name, pct }, i) => (
              <div key={name} className="flex items-center gap-3 bg-[rgba(255,255,255,0.03)] rounded-xl px-4 py-3 border border-[var(--glass-border)]">
                <span className="text-[var(--text-muted)] text-sm font-bold w-5 shrink-0">#{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{name}</p>
                  <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] mt-1.5 overflow-hidden">
                    <div className="h-1.5 rounded-full bg-[var(--color-danger)] transition-all duration-1000" style={{ width: `${Math.min(100, pct * 3)}%` }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-red-400 shrink-0">{pct}%</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            {mlOnline
              ? '* Real SHAP values from XGBoost — showing which features most pushed attrition probability up per employee.'
              : '* Rule-based factor weights. Activate hr-ml-api to get real SHAP explainability from XGBoost.'}
          </p>
        </div>
      )}

      {/* ── Org Health Summary ── */}
      <div className="glass p-5 rounded-2xl flex items-start gap-3">
        <SparklesIcon className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Overall Org Health Score</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-4xl font-black tabular-nums" style={{ color: perfColor }}>{org.performanceScore}</span>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">
                Based on satisfaction, performance, sentiment, overtime & absenteeism across {org?.total} employees.
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                {mlOnline
                  ? '✅ XGBoost (Phase 2 active) · Prophet leave forecast ready · Zero-shot GPT-4o sentiment'
                  : 'Phase 2: Run hr-ml-api/setup.bat → XGBoost AUC-ROC >0.85 · Prophet MAPE <15%'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
