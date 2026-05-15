/**
 * hrAIEngine.ts
 * 
 * Shared HR AI Engine  single source of truth for all risk computation.
 *
 * Purpose:
 *   Rule-based ML fallback engine used when the Python FastAPI/XGBoost service
 *   is offline. Produces deterministic employee risk scores from 14 input features.
 *
 * Key Exports:
 *   EmployeeRiskInput         interface: 14 risk features (satisfaction, overtime, etc.)
 *   RiskResult                interface: score, level, indicators, SHAP-like breakdown
 *   EmployeeProfile           interface: RiskInput + display fields (name, avatar, trend)
 *   hashString()              deterministic hash for seeding mock data (no random flicker)
 *   generateMockMetricsForUser()  maps MongoDB user document  EmployeeProfile
 *   computeRisk()             PHASE 1 rule-based scorer (replaced by XGBoost in Phase 2)
 *   computeOrgInsights()      aggregates employee results  org-level KPIs + dept ranking
 *
 * Used by:
 *   src/components/admin/AIPredictionsTab.tsx  (AI Predictions tab)
 *   src/app/portal/admin/risk/page.tsx         (Risk Intelligence page)
 *
 * Phase 2 note:
 *   When the FastAPI ML service is running on :8000, AIPredictionsTab bypasses
 *   computeRisk() entirely and uses XGBoost predictions with real SHAP values.
 * 
 */

export interface EmployeeRiskInput {
  satisfactionLevel: number;      // 01
  lastEvaluation: number;         // 01
  numberProjects: number;
  averageMonthlyHours: number;
  yearsAtCompany: number;
  workAccident: boolean;
  promotionLast5Years: boolean;
  salary: 'low' | 'medium' | 'high';
  department: string;
  overtimeHours: number;
  absenteeismDays: number;
  recentFeedbackSentiment: string;
  salaryGrowthPercent: number;
}

export interface RiskResult {
  riskScore: number;
  riskLevel: 'safe' | 'moderate' | 'high';
  moodScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  indicators: string[];
  positives: string[];
  recommendations: string[];
  breakdown: Record<string, number>;
}

export interface EmployeeProfile extends EmployeeRiskInput {
  id: string;
  name: string;
  department: string;
  position: string;
  avatar: string;
  trend: number[];
  yearsAtCompany: number;
  overtimeHours: number;
}

/** Deterministic hash so metrics don't change on every refresh */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Generate deterministic mock metrics from a real MongoDB user */
export function generateMockMetricsForUser(user: {
  _id?: string;
  clerkUserId?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  position?: string;
  joinDate?: string;
}): EmployeeProfile {
  const seed = hashString(user._id ?? user.clerkUserId ?? 'unknown');
  const r1 = (seed % 100) / 100;
  const r2 = ((seed * 13) % 100) / 100;
  const r3 = ((seed * 17) % 100) / 100;

  let yearsAtCompany = 0.1;
  if (user.joinDate) {
    const t = new Date(user.joinDate).getTime();
    if (!isNaN(t)) yearsAtCompany = Math.max(0, (Date.now() - t) / (1000 * 60 * 60 * 24 * 365.25));
  }

  const isNew  = yearsAtCompany < 1;
  const isCEO  = user.position === 'CEO' || user.position === 'Chief Executive Officer';

  return {
    id: user._id ?? user.clerkUserId ?? 'EMP-TEST',
    name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Unknown',
    department: user.department ?? 'Unassigned',
    position: user.position ?? 'Employee',
    avatar: (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? ''),

    satisfactionLevel:      isCEO ? 0.95 : 0.60 + r1 * 0.35,
    lastEvaluation:         isCEO ? 0.95 : 0.70 + r2 * 0.25,
    numberProjects:         isCEO ? 4    : isNew ? 2 : 2 + (seed % 3),
    averageMonthlyHours:    isCEO ? 180  : 160 + (seed % 20),
    yearsAtCompany,
    workAccident:           false,
    promotionLast5Years:    isNew || isCEO ? true : (seed % 2) === 0,
    salary:                 isCEO ? 'high' : ((seed % 3) === 0 ? 'medium' : 'high'),
    overtimeHours:          isCEO ? 10 : isNew ? 0 : seed % 12,
    absenteeismDays:        isCEO || isNew ? 0 : seed % 5,
    recentFeedbackSentiment: isCEO ? 'positive' : r3 > 0.8 ? 'neutral' : 'positive',
    salaryGrowthPercent:    isNew ? 5 : 3 + (seed % 5),
    trend: [40, 38, 35, 33 + r1 * 5],
  };
}

