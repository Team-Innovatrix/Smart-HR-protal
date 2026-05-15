/**
 * src/app/api/ml/health/route.ts
 * 
 * Next.js API Route    GET /api/ml/health
 *
 * Purpose:
 *   Lightweight health check that pings the FastAPI ML service and reports
 *   whether both the XGBoost attrition model and leave forecast model are
 *   loaded and ready.
 *
 * Called by:
 *   AIPredictionsTab.tsx  on page load, with a 5-second timeout.
 *   If online  switches to XGBoost predictions (Phase 2 mode).
 *   If offline  stays on rule-based computeRisk() fallback (Phase 1 mode).
 *
 * Response (ML online):
 *   { online: true, attrition_model: "loaded", leave_model: "loaded", version: "2.0.0" }
 *
 * Response (ML offline / error):
 *   { online: false, attrition_model: "offline", leave_model: "offline" }
 *
 * FastAPI target: GET http://<ML_API_URL>/health
 * 
 */
import { NextResponse } from 'next/server';

const ML_API = process.env.ML_API_URL ?? 'http://localhost:8000';

export async function GET() {
  try {
    const res = await fetch(`${ML_API}/health`, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return NextResponse.json({ online: true, ...data });
  } catch {
    return NextResponse.json({ online: false, attrition_model: 'offline', leave_model: 'offline' });
  }
}
