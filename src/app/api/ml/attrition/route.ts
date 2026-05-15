/**
 * src/app/api/ml/attrition/route.ts
 * 
 * Next.js API Route    POST /api/ml/attrition
 *
 * Purpose:
 *   Acts as a proxy between the Next.js frontend and the Python FastAPI ML
 *   service. Receives a batch of employee feature objects, forwards them to
 *   the XGBoost attrition model, and returns predictions with SHAP values.
 *
 * Request body:
 *   { employees: EmployeeFeatures[] }   (array of 14-feature objects per employee)
 *
 * Response (success):
 *   { success: true, predictions: PredictionResult[], source: "xgboost" }
 *
 * Response (failure / ML offline):
 *   { success: false, fallback: true, error: string }   (HTTP 503)
 *    Frontend will silently fall back to computeRisk() in hrAIEngine.ts
 *
 * Timeout: 60 seconds (handles Render free-tier cold-start delay)
 *
 * Environment variable:
 *   ML_API_URL   defaults to "http://localhost:8000" if not set
 *                 (set this to your Render.com URL in production)
 *
 * FastAPI target: POST http://<ML_API_URL>/predict/attrition/batch
 * 
 */
import { NextRequest, NextResponse } from 'next/server';

const ML_API = process.env.ML_API_URL ?? 'http://localhost:8000';

/**
 * POST /api/ml/attrition
 * Body: { employees: EmployeeFeatures[] }
 * Calls Python FastAPI  /predict/attrition/batch
 * Falls back to null (frontend uses rule-based computeRisk if this fails)
 */
export async function POST(req: NextRequest) {
  try {
    const { employees } = await req.json();
    if (!employees?.length) {
      return NextResponse.json({ error: 'No employees provided' }, { status: 400 });
    }

    const mlRes = await fetch(`${ML_API}/predict/attrition/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employees),
      // Timeout  Render free tier cold-start can be slow
      signal: AbortSignal.timeout(60000),
    });

    if (!mlRes.ok) {
      const err = await mlRes.text();
      return NextResponse.json({ error: `ML API error: ${err}` }, { status: mlRes.status });
    }

    const predictions = await mlRes.json();
    return NextResponse.json({ success: true, predictions, source: 'xgboost' });

  } catch (err: any) {
    // Service sleeping (Render cold start) or not yet deployed
    const msg = err?.message ?? 'ML API unavailable';
    return NextResponse.json(
      { success: false, error: msg, fallback: true },
      { status: 503 }
    );
  }
}