/** Core risk computation  will be replaced by XGBoost API call in Phase 2 */
export function computeRisk(input: EmployeeRiskInput): RiskResult {
  let riskScore = 0, moodScore = 50;
  const indicators: string[] = [], positives: string[] = [];
  const breakdown: Record<string, number> = {};

  if (input.satisfactionLevel < 0.35) {
    const p = 28; riskScore += p; breakdown['Low Satisfaction'] = p;
    indicators.push('Very low satisfaction score detected'); moodScore -= 20;
  } else if (input.satisfactionLevel < 0.55) {
    const p = 15; riskScore += p; breakdown['Below-avg Satisfaction'] = p;
    indicators.push('Below-average satisfaction reported'); moodScore -= 10;
  } else { positives.push('Healthy satisfaction level'); moodScore += 10; }

  if (input.overtimeHours > 30) {
    const p = 22; riskScore += p; breakdown['Extreme Overtime'] = p;
    indicators.push('Extreme overtime (>30 hrs/mo)'); moodScore -= 15;
  } else if (input.overtimeHours > 15) {
    const p = 12; riskScore += p; breakdown['High Overtime'] = p;
    indicators.push('High overtime workload'); moodScore -= 8;
  } else { positives.push('Balanced working hours'); }

  if (input.salaryGrowthPercent === 0) {
    const p = 20; riskScore += p; breakdown['No Salary Growth'] = p;
    indicators.push('Zero salary growth  retention risk elevated'); moodScore -= 12;
  } else if (input.salaryGrowthPercent < 3) {
    const p = 10; riskScore += p; breakdown['Low Salary Growth'] = p;
    indicators.push('Below-inflation salary growth'); moodScore -= 5;
  } else { positives.push('Good salary growth trajectory'); moodScore += 5; }

  if (!input.promotionLast5Years && input.yearsAtCompany > 3) {
    const p = 15; riskScore += p; breakdown['No Promotion'] = p;
    indicators.push('No promotion in 5 years despite tenure'); moodScore -= 10;
  } else if (input.promotionLast5Years) { positives.push('Promoted within 5 years'); moodScore += 8; }

  if (input.recentFeedbackSentiment === 'negative') {
    const p = 20; riskScore += p; breakdown['Negative Sentiment'] = p;
    indicators.push('Negative feedback sentiment'); moodScore -= 20;
  } else if (input.recentFeedbackSentiment === 'neutral') {
    const p = 5; riskScore += p; breakdown['Neutral Sentiment'] = p; moodScore -= 5;
  } else { positives.push('Positive feedback sentiment'); moodScore += 15; }

  if (input.absenteeismDays > 12) {
    const p = 15; riskScore += p; breakdown['High Absenteeism'] = p;
    indicators.push('Unusually high absenteeism rate'); moodScore -= 10;
  } else if (input.absenteeismDays > 6) {
    const p = 7; riskScore += p; breakdown['Moderate Absenteeism'] = p; moodScore -= 4;
  } else { positives.push('Low absenteeism rate'); moodScore += 5; }

  if (input.lastEvaluation < 0.45) {
    const p = 10; riskScore += p; breakdown['Low Performance'] = p;
    indicators.push('Performance evaluation below expectations'); moodScore -= 5;
  } else if (input.lastEvaluation > 0.8) { positives.push('Excellent evaluation score'); moodScore += 10; }

  if (input.numberProjects > 6) {
    const p = 8; riskScore += p; breakdown['Overloaded'] = p;
    indicators.push('Too many simultaneous projects');
  } else if (input.numberProjects < 2) {
    const p = 5; riskScore += p; breakdown['Underutilized'] = p;
    indicators.push('Very few projects  disengagement signal');
  }

  riskScore = Math.min(100, Math.max(0, riskScore));
  moodScore = Math.min(100, Math.max(0, moodScore));

  const riskLevel: RiskResult['riskLevel'] = riskScore >= 70 ? 'high' : riskScore >= 30 ? 'moderate' : 'safe';
  const sentiment: RiskResult['sentiment'] = moodScore >= 62 ? 'positive' : moodScore >= 38 ? 'neutral' : 'negative';

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

/** Aggregate org-level insights from all employee results */
export function computeOrgInsights(results: { emp: EmployeeProfile; result: RiskResult }[]) {
  const total = results.length;
  if (total === 0) return null;

  const high     = results.filter(r => r.result.riskLevel === 'high').length;
  const moderate = results.filter(r => r.result.riskLevel === 'moderate').length;
  const safe     = results.filter(r => r.result.riskLevel === 'safe').length;
  const avgRisk  = Math.round(results.reduce((s, r) => s + r.result.riskScore, 0) / total);
  const avgMood  = Math.round(results.reduce((s, r) => s + r.result.moodScore, 0) / total);
  const avgSatisfaction = +(results.reduce((s, r) => s + r.emp.satisfactionLevel, 0) / total * 100).toFixed(1);
  const avgEval  = +(results.reduce((s, r) => s + r.emp.lastEvaluation, 0) / total * 100).toFixed(1);
  const avgOvertime = +(results.reduce((s, r) => s + r.emp.overtimeHours, 0) / total).toFixed(1);
  const avgAbsent   = +(results.reduce((s, r) => s + r.emp.absenteeismDays, 0) / total).toFixed(1);

  // Attrition probability: % of at-risk employees weighted by severity
  const attritionRisk = +((high * 1.0 + moderate * 0.4) / total * 100).toFixed(1);

  // Performance score (inverse of avg risk, normalized)
  const performanceScore = Math.round((1 - avgRisk / 100) * 100);

  // Top risk factors across org
  const factorTotals: Record<string, number> = {};
  results.forEach(r => {
    Object.entries(r.result.breakdown).forEach(([k, v]) => {
      factorTotals[k] = (factorTotals[k] ?? 0) + v;
    });
  });
  const topFactors = Object.entries(factorTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, total]) => ({ name, pct: Math.round(total / (results.length * 100) * 100) }));

  // Departments sorted by avg risk
  const deptMap: Record<string, number[]> = {};
  results.forEach(r => {
    const d = r.emp.department;
    if (!deptMap[d]) deptMap[d] = [];
    deptMap[d].push(r.result.riskScore);
  });
  const deptRisk = Object.entries(deptMap)
    .map(([dept, scores]) => ({ dept, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), count: scores.length }))
    .sort((a, b) => b.avg - a.avg);

  // Leave forecast: high absenteeism employees
  const highAbsent = results.filter(r => r.emp.absenteeismDays > 6).length;
  const leaveRiskPct = Math.round(highAbsent / total * 100);

  return {
    total, high, moderate, safe, avgRisk, avgMood,
    avgSatisfaction, avgEval, avgOvertime, avgAbsent,
    attritionRisk, performanceScore, topFactors, deptRisk,
    leaveRiskPct, highAbsent,
  };
}
