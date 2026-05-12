import { NextRequest, NextResponse } from 'next/server'
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import { getCareersJobModel } from '@/models/careers/Job'
import { jobCreateSchema } from '@/lib/validation/job'
import { SettingsService } from '@/lib/settingsService'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!isAdminSessionValid(req)) return NextResponse.json({ error: 'Access denied.' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10) || 20, 1), 100)
  const q = searchParams.get('q') || undefined
  const department = searchParams.get('department') || undefined
  const type = searchParams.get('type') || undefined
  const location = searchParams.get('location') || undefined
  const isActiveStr = searchParams.get('isActive') || undefined
  const isActive = isActiveStr === 'true' ? true : isActiveStr === 'false' ? false : undefined

  const Job = await getCareersJobModel()
  const query: Record<string, unknown> = {}
  if (q) query.$text = { $search: q }
  if (department) query.department = department
  if (type) query.type = type
  if (location) query.location = location
  if (typeof isActive === 'boolean') query.isActive = isActive

  const [items, total] = await Promise.all([
    Job.find(query)
      .select('title department location type experience isActive postedDate createdAt updatedAt')
      .sort({ postedDate: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Job.countDocuments(query),
  ])

  const data = (items as any[]).map(d => ({
    ...d,
    _id: String(d._id),
    postedDate: d.postedDate ? String(d.postedDate) : undefined,
    createdAt: d.createdAt ? String(d.createdAt) : undefined,
    updatedAt: d.updatedAt ? String(d.updatedAt) : undefined,
  }))

  return NextResponse.json({ success: true, data, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  if (!isAdminSessionValid(req)) return NextResponse.json({ error: 'Access denied.' }, { status: 403 })

  try {
    const payload = await req.json()

    // Normalize list fields when receiving textarea/comma-separated strings
    const coerceList = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean)
      if (typeof v === 'string') return v.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean)
      return []
    }

    const input = jobCreateSchema.parse({
      ...payload,
      requirements: coerceList(payload.requirements),
      responsibilities: coerceList(payload.responsibilities),
      benefits: coerceList(payload.benefits),
      tags: coerceList(payload.tags),
    })

    // Get company name from system settings if not provided
    let companyName = input.company
    if (!companyName) {
      try {
        const companyInfo = await SettingsService.getCompanyInfo()
        companyName = companyInfo.name || 'HR Dashboard'
      } catch (err) {
        console.error('Failed to fetch company name from settings:', err)
        companyName = 'HR Dashboard'
      }
    }

    const Job = await getCareersJobModel()
    const created = await Job.create({
      ...input,
      company: companyName,
      postedDate: input.postedDate ? new Date(input.postedDate) : new Date(),
      deadline: input.deadline ? new Date(input.deadline) : undefined,
    })

    return NextResponse.json({ success: true, data: { _id: String(created._id) } }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create job'
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
}


