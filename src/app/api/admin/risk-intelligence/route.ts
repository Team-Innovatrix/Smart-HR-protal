/**
 * API Route: /api/admin/risk-intelligence
 * 
 * Powers the AI Risk Intelligence dashboard using GPT-4o + real MongoDB data.
 * Aggregates attendance, leave, and profile data per employee, then feeds
 * it to GPT-4o for SHAP-style analysis with natural language reasoning traces.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserProfile from '@/models/UserProfile';
import {
  aggregateEmployeeData,
  analyzeEmployeeRiskWithAI,
  generateOrgRiskNarrative,
  type AIRiskResult,
} from '@/lib/riskIntelligenceService';
import {
  generateMockMetricsForUser,
  computeRisk,
} from '@/lib/hrAIEngine';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Fetch all employees
    const employees = await UserProfile.find({}).limit(50).lean();

    if (!employees || employees.length === 0) {
      return NextResponse.json({ success: true, results: [], orgSummary: null });
    }

    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const results: AIRiskResult[] = [];

    if (hasOpenAI) {
      // ── AI MODE: Aggregate real data + GPT-4o analysis ──────────────────
      // Process up to 20 employees to stay within API budget
      const batchSize = Math.min(employees.length, 20);
      const batch = employees.slice(0, batchSize);

      const analysisPromises = batch.map(async (emp: any) => {
        try {
          const ctx = await aggregateEmployeeData(emp.clerkUserId || emp._id.toString());
          if (!ctx) return null;
          return await analyzeEmployeeRiskWithAI(ctx);
        } catch (err) {
          console.error(`[RiskAPI] Failed for ${emp.firstName}:`, err);
          return null;
        }
      });

      const rawResults = await Promise.allSettled(analysisPromises);
      rawResults.forEach(r => {
        if (r.status === 'fulfilled' && r.value) {
          results.push(r.value);
        }
      });

      // Generate org-level narrative via GPT
      const orgNarrative = await generateOrgRiskNarrative(results, employees.length);

      // Compute org summary
      const highRisk = results.filter(r => r.riskLevel === 'high').length;
      const moderate = results.filter(r => r.riskLevel === 'moderate').length;
      const safe = results.filter(r => r.riskLevel === 'safe').length;
      const avgRisk = Math.round(results.reduce((s, r) => s + r.riskScore, 0) / (results.length || 1));
      const avgAttrition = Math.round(results.reduce((s, r) => s + r.attritionProbability, 0) / (results.length || 1));

      // Aggregate top risk factors
      const factorMap: Record<string, number> = {};
      results.forEach(r => {
        r.riskIndicators.forEach(ind => {
          const key = ind.substring(0, 50);
          factorMap[key] = (factorMap[key] || 0) + 1;
        });
      });
      const topRiskFactors = Object.entries(factorMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([factor, frequency]) => ({ factor, frequency }));

      // Dept breakdown
      const deptMap: Record<string, number[]> = {};
      results.forEach(r => {
        // Find dept from employee profile
        const emp = employees.find((e: any) => e.clerkUserId === r.employeeId || e._id?.toString() === r.employeeId);
        const dept = (emp as any)?.department || 'Unassigned';
        if (!deptMap[dept]) deptMap[dept] = [];
        deptMap[dept].push(r.riskScore);
      });
      const departmentBreakdown = Object.entries(deptMap).map(([department, scores]) => ({
        department,
        avgRisk: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        count: scores.length,
      })).sort((a, b) => b.avgRisk - a.avgRisk);

      return NextResponse.json({
        success: true,
        mode: 'ai',
        results: results.sort((a, b) => b.riskScore - a.riskScore),
        orgSummary: {
          totalEmployees: employees.length,
          analyzed: results.length,
          highRiskCount: highRisk,
          moderateRiskCount: moderate,
          safeCount: safe,
          avgRisk,
          avgAttritionRisk: avgAttrition,
          topRiskFactors,
          departmentBreakdown,
          orgInsightNarrative: orgNarrative,
        },
      });

    } else {
      // ── FALLBACK MODE: Rule-based risk engine ──────────────────────────
      const fallbackResults = employees.map((emp: any) => {
        const profile = generateMockMetricsForUser(emp);
        const risk = computeRisk(profile);
        return {
          employeeId: emp.clerkUserId || emp._id?.toString(),
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
          riskScore: risk.riskScore,
          riskLevel: risk.riskLevel,
          attritionProbability: risk.riskScore,
          moodScore: risk.moodScore,
          sentiment: risk.sentiment,
          reasoningTrace: 'Rule-based fallback analysis (OpenAI not configured).',
          featureAttribution: Object.entries(risk.breakdown).map(([feature, impact]) => ({
            feature,
            impact: impact as number,
            direction: 'negative' as const,
          })),
          recommendations: risk.recommendations,
          riskIndicators: risk.indicators,
          positiveSignals: risk.positives,
          fairnessNote: 'Fallback mode: analysis based on behavioral patterns only.',
        } as AIRiskResult;
      });

      return NextResponse.json({
        success: true,
        mode: 'fallback',
        results: fallbackResults.sort((a, b) => b.riskScore - a.riskScore),
        orgSummary: null,
      });
    }
  } catch (error: any) {
    console.error('[RiskIntelligence API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
