import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { getCareersJobModel } from '@/models/careers/Job'
import Script from 'next/script'
import Link from 'next/link'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

type Job = {
  _id: string
  title: string
  department: string
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship'
  experience: 'entry' | 'mid' | 'senior' | 'lead'
  description: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  salary: { min: number; max: number; currency: string }
  tags?: string[]
  company: string
  contactEmail: string
  postedDate: string
  deadline?: string
}

function coerceToString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function sanitizeQuery(q?: string): string | undefined {
  if (!q) return undefined
  const trimmed = q.trim()
  if (!trimmed) return undefined
  // basic sanitization – strip angle brackets and limit length
  return trimmed.replace(/[<>]/g, '').slice(0, 120)
}

function formatDateISO(date?: string): string | undefined {
  if (!date) return undefined
  const d = new Date(date)
  if (isNaN(d.getTime())) return undefined
  return d.toISOString()
}

function formatDisplayDate(date?: string): string | undefined {
  if (!date) return undefined
  const d = new Date(date)
  if (isNaN(d.getTime())) return undefined
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function buildJobPostingJSONLD(job: Job) {
  const baseUrl = 'https://portal.inovatrix.io/jobs'
  const url = `${baseUrl}#${job._id}`
  const employmentTypeMap: Record<Job['type'], string> = {
    'full-time': 'FULL_TIME',
    'part-time': 'PART_TIME',
    contract: 'CONTRACTOR',
    internship: 'INTERN',
  }

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: formatDateISO(job.postedDate),
    validThrough: formatDateISO(job.deadline),
    employmentType: employmentTypeMap[job.type],
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company || 'HR Dashboard',
      sameAs: 'https://portal.inovatrix.io',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
        addressCountry: 'IN',
      },
    },
    baseSalary: {
      '@type': 'MonetaryAmount',
      currency: job.salary?.currency || 'INR',
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salary?.min,
        maxValue: job.salary?.max,
        unitText: 'YEAR',
      },
    },
    identifier: {
      '@type': 'PropertyValue',
      name: job.company || 'HR Dashboard',
      value: job._id,
    },
    url,
  }

  if (job.tags?.some(t => /remote/i.test(t)) || /remote/i.test(job.location)) {
    ;(jsonLd as any).applicantLocationRequirements = {
      '@type': 'Country',
      name: 'Remote',
    }
    ;(jsonLd as any).jobLocationType = 'TELECOMMUTE'
  }

  return JSON.stringify(jsonLd)
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export const dynamic = 'force-dynamic'

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  // Resolve search params (async in Next 15)
  const sp = await searchParams

  const department = coerceToString(sp?.department)
  const location = coerceToString(sp?.location)
  const type = coerceToString(sp?.type) as Job['type'] | undefined
  const q = sanitizeQuery(coerceToString(sp?.q))

  let jobs: Job[] = []
  let error: string | null = null
  let allDepartments: string[] = []
  let allLocations: string[] = []

  try {
    const JobModel = await getCareersJobModel()

    const query: Record<string, unknown> = { isActive: true }
    if (department) query.department = department
    if (location) query.location = location
    if (type && ['full-time', 'part-time', 'contract', 'internship'].includes(type)) query.type = type
    if (q) query.$text = { $search: q }

    const [docs, departments, locations] = await Promise.all([
      JobModel.find(query)
        .select(
          'title department location type experience description requirements responsibilities benefits salary tags company postedDate deadline contactEmail'
        )
        .sort({ postedDate: -1 })
        .lean(),
      JobModel.distinct('department', { isActive: true }),
      JobModel.distinct('location', { isActive: true }),
    ])

    jobs = (docs as unknown as Job[]).map(d => ({
      ...d,
      _id: String((d as unknown as { _id: unknown })._id),
      postedDate: d.postedDate ? String(d.postedDate) : new Date().toISOString(),
      deadline: d.deadline ? String(d.deadline) : undefined,
    }))

    allDepartments = (departments as string[]).sort((a, b) => a.localeCompare(b))
    allLocations = (locations as string[]).sort((a, b) => a.localeCompare(b))
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load jobs'
  }

  const hasFilters = Boolean(department || location || type || q)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <main className="flex-1">
        <section className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header removed as requested */}

            {/* Filters */}
            <form className="mt-6" action="/portal/jobs" method="get">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <label htmlFor="q" className="block text-sm font-medium text-gray-700">Search</label>
                  <input
                    id="q"
                    type="text"
                    name="q"
                    defaultValue={q}
                    placeholder="Title, description, department"
                    className="mt-1 w-full h-11 rounded-lg border border-gray-300 px-3 bg-white focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-3">
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                  <select
                    id="department"
                    name="department"
                    defaultValue={department || ''}
                    className="mt-1 w-full h-11 rounded-lg border border-gray-300 px-3 bg-white focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">All departments</option>
                    {allDepartments.map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    id="type"
                    name="type"
                    defaultValue={type || ''}
                    className="mt-1 w-full h-11 rounded-lg border border-gray-300 px-3 bg-white focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                  <select
                    id="location"
                    name="location"
                    defaultValue={location || ''}
                    className="mt-1 w-full h-11 rounded-lg border border-gray-300 px-3 bg-white focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">All locations</option>
                    {allLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 flex items-end gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center h-11 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Apply filters
                  </button>
                  {hasFilters && (
                    <a
                      href="/portal/jobs"
                      aria-label="Clear filters"
                      title="Clear filters"
                      className="inline-flex items-center justify-center h-11 w-11 rounded-lg border border-gray-300 text-gray-600 bg-white hover:bg-gray-100"
                    >
                      <span className="text-xl leading-none">×</span>
                    </a>
                  )}
                </div>
              </div>
              
            </form>
          </div>
        </section>

        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
            )}

            {!error && jobs.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">No jobs found</h3>
                <p className="mt-2 text-gray-600">Try adjusting your filters or check back later.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map(job => (
                <article key={job._id} id={job._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1">{job.department}</span>
                          <span>•</span>
                          <span>{job.location}</span>
                          <span>•</span>
                          <span className="capitalize">{job.type.replace('-', ' ')}</span>
                          <span>•</span>
                          <span className="capitalize">{job.experience}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">Posted {formatDisplayDate(job.postedDate)}</div>
                      </div>
                      {job.salary?.min != null && job.salary?.max != null && (
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Salary</div>
                          <div className="font-semibold text-gray-900">
                            {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="mt-4 text-gray-700 line-clamp-3">{job.description}</p>

                    {job.tags && job.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {job.tags.slice(0, 5).map(tag => (
                          <span key={tag} className="inline-block text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-6 flex items-center justify-between">
                      <Link
                        href={`/apply/${job._id}`}
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        Apply
                      </Link>
                      {job.deadline && (
                        <div className="text-xs text-gray-500">Apply by {formatDisplayDate(job.deadline)}</div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* JSON-LD for SEO (one block per job) */}
      {jobs.map(job => (
        <Script
          key={`jsonld-${job._id}`}
          id={`jobposting-${job._id}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: buildJobPostingJSONLD(job) }}
        />
      ))}

      <Footer />
    </div>
  )
}


