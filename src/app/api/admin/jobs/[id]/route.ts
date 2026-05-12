import { NextRequest, NextResponse } from 'next/server'
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import { getCareersJobModel } from '@/models/careers/Job'
import { jobUpdateSchema } from '@/lib/validation/job'
import { SettingsService } from '@/lib/settingsService'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const Job = await getCareersJobModel()
  try {
    const doc = await Job.findById(id).lean()
    if (!doc) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    const data = { ...doc, _id: String(doc._id), postedDate: doc.postedDate ? String(doc.postedDate) : undefined, deadline: doc.deadline ? String(doc.deadline) : undefined }
    return NextResponse.json({ success: true, data })
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Failed to fetch' }, { status: 400 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isAdminSessionValid(req)) return NextResponse.json({ error: 'Access denied.' }, { status: 403 })

  try {
    const payload = await req.json()
    const coerceList = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean)
      if (typeof v === 'string') return v.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean)
      return []
    }
    const input = jobUpdateSchema.parse({
      ...payload,
      requirements: payload.requirements !== undefined ? coerceList(payload.requirements) : undefined,
      responsibilities: payload.responsibilities !== undefined ? coerceList(payload.responsibilities) : undefined,
      benefits: payload.benefits !== undefined ? coerceList(payload.benefits) : undefined,
      tags: payload.tags !== undefined ? coerceList(payload.tags) : undefined,
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
    const updated = await Job.findByIdAndUpdate(
      id,
      {
        ...input,
        company: companyName,
        ...(input.postedDate ? { postedDate: new Date(input.postedDate) } : {}),
        ...(input.deadline ? { deadline: new Date(input.deadline) } : {}),
      },
      { new: true }
    )
    if (!updated) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update job'
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isAdminSessionValid(req)) return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
  const Job = await getCareersJobModel()
  try {
    await Job.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 400 })
  }
}


