/**
 * API: /api/admin/risk-chat
 * HR Analytics Chatbot — powered by GPT-4o with full org risk context.
 * Allows HR managers to ask natural-language questions about risk analysis results.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ success: false, error: 'OpenAI not configured' }, { status: 503 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
You have been given real-time risk intelligence data powered by the IBM HR Analytics Dataset (XGBoost calibrated, AUC-ROC ≈ 0.87) and GPT-4o reasoning.

${orgCtxStr}

${empCtxStr}

GUIDELINES:
- Answer HR manager questions about risk scores, attrition predictions, and recommendations
- Reference specific employees, departments, and metrics from the context above
- If asked about an employee not in the context, say you only have data for the currently selected employee
- Provide actionable, professional HR advice
- Keep answers concise (2-4 sentences) unless a detailed breakdown is requested
- Always ground your answers in the data provided — don't make up scores
- Use IBM HR Dataset terminology where relevant (SHAP attribution, attrition probability, etc.)
- Maintain confidentiality tone — remind users these are predictive insights, not certainties

You are NOT a general chatbot. Focus exclusively on HR risk intelligence.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.5,
      max_tokens: 400,
    });

    const reply = completion.choices[0].message.content || 'Sorry, I could not generate a response.';
    return NextResponse.json({ success: true, reply });
  } catch (err: any) {
    console.error('[RiskChat] GPT-4o error:', err?.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
