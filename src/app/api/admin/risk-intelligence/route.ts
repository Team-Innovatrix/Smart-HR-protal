/**
 * API Route: /api/admin/risk-intelligence
 * 
 * Powers the AI Risk Intelligence dashboard using Gemini + real MongoDB data.
 * Aggregates attendance, leave, and profile data per employee, then feeds
 * it to Gemini for SHAP-style analysis with natural language reasoning traces.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s (requires Vercel Pro; Hobby capped at 10s)

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

    const hasOpenAI = !!process.env.GEMINI_API_KEY;
    const results: AIRiskResult[] = [];

    if (hasOpenAI) {
      //  AI MODE: Parallel Gemini analysis for all employees 
      // Parallel calls: total time ~5s (slowest single call), fits Vercel 30s limit
      const batchSize = Math.min(employees.length, 10);
      const batch = employees.slice(0, batchSize);

      const analysisPromises = batch.map(async (emp: any) => {
        try {
          const ctx = await aggregateEmployeeData(emp.clerkUserId || (emp._id as any).toString());
          if (!ctx) return null;
          return await analyzeEmployeeRiskWithAI(ctx);
        } catch (err) {
          console.error(`[RiskAPI] Failed for ${emp.firstName}:`, err);
          return null;
        }
      });

      const rawResults = await Promise.allSettled(analysisPromises);
      rawResults.forEach((r, idx) => {
        if (r.status === 'fulfilled' && r.value) {
          const emp = batch[idx];
          const joinDate = emp.joinDate || emp.createdAt;
          const yearsAtCompany = joinDate
            ? +((Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)
            : 0;
          results.push({
            ...r.value,
            department: emp.department || 'Unassigned',
            position: emp.position || 'Employee',
            yearsAtCompany,
            overtimeHours: 0,
          } as AIRiskResult & { department: string; position: string; yearsAtCompany: number; overtimeHours: number });
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
      //  FALLBACK MODE: Rule-based risk engine 
      const fallbackResults = employees.map((emp: any) => {
        const profile = generateMockMetricsForUser(emp);
        const risk = computeRisk(profile);
        return {
          employeeId: emp.clerkUserId || emp._id?.toString(),
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
          department: emp.department || 'Unassigned',
          position: emp.position || 'Employee',
          yearsAtCompany: emp.joinDate ? +((Date.now() - new Date(emp.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1) : 0,
          overtimeHours: 0,
          riskScore: risk.riskScore,
          riskLevel: risk.riskLevel,
          attritionProbability: risk.riskScore,
          moodScore: risk.moodScore,
          sentiment: risk.sentiment,
          reasoningTrace: 'Rule-based fallback analysis (Gemini not configured).',
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
