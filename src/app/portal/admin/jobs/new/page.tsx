'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type FormState = {
  title: string
  department: string
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | ''
  experience: 'entry' | 'mid' | 'senior' | 'lead' | ''
  description: string
  requirements: string
  responsibilities: string
  benefits: string
  salaryMin: string
  salaryMax: string
  currency: string
  tags: string
  contactEmail: string
  postedDate: string
  deadline: string
  isActive: boolean
}

type Department = {
  _id: string
  name: string
}

export default function NewJobPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [companyName, setCompanyName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormState>({
    title: '',
    department: '',
    location: '',
    type: '',
    experience: '',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    salaryMin: '',
    salaryMax: '',
    currency: 'INR',
    tags: '',
    contactEmail: '',
    postedDate: '',
    deadline: '',
    isActive: true,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, settingsRes] = await Promise.all([
          fetch('/api/admin/orgstructure/departments'),
          fetch('/api/admin/settings')
        ])
        
        if (deptRes.ok) {
          const deptData = await deptRes.json()
          if (deptData.success) {
            setDepartments(deptData.data || [])
          }
        }
        
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          if (settingsData.success && settingsData.data?.general?.companyName) {
            setCompanyName(settingsData.data.general.companyName)
          }
        }
      } catch (err) {
        console.error('Failed to fetch departments or settings:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        title: form.title,
        department: form.department,
        location: form.location,
        type: form.type || 'full-time',
        experience: form.experience || 'entry',
        description: form.description,
        requirements: form.requirements,
        responsibilities: form.responsibilities,
        benefits: form.benefits,
        salary: { min: Number(form.salaryMin || 0), max: Number(form.salaryMax || 0), currency: form.currency || 'INR' },
        tags: form.tags,
        company: companyName || 'HR Dashboard',
        contactEmail: form.contactEmail,
        postedDate: form.postedDate ? new Date(form.postedDate).toISOString() : undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
        isActive: form.isActive,
      }

      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create job')
      router.push('/portal/admin/jobs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">New Job</h1>
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {error && <div className="lg:col-span-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input name="title" value={form.title} onChange={onChange} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select name="department" value={form.department} onChange={onChange} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" required disabled={loading}>
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input name="location" value={form.location} onChange={onChange} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select name="type" value={form.type} onChange={onChange} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" required>
                <option value="">Select</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Experience</label>
              <select name="experience" value={form.experience} onChange={onChange} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" required>
                <option value="">Select</option>
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select name="isActive" value={form.isActive ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" value={form.description} onChange={onChange} rows={6} className="mt-1 w-full rounded-md border border-gray-300 px-3 bg-white" required />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Requirements (one per line)</label>
              <textarea name="requirements" value={form.requirements} onChange={onChange} rows={6} className="mt-1 w-full rounded-md border border-gray-300 px-3 bg-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Responsibilities (one per line)</label>
              <textarea name="responsibilities" value={form.responsibilities} onChange={onChange} rows={6} className="mt-1 w-full rounded-md border border-gray-300 px-3 bg-white" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Benefits (one per line)</label>
            <textarea name="benefits" value={form.benefits} onChange={onChange} rows={4} className="mt-1 w-full rounded-md border border-gray-300 px-3 bg-white" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Salary Min</label>
              <input name="salaryMin" type="number" value={form.salaryMin} onChange={onChange} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Salary Max</label>
              <input name="salaryMax" type="number" value={form.salaryMax} onChange={onChange} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <input name="currency" value={form.currency} onChange={onChange} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Posted Date</label>
              <input name="postedDate" type="date" value={form.postedDate} onChange={onChange} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Deadline</label>
              <input name="deadline" type="date" value={form.deadline} onChange={onChange} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tags (comma or newline)</label>
              <textarea name="tags" value={form.tags} onChange={onChange} rows={2} className="mt-1 w-full rounded-md border border-gray-300 px-3 bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Email</label>
            <input name="contactEmail" type="email" value={form.contactEmail} onChange={onChange} className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 bg-white" required />
          </div>
        </div>

        <div className="lg:col-span-2 flex items-center gap-3">
          <button type="submit" disabled={submitting} className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60">
            {submitting ? 'Creating...' : 'Create job'}
          </button>
          <button type="button" onClick={() => router.push('/portal/admin/jobs')} className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100">Cancel</button>
        </div>
      </form>
    </div>
  )
}

