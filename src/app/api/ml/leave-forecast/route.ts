/**
 * src/app/api/ml/leave-forecast/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Next.js API Route  →  GET /api/ml/leave-forecast?days=90
 *
 * Purpose:
 *   Proxy to the Python FastAPI leave demand forecaster (sklearn Ridge + Fourier
 *   seasonality). Returns a daily forecast of predicted leave counts for the
 *   next N days (default 90), with risk levels and confidence intervals.
 *
 * Query params:
 *   days  (optional, default 90)  — number of days to forecast ahead
 *
 * Response (success):
 *   {
 *     success: true,
 *     forecast: [{ date, predicted_leaves, lower_bound, upper_bound, risk_level, is_holiday }],
 *     summary: { avg_daily_leaves, peak_date, peak_leaves, high_risk_days },
 *     model: "sklearn-ridge-fourier"
 *   }
 *
 * Response (failure / ML offline):
 *   { success: false, fallback: true }  (HTTP 503)
 *
 * FastAPI target: GET http://<ML_API_URL>/predict/leave-forecast?days=N
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';

const ML_API = process.env.ML_API_URL ?? 'http://localhost:8000';

/**
 * GET /api/ml/leave-forecast?days=90
 * Calls Python FastAPI → /predict/leave-forecast
 */
export async function GET(req: NextRequest) {
  const days = req.nextUrl.searchParams.get('days') ?? '90';
  try {
    const mlRes = await fetch(`${ML_API}/predict/leave-forecast?days=${days}`, {
      signal: AbortSignal.timeout(60000),
    });

    if (!mlRes.ok) {
      return NextResponse.json({ success: false, fallback: true }, { status: mlRes.status });
    }

    const data = await mlRes.json();
    return NextResponse.json({ success: true, ...data });

  } catch {
    return NextResponse.json({ success: false, fallback: true }, { status: 503 });
  }
}
