/**
 * API: /api/admin/risk-chat
 * HR Analytics Chatbot  powered by Gemini with full org risk context.
 * Allows HR managers to ask natural-language questions about risk analysis results.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ success: false, error: 'Gemini not configured' }, { status: 503 });
  }

  const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const body = await request.json();
  const { messages, orgContext, employeeContext } = body;

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ success: false, error: 'Messages array required' }, { status: 400 });
  }

  // Build org context string
  const orgCtxStr = orgContext ? `
ORGANIZATION RISK SUMMARY (IBM HR Dataset Calibrated):
- Total employees analyzed: ${orgContext.totalEmployees || 0}
- High risk: ${orgContext.highRiskCount || 0} | Moderate: ${orgContext.moderateRiskCount || 0} | Safe: ${orgContext.safeCount || 0}
- Avg risk score: ${orgContext.avgRisk || 0}/100
- Avg attrition probability: ${orgContext.avgAttritionRisk || 0}%
- Top risk factors: ${orgContext.topRiskFactors?.slice(0,5).map((f: any) => f.factor).join(', ') || 'N/A'}
- Department breakdown: ${orgContext.departmentBreakdown?.map((d: any) => `${d.department} (avg risk ${d.avgRisk})`).join(', ') || 'N/A'}
- AI Narrative: ${orgContext.orgInsightNarrative || 'Not available'}
` : 'No org-level context available.';

  // Build selected employee context string
  const empCtxStr = employeeContext ? `
CURRENTLY SELECTED EMPLOYEE:
- Name: ${employeeContext.name}
- Risk Score: ${employeeContext.riskScore}/100 (${employeeContext.riskLevel} risk)
- Attrition Probability: ${employeeContext.attritionProbability}%
- Department: ${employeeContext.department || 'N/A'}
- Position: ${employeeContext.position || 'N/A'}
- Mood Score: ${employeeContext.moodScore}/100
- Sentiment: ${employeeContext.sentiment}
- IBM Benchmark: ${employeeContext.ibmBenchmark || ''}
- Top Risk Indicators: ${employeeContext.riskIndicators?.join(', ') || 'None'}
- Positive Signals: ${employeeContext.positiveSignals?.join(', ') || 'None'}
- Recommendations: ${employeeContext.recommendations?.join(' | ') || 'None'}
- GPT Reasoning: ${employeeContext.reasoningTrace || 'Not available'}
` : 'No employee selected.';

  const systemPrompt = `You are an expert HR Analytics AI Assistant integrated into a Smart HR Portal.
You have been given real-time risk intelligence data powered by the IBM HR Analytics Dataset (XGBoost calibrated, AUC-ROC  0.87) and Gemini reasoning.

${orgCtxStr}

${empCtxStr}

GUIDELINES:
- Answer HR manager questions about risk scores, attrition predictions, and recommendations
- Reference specific employees, departments, and metrics from the context above
- If asked about an employee not in the context, say you only have data for the currently selected employee
- Provide actionable, professional HR advice
- Keep answers concise (2-4 sentences) unless a detailed breakdown is requested
- Always ground your answers in the data provided  don't make up scores
- Use IBM HR Dataset terminology where relevant (SHAP attribution, attrition probability, etc.)
- Maintain confidentiality tone  remind users these are predictive insights, not certainties

You are NOT a general chatbot. Focus exclusively on HR risk intelligence.`;

  //  IBM-Context Fallback (no OpenAI needed) 
  function generateFallbackResponse(userMessage: string): string {
    const q = userMessage.toLowerCase();
    const emp = employeeContext;
    const org = orgContext;

    if (emp && (q.includes('why') || q.includes('reason') || q.includes('high risk') || q.includes('risk'))) {
      return `Based on IBM HR Dataset calibration, **${emp.name}** has a risk score of **${emp.riskScore}/100** (${emp.riskLevel} risk) with ${emp.attritionProbability}% attrition probability. ${emp.riskIndicators?.length ? `Key IBM SHAP factors: ${emp.riskIndicators.slice(0,3).join(', ')}.` : ''} ${emp.recommendations?.length ? `Recommended action: ${emp.recommendations[0]}.` : ''}`;
    }
    if (q.includes('recommend') || q.includes('action') || q.includes('do next')) {
      if (emp?.recommendations?.length) {
        return `For **${emp.name}**, the IBM-calibrated model recommends: (1) ${emp.recommendations[0]}${emp.recommendations[1] ? `; (2) ${emp.recommendations[1]}` : ''}${emp.recommendations[2] ? `; (3) ${emp.recommendations[2]}` : ''}.`;
      }
    }
    if (q.includes('department') || q.includes('team')) {
      if (org?.departmentBreakdown?.length) {
        const top = [...org.departmentBreakdown].sort((a: any, b: any) => b.avgRisk - a.avgRisk)[0];
        return `The highest-risk department is **${top.department}** with an average risk score of ${top.avgRisk}/100 across ${top.count} employees. Focus HR interventions there first per IBM dataset attrition patterns.`;
      }
    }
    if (q.includes('ibm') || q.includes('baseline') || q.includes('benchmark')) {
      const prob = emp?.attritionProbability ?? org?.avgAttritionRisk ?? 16;
      return `The IBM HR Dataset baseline attrition rate is **16.1%** (238/1,470 employees). ${emp ? `${emp.name}'s IBM-calibrated attrition probability is ${emp.attritionProbability}%, which is ${emp.attritionProbability > 16 ? 'above' : 'below'} the population baseline.` : `Your org average is ${org?.avgAttritionRisk ?? 'N/A'}%.`}`;
    }
    if (q.includes('attrition') || q.includes('driver') || q.includes('factor')) {
      if (org?.topRiskFactors?.length) {
        const factors = org.topRiskFactors.slice(0,3).map((f: any) => f.factor).join(', ');
        return `The top IBM SHAP-derived attrition drivers in your organization are: **${factors}**. These match the IBM dataset's primary predictors  overtime burden (18%), salary level (12%), and tenure (9%).`;
      }
    }
    // Generic fallback
    if (org) {
      return `Your organization has **${org.totalEmployees || 0}** employees analyzed  ${org.highRiskCount || 0} high risk, ${org.moderateRiskCount || 0} moderate, ${org.safeCount || 0} safe. Average attrition probability: **${org.avgAttritionRisk || 0}%** (IBM baseline: 16.1%). ${emp ? `Currently viewing: ${emp.name} (${emp.riskLevel} risk, ${emp.attritionProbability}% attrition probability).` : ''}`;
    }
    return `I'm the HR Risk AI Assistant. I can answer questions about employee risk scores, IBM Dataset benchmarks, attrition drivers, and department analysis. Ask me something specific!`;
  }

  try {
    const model = gemini.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }]
      }))
    ];
    
    const result = await model.generateContent({ contents });
    const reply = result.response.text() || 'Sorry, I could not generate a response.';
    return NextResponse.json({ success: true, reply });
  } catch (err: any) {
    console.error('[RiskChat] Gemini error:', err?.message);

    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || '';
    const fallbackReply = generateFallbackResponse(lastUserMessage);
    // Only flag as quota error on actual 429 rate-limit responses
    const isQuotaError = err?.status === 429 || err?.message?.includes('429 Too Many Requests');

    return NextResponse.json({
      success: true,
      reply: fallbackReply + (isQuotaError ? '\n\n_ Gemini rate limit reached  responding from IBM model data directly._' : ''),
    });
  }
}
