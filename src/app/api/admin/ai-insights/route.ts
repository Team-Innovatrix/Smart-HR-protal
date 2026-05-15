/**
 * API: /api/admin/ai-insights
 * Uses GPT-4o to generate contextual AI insights for the 4 prediction cards:
 *   - Turnover Risk, Performance Forecast, Leave Pattern, Workforce Capacity
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
  const { org } = body; // computeOrgInsights() result

  if (!org) {
    return NextResponse.json({ success: false, error: 'No org data provided' }, { status: 400 });
  }

  const prompt = `
You are an expert HR Analytics AI integrated into a Smart HR Portal dashboard.
You are given real aggregated organizational metrics. Generate exactly 4 short, sharp, actionable insights (1–2 sentences each) for the HR Manager dashboard cards.

ORGANIZATIONAL DATA:
- Total employees: ${org.total}
- High risk: ${org.high} | Moderate: ${org.moderate} | Safe: ${org.safe}
- Attrition risk %: ${org.attritionRisk}%
- Avg risk score: ${org.avgRisk}/100
- Avg performance evaluation: ${org.avgEval}%
- Avg satisfaction: ${org.avgSatisfaction}%
- Avg mood score: ${org.avgMood}/100
- Performance score: ${org.performanceScore}/100
- High absenteeism count: ${org.highAbsent}
- Leave risk %: ${org.leaveRiskPct}%
- Avg absent days/year: ${org.avgAbsent}
- Avg overtime hrs/month: ${org.avgOvertime}
- Highest-risk dept: ${org.deptRisk?.[0]?.dept || 'N/A'} (avg risk ${org.deptRisk?.[0]?.avg || 0})
- Lowest-risk dept: ${org.deptRisk?.[org.deptRisk?.length - 1]?.dept || 'N/A'} (avg risk ${org.deptRisk?.[org.deptRisk?.length - 1]?.avg || 0})
- Top risk factors: ${org.topFactors?.slice(0, 3).map((f: any) => f.name).join(', ')}

Return ONLY valid JSON with exactly this structure:
{
  "turnoverInsight": "<1-2 sentence actionable insight about attrition and retention>",
  "performanceInsight": "<1-2 sentence insight about performance and productivity forecast>",
  "leaveInsight": "<1-2 sentence insight about leave patterns and absenteeism risk>",
  "capacityInsight": "<1-2 sentence insight about workforce capacity and department risk>",
  "overallNarrative": "<2-3 sentence executive summary of overall org health for the HR Director>"
}

Be direct, data-driven, and use the actual numbers. Vary your language — don't use the same opening phrase for each insight.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 600,
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json({ success: true, insights: parsed });
  } catch (err: any) {
    console.error('[AI Insights] GPT-4o error:', err?.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
