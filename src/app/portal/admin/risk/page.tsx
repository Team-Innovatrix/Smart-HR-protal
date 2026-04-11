'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ShieldExclamationIcon,
  FaceSmileIcon,
  FaceFrownIcon,
  MinusCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MagnifyingGlassIcon,
  BoltIcon,
  SparklesIcon,
  UserCircleIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  StarIcon,
  CalendarDaysIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';

// ──────────────────────────────────────────────────────────────────────────────
// AI ENGINE — Rule-based risk scoring + sentiment engine
// ──────────────────────────────────────────────────────────────────────────────

interface EmployeeRiskInput {
  satisfactionLevel: number;      // 0-1
  lastEvaluation: number;         // 0-1
  numberProjects: number;
  averageMonthlyHours: number;
  yearsAtCompany: number;
  workAccident: boolean;
  promotionLast5Years: boolean;
  salary: 'low' | 'medium' | 'high';
  department: string;
  overtimeHours: number;          // hrs/month over 160
  absenteeismDays: number;        // per year
  recentFeedbackSentiment: string; // 'positive' | 'neutral' | 'negative'
  salaryGrowthPercent: number;    // YOY %
}

interface RiskResult {
  riskScore: number;
  riskLevel: 'safe' | 'moderate' | 'high';
  moodScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  indicators: string[];
  positives: string[];
  recommendations: string[];
  breakdown: Record<string, number>;
}

function computeRisk(input: EmployeeRiskInput): RiskResult {
  let riskScore = 0;
  let moodScore = 50;
  const indicators: string[] = [];
  const positives: string[] = [];
  const breakdown: Record<string, number> = {};

  // — Satisfaction
  if (input.satisfactionLevel < 0.35) {
    const pts = 28; riskScore += pts; breakdown['Low Satisfaction'] = pts;
    indicators.push('Very low satisfaction score detected');
    moodScore -= 20;
  } else if (input.satisfactionLevel < 0.55) {
    const pts = 15; riskScore += pts; breakdown['Below-avg Satisfaction'] = pts;
    indicators.push('Below-average satisfaction reported');
    moodScore -= 10;
  } else {
    positives.push('Healthy satisfaction level');
    moodScore += 10;
  }

  // — Overtime
  if (input.overtimeHours > 30) {
    const pts = 22; riskScore += pts; breakdown['Extreme Overtime'] = pts;
    indicators.push('Extreme overtime hours (>30 hrs/mo above baseline)');
    moodScore -= 15;
  } else if (input.overtimeHours > 15) {
    const pts = 12; riskScore += pts; breakdown['High Overtime'] = pts;
    indicators.push('High overtime workload');
    moodScore -= 8;
  } else {
    positives.push('Balanced working hours');
  }

  // — Salary growth
  if (input.salaryGrowthPercent === 0) {
    const pts = 20; riskScore += pts; breakdown['No Salary Growth'] = pts;
    indicators.push('Zero salary growth — retention risk elevated');
    moodScore -= 12;
  } else if (input.salaryGrowthPercent < 3) {
    const pts = 10; riskScore += pts; breakdown['Low Salary Growth'] = pts;
    indicators.push('Below-inflation salary growth');
    moodScore -= 5;
  } else {
    positives.push('Good salary growth trajectory');
    moodScore += 5;
  }

  // — Promotion
  if (!input.promotionLast5Years && input.yearsAtCompany > 3) {
    const pts = 15; riskScore += pts; breakdown['No Promotion'] = pts;
    indicators.push('No promotion in 5 years despite tenure');
    moodScore -= 10;
  } else if (input.promotionLast5Years) {
    positives.push('Promoted within 5 years');
    moodScore += 8;
  }

  // — Sentiment
  if (input.recentFeedbackSentiment === 'negative') {
    const pts = 20; riskScore += pts; breakdown['Negative Sentiment'] = pts;
    indicators.push('Negative feedback sentiment in recent reviews');
    moodScore -= 20;
  } else if (input.recentFeedbackSentiment === 'neutral') {
    const pts = 5; riskScore += pts; breakdown['Neutral Sentiment'] = pts;
    moodScore -= 5;
  } else {
    positives.push('Positive feedback sentiment');
    moodScore += 15;
  }

  // — Absenteeism
  if (input.absenteeismDays > 12) {
    const pts = 15; riskScore += pts; breakdown['High Absenteeism'] = pts;
    indicators.push('Unusually high absenteeism rate');
    moodScore -= 10;
  } else if (input.absenteeismDays > 6) {
    const pts = 7; riskScore += pts; breakdown['Moderate Absenteeism'] = pts;
    moodScore -= 4;
  } else {
    positives.push('Low absenteeism rate');
    moodScore += 5;
  }

  // — Evaluation performance
  if (input.lastEvaluation < 0.45) {
    const pts = 10; riskScore += pts; breakdown['Low Performance'] = pts;
    indicators.push('Recent performance evaluation below expectations');
    moodScore -= 5;
  } else if (input.lastEvaluation > 0.8) {
    positives.push('Excellent recent evaluation score');
    moodScore += 10;
  }

  // — Workload stress (too many or too few projects)
  if (input.numberProjects > 6) {
    const pts = 8; riskScore += pts; breakdown['Overloaded Projects'] = pts;
    indicators.push('Overloaded with too many simultaneous projects');
  } else if (input.numberProjects < 2) {
    const pts = 5; riskScore += pts; breakdown['Underutilized'] = pts;
    indicators.push('Very few projects — possible disengagement signal');
  }

  // Clamp
  riskScore = Math.min(100, Math.max(0, riskScore));
  moodScore = Math.min(100, Math.max(0, moodScore));

  const riskLevel: RiskResult['riskLevel'] =
    riskScore >= 70 ? 'high' : riskScore >= 30 ? 'moderate' : 'safe';

  const sentiment: RiskResult['sentiment'] =
    moodScore >= 62 ? 'positive' : moodScore >= 38 ? 'neutral' : 'negative';

  const recommendations: string[] = [];
  if (riskScore >= 70) {
    recommendations.push('Schedule urgent 1-on-1 retention meeting');
    recommendations.push('Review compensation package immediately');
    recommendations.push('Discuss growth pathway and promotion timeline');
  } else if (riskScore >= 30) {
    recommendations.push('Plan a check-in conversation within 2 weeks');
    recommendations.push('Consider flexible working arrangements');
    recommendations.push('Review workload distribution');
  } else {
    recommendations.push('Continue regular engagement check-ins');
    recommendations.push('Recognize performance in team meetings');
  }

  return { riskScore, riskLevel, moodScore, sentiment, indicators, positives, recommendations, breakdown };
}

