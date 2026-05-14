import { NextRequest, NextResponse } from 'next/server'
import {
  analyzeMonthRisk,
  getMonthSummary,
  generateAIInsights,
  getAnnualRiskHeatmap,
} from '@/lib/leavePredictionEngine'

/**
 * AI-Powered Leave Prediction & Holiday Risk Analysis API
 *
 * Query params:
 *   - year: number (default: current year)
 *   - month: number 0-11 (default: current month)
 *   - mode: 'calendar' | 'summary' | 'insights' | 'annual' (default: 'calendar')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const now = new Date()
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10)
    const month = parseInt(searchParams.get('month') || String(now.getMonth()), 10)
    const mode = searchParams.get('mode') || 'calendar'

    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
      return NextResponse.json(
        { success: false, error: 'Invalid year or month parameter' },
        { status: 400 }
      )
    }

    switch (mode) {
      case 'calendar': {
        const assessments = analyzeMonthRisk(year, month)
        return NextResponse.json({ success: true, data: assessments })
      }
      case 'summary': {
        const summary = getMonthSummary(year, month)
        return NextResponse.json({ success: true, data: summary })
      }
      case 'insights': {
        const insights = generateAIInsights(year, month)
        return NextResponse.json({ success: true, data: insights })
      }
      case 'annual': {
        const heatmap = getAnnualRiskHeatmap(year)
        return NextResponse.json({ success: true, data: heatmap })
      }
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid mode. Use: calendar, summary, insights, or annual' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Leave prediction API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
