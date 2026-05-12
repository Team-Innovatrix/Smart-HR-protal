import { NextRequest, NextResponse } from 'next/server'
import { isAdminSessionValid } from '@/lib/adminCookieAuth';
import { getCareersJobModel } from '@/models/careers/Job'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!await isAdminSessionValid(req)) return NextResponse.json({ error: 'Access denied.' }, { status: 403 })

  try {
    const { action, ids } = await req.json() as { action: 'activate' | 'deactivate' | 'delete', ids: string[] }
    if (!Array.isArray(ids) || ids.length === 0) throw new Error('No ids provided')
    const Job = await getCareersJobModel()
    if (action === 'activate') {
      await Job.updateMany({ _id: { $in: ids } }, { $set: { isActive: true } })
    } else if (action === 'deactivate') {
      await Job.updateMany({ _id: { $in: ids } }, { $set: { isActive: false } })
    } else if (action === 'delete') {
      await Job.deleteMany({ _id: { $in: ids } })
    } else {
      throw new Error('Invalid action')
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Bulk action failed'
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
}




