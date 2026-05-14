import { NextRequest, NextResponse } from 'next/server'
import { getHolidaysForYear } from '@/data/indianHolidays'

/**
 * Read-only public holidays endpoint
 * Returns holiday dates from static Indian holidays data
 * Accepts optional query param `year` (single) or `years` (comma-separated)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const yearsParam = searchParams.get('years')
    const yearParam = searchParams.get('year')

    const years: number[] = []
    if (yearsParam) {
      yearsParam.split(',').forEach(y => {
        const n = parseInt(y.trim(), 10)
        if (!Number.isNaN(n)) years.push(n)
      })
    } else if (yearParam) {
      const n = parseInt(yearParam, 10)
      if (!Number.isNaN(n)) years.push(n)
    } else {
      const current = new Date().getFullYear()
      years.push(current, current + 1)
    }

    const result: Record<string, Array<{ name: string; date: string; type?: string }>> = {}
    for (const y of years) {
      const key = String(y)
      const list = getHolidaysForYear(y)
      result[key] = list.map(h => ({ name: h.name, date: h.date, type: h.type }))
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Public holidays fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch holidays' }, { status: 500 })
  }
}