// ──────────────────────────────────────────────────────────────────────────────
// MOCK EMPLOYEES (seeded with realistic variance)
// ──────────────────────────────────────────────────────────────────────────────

const MOCK_EMPLOYEES: Array<EmployeeRiskInput & { id: string; name: string; department: string; position: string; avatar: string; trend: number[] }> = [
  {
    id: 'EMP001', name: 'Mohit Mohatkar', department: 'Engineering', position: 'Senior Engineer', avatar: 'MM',
    satisfactionLevel: 0.72, lastEvaluation: 0.85, numberProjects: 4,
    averageMonthlyHours: 195, yearsAtCompany: 3, workAccident: false,
    promotionLast5Years: true, salary: 'high', overtimeHours: 10,
    absenteeismDays: 3, recentFeedbackSentiment: 'positive', salaryGrowthPercent: 8,
    trend: [42, 38, 35, 30, 28, 24],
  },
  {
    id: 'EMP006', name: 'Rudra Bambal', department: 'Engineering', position: 'Software Engineer', avatar: 'RB',
    satisfactionLevel: 0.31, lastEvaluation: 0.52, numberProjects: 7,
    averageMonthlyHours: 255, yearsAtCompany: 5, workAccident: false,
    promotionLast5Years: false, salary: 'medium', overtimeHours: 35,
    absenteeismDays: 14, recentFeedbackSentiment: 'negative', salaryGrowthPercent: 0,
    trend: [35, 50, 58, 68, 72, 82],
  },
  {
    id: 'EMP007', name: 'Viplav Bhure', department: 'Engineering', position: 'Backend Engineer', avatar: 'VB',
    satisfactionLevel: 0.52, lastEvaluation: 0.70, numberProjects: 4,
    averageMonthlyHours: 195, yearsAtCompany: 3, workAccident: false,
    promotionLast5Years: false, salary: 'medium', overtimeHours: 18,
    absenteeismDays: 7, recentFeedbackSentiment: 'neutral', salaryGrowthPercent: 3,
    trend: [30, 35, 38, 42, 44, 48],
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// MINI SPARKLINE
// ──────────────────────────────────────────────────────────────────────────────
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 80, h = 30;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(' ').pop()!.split(',')[0]} cy={pts.split(' ').pop()!.split(',')[1]} r="3" fill={color} />
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SCORE RING
// ──────────────────────────────────────────────────────────────────────────────
function RiskRing({ score, level }: { score: number; level: string }) {
  const r = 40, c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const color = level === 'high' ? '#ef4444' : level === 'moderate' ? '#f59e0b' : '#10b981';
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="rotate-[-90deg]">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="50" y="54" textAnchor="middle" dominantBaseline="middle"
        className="rotate-[90deg]" style={{ transform: 'rotate(90deg) translate(0px,-100px)', fontSize: '18px', fontWeight: 700, fill: color }}>
        {score}
      </text>
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// RISK CARD
// ──────────────────────────────────────────────────────────────────────────────
function EmployeeRiskCard({ emp, result, onClick, selected }: {
  emp: typeof MOCK_EMPLOYEES[0];
  result: RiskResult;
  onClick: () => void;
  selected: boolean;
}) {
  const riskColors = { safe: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-400' }, moderate: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-400' }, high: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-800', dot: 'bg-red-400' } };
  const sentimentIcon = result.sentiment === 'positive' ? <FaceSmileIcon className="w-5 h-5 text-emerald-500" /> : result.sentiment === 'negative' ? <FaceFrownIcon className="w-5 h-5 text-red-500" /> : <MinusCircleIcon className="w-5 h-5 text-amber-500" />;
  const col = riskColors[result.riskLevel];
  const trendUp = result.riskScore > (emp.trend[emp.trend.length - 2] ?? 0);
  const sparkColor = result.riskLevel === 'high' ? '#ef4444' : result.riskLevel === 'moderate' ? '#f59e0b' : '#10b981';

  return (
    <div onClick={onClick} className={`cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200 hover:shadow-xl ${selected ? 'ring-2 ring-indigo-500 shadow-lg' : ''} ${col.bg} ${col.border}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-md ${result.riskLevel === 'high' ? 'bg-gradient-to-br from-red-500 to-red-700' : result.riskLevel === 'moderate' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
            {emp.avatar}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
            <p className="text-xs text-gray-500">{emp.position}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${col.badge}`}>
          <span className={`w-2 h-2 rounded-full ${col.dot} animate-pulse`}></span>
          {result.riskLevel === 'high' ? '🚨 High Risk' : result.riskLevel === 'moderate' ? '⚠️ Moderate' : '✅ Safe'}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-gray-900">{result.riskScore}</span>
            <span className="text-sm text-gray-500">/100</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {sentimentIcon}
            <span className="text-xs text-gray-600 capitalize">{result.sentiment} mood</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Sparkline values={emp.trend} color={sparkColor} />
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {trendUp ? <ArrowTrendingUpIcon className="w-3 h-3 text-red-500" /> : <ArrowTrendingDownIcon className="w-3 h-3 text-emerald-500" />}
            {trendUp ? 'Worsening' : 'Improving'}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {result.indicators.slice(0, 2).map((ind, i) => (
          <span key={i} className="text-xs bg-white/70 px-2 py-0.5 rounded-full text-gray-600 border border-gray-200">⚠ {ind.slice(0, 30)}...</span>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ──────────────────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>{icon}</div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// DETAIL PANEL
// ──────────────────────────────────────────────────────────────────────────────
function DetailPanel({ emp, result }: { emp: typeof MOCK_EMPLOYEES[0]; result: RiskResult }) {
  const maxBreakdown = Math.max(...Object.values(result.breakdown), 1);

  const breakdownColors: Record<string, string> = {
    'Low Satisfaction': '#ef4444', 'Below-avg Satisfaction': '#f97316',
    'Extreme Overtime': '#dc2626', 'High Overtime': '#f59e0b',
    'No Salary Growth': '#b45309', 'Low Salary Growth': '#d97706',
    'No Promotion': '#7c3aed', 'Negative Sentiment': '#be123c',
    'Neutral Sentiment': '#6b7280', 'High Absenteeism': '#0369a1',
    'Moderate Absenteeism': '#38bdf8', 'Low Performance': '#dc2626',
    'Overloaded Projects': '#ea580c', 'Underutilized': '#9333ea',
  };

  const moodBarColor = result.sentiment === 'positive' ? 'bg-emerald-500' : result.sentiment === 'negative' ? 'bg-red-500' : 'bg-amber-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-xl font-black">
              {emp.avatar}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{emp.name}</h2>
              <p className="text-indigo-200">{emp.position} · {emp.department}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-black" style={{ color: result.riskLevel === 'high' ? '#f87171' : result.riskLevel === 'moderate' ? '#fbbf24' : '#34d399' }}>
              {result.riskScore}
            </div>
            <div className="text-sm text-slate-300">Risk Score</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold">{result.moodScore}</div>
            <div className="text-xs text-slate-300">Mood Score</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold">{emp.yearsAtCompany}y</div>
            <div className="text-xs text-slate-300">Tenure</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold">{emp.overtimeHours}h</div>
            <div className="text-xs text-slate-300">Overtime/mo</div>
          </div>
        </div>
      </div>

      {/* Mood bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2"><BoltIcon className="w-4 h-4 text-yellow-500" /> Mood & Sentiment</h3>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${result.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700' : result.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
            {result.sentiment === 'positive' ? '😊 Positive' : result.sentiment === 'negative' ? '😠 Negative' : '😐 Neutral'}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div className={`h-4 rounded-full transition-all duration-1000 ${moodBarColor}`} style={{ width: `${result.moodScore}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>😠 Negative</span>
          <span>{result.moodScore}/100</span>
          <span>😊 Positive</span>
        </div>
      </div>

      {/* Risk breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><ChartBarIcon className="w-4 h-4 text-indigo-500" /> Risk Factor Breakdown</h3>
        {Object.keys(result.breakdown).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No risk factors detected</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(result.breakdown).sort(([, a], [, b]) => b - a).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{key}</span>
                  <span className="font-semibold text-gray-900">+{val} pts</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${(val / maxBreakdown) * 100}%`, backgroundColor: breakdownColors[key] ?? '#6366f1' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Indicators */}
      {result.indicators.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
          <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4" /> Risk Indicators
          </h3>
          <ul className="space-y-2">
            {result.indicators.map((ind, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500 mt-0.5">❌</span> {ind}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Positives */}
      {result.positives.length > 0 && (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
          <h3 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4" /> Positive Signals
          </h3>
          <ul className="space-y-2">
            {result.positives.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-500 mt-0.5">✅</span> {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5">
        <h3 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
          <SparklesIcon className="w-4 h-4" /> AI Recommendations
        </h3>
        <ul className="space-y-2">
          {result.recommendations.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-indigo-900">
              <span className="bg-indigo-200 text-indigo-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>{r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────────────────────────────────────
export default function RiskIntelligencePage() {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(MOCK_EMPLOYEES[0].id);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'moderate' | 'safe'>('all');

  const results = useMemo(() =>
    MOCK_EMPLOYEES.map(e => ({ emp: e, result: computeRisk(e) })),
    []
  );

  const filteredResults = results.filter(({ emp, result }) => {
    const matchSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterLevel === 'all' || result.riskLevel === filterLevel;
    return matchSearch && matchFilter;
  });

  const selectedData = results.find(r => r.emp.id === selectedEmpId)!;
  const highRisk = results.filter(r => r.result.riskLevel === 'high').length;
  const moderate = results.filter(r => r.result.riskLevel === 'moderate').length;
  const safe = results.filter(r => r.result.riskLevel === 'safe').length;
  const avgRisk = Math.round(results.reduce((s, r) => s + r.result.riskScore, 0) / results.length);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-red-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-orange-500 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <ShieldExclamationIcon className="w-8 h-8 text-red-300" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Risk & Mood Intelligence</h1>
                <p className="text-red-200 text-sm">AI-Powered Attrition & Sentiment Prediction Engine</p>
              </div>
            </div>
            <p className="text-slate-300 max-w-xl">
              Real-time employee risk scoring using multi-factor AI analysis. Identify at-risk employees before attrition happens and take <strong className="text-white">preventive action</strong>.
            </p>
          </div>
          <div className="hidden lg:flex gap-4 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
              <div className="text-4xl font-black text-red-300">{highRisk}</div>
              <div className="text-xs text-slate-300 mt-1">High Risk</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
              <div className="text-4xl font-black text-amber-300">{moderate}</div>
              <div className="text-xs text-slate-300 mt-1">Moderate</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
              <div className="text-4xl font-black text-emerald-300">{safe}</div>
              <div className="text-xs text-slate-300 mt-1">Safe</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<ShieldExclamationIcon className="w-6 h-6 text-red-600" />} label="Avg. Risk Score" value={avgRisk} sub="Org-wide average" color="bg-red-50" />
        <StatCard icon={<FaceFrownIcon className="w-6 h-6 text-orange-600" />} label="Negative Sentiment" value={results.filter(r => r.result.sentiment === 'negative').length} sub="Employees flagged" color="bg-orange-50" />
        <StatCard icon={<ArrowTrendingUpIcon className="w-6 h-6 text-purple-600" />} label="Risk Trending Up" value={results.filter(r => r.emp.trend[r.emp.trend.length - 1] > r.emp.trend[0]).length} sub="Getting worse over time" color="bg-purple-50" />
        <StatCard icon={<CheckCircleIcon className="w-6 h-6 text-emerald-600" />} label="Low Risk" value={safe} sub="Healthy & engaged" color="bg-emerald-50" />
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Left: Employee List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Search employees..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value as typeof filterLevel)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All Levels</option>
              <option value="high">🚨 High</option>
              <option value="moderate">⚠️ Moderate</option>
              <option value="safe">✅ Safe</option>
            </select>
          </div>

          <div className="space-y-3 max-h-[800px] overflow-y-auto pr-1">
            {filteredResults.length === 0 && (
              <div className="text-center py-12 text-gray-400">No employees found</div>
            )}
            {filteredResults.map(({ emp, result }) => (
              <EmployeeRiskCard
                key={emp.id}
                emp={emp}
                result={result}
                onClick={() => setSelectedEmpId(emp.id)}
                selected={selectedEmpId === emp.id}
              />
            ))}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="xl:col-span-3">
          {selectedData ? (
            <DetailPanel emp={selectedData.emp} result={selectedData.result} />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <UserCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select an employee to view their risk profile</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Org-wide table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-indigo-600" /> Organisation-Wide Risk Overview
          </h3>
          <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">AI-generated · Updated live</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Employee', 'Dept', 'Risk Score', 'Mood', 'Sentiment', 'Top Risk Factor', 'Trend', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {results.sort((a, b) => b.result.riskScore - a.result.riskScore).map(({ emp, result }) => {
                const col = { high: 'text-red-700 bg-red-50', moderate: 'text-amber-700 bg-amber-50', safe: 'text-emerald-700 bg-emerald-50' }[result.riskLevel];
                const sCol = { positive: 'text-emerald-600', neutral: 'text-amber-600', negative: 'text-red-600' }[result.sentiment];
                const trendUp = result.riskScore > (emp.trend[emp.trend.length - 2] ?? 0);
                const topFactor = Object.keys(result.breakdown)[0] ?? 'None';
                return (
                  <tr key={emp.id} className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedEmpId === emp.id ? 'bg-indigo-50' : ''}`}
                    onClick={() => setSelectedEmpId(emp.id)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">{emp.avatar}</div>
                        <span className="font-medium text-gray-900">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{emp.department}</td>
                    <td className="px-5 py-4">
                      <span className={`font-bold text-lg ${result.riskLevel === 'high' ? 'text-red-600' : result.riskLevel === 'moderate' ? 'text-amber-600' : 'text-emerald-600'}`}>{result.riskScore}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <div className="w-20 bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${result.moodScore > 60 ? 'bg-emerald-500' : result.moodScore > 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${result.moodScore}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{result.moodScore}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 capitalize">
                      <span className={`font-medium ${sCol}`}>
                        {result.sentiment === 'positive' ? '😊' : result.sentiment === 'negative' ? '😠' : '😐'} {result.sentiment}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{topFactor || 'None'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        {trendUp
                          ? <><ArrowUpIcon className="w-3 h-3 text-red-500" /><span className="text-xs text-red-500">Rising</span></>
                          : <><ArrowDownIcon className="w-3 h-3 text-emerald-500" /><span className="text-xs text-emerald-500">Falling</span></>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => setSelectedEmpId(emp.id)}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${result.riskLevel === 'high' ? 'bg-red-100 text-red-700 hover:bg-red-200' : result.riskLevel === 'moderate' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                        View Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-3">
        <SparklesIcon className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-indigo-900">About This AI Engine</p>
          <p className="text-sm text-indigo-700 mt-1">
            This system uses a multi-factor rule-based AI model analyzing satisfaction, overtime, salary growth, promotions, sentiment, absenteeism, and performance. 
            It helps HR take <strong>preventive actions before attrition happens</strong>. Future upgrades will include real ML models (XGBoost), 
            email/chat sentiment integration, and live API connections.
          </p>
        </div>
      </div>
    </div>
  );
}
