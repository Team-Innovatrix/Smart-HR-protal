'use client'

import { useState, useEffect } from 'react'
import {
  SparklesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ShieldExclamationIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'

interface MonthSummary {
  month: number
  year: number
  monthName: string
  totalWorkingDays: number
  highRiskDays: number
  criticalRiskDays: number
  avgRiskScore: number
  aiSummary: string
}

export default function LeaveRiskDashboard() {
  const [annualData, setAnnualData] = useState<MonthSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const fetchAnnual = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/leave-prediction?year=${selectedYear}&mode=annual`)
        const data = await res.json()
        if (data.success) setAnnualData(data.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchAnnual()
  }, [selectedYear])

  const totalHighRisk = annualData.reduce((s, m) => s + m.highRiskDays, 0)
  const totalCritical = annualData.reduce((s, m) => s + m.criticalRiskDays, 0)
  const avgScore = annualData.length ? Math.round(annualData.reduce((s, m) => s + m.avgRiskScore, 0) / annualData.length) : 0
  const totalWorkingDays = annualData.reduce((s, m) => s + m.totalWorkingDays, 0)

  const getBarColor = (score: number) => {
    if (score >= 40) return 'bg-gradient-to-t from-red-500 to-orange-400'
    if (score >= 25) return 'bg-gradient-to-t from-orange-500 to-yellow-400'
    if (score >= 15) return 'bg-gradient-to-t from-yellow-500 to-yellow-300'
    return 'bg-gradient-to-t from-green-500 to-emerald-400'
  }

  if (loading) {
    return (
      <div className="glass-strong p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto mb-3">
              <div className="absolute inset-0 rounded-full border-2 border-[var(--glass-border)]" />
              <div className="absolute inset-0 rounded-full border-2 border-t-orange-400 animate-spin" />
            </div>
            <p className="text-orange-400 text-sm font-medium">Loading Risk Analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/*  Annual Overview Cards  */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Working Days', value: totalWorkingDays, icon: CalendarDaysIcon, color: 'text-blue-400', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
          { label: 'High Risk Days', value: totalHighRisk, icon: ExclamationTriangleIcon, color: 'text-orange-400', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' },
          { label: 'Critical Days', value: totalCritical, icon: ShieldExclamationIcon, color: 'text-red-400', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
          { label: 'Avg Risk Score', value: `${avgScore}%`, icon: ArrowTrendingUpIcon, color: 'text-yellow-400', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)' },
        ].map(card => (
          <div key={card.label} className="glass p-4 rounded-xl group hover:scale-[1.02] transition-all duration-300" style={{ background: card.bg, border: `1px solid ${card.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <BoltIcon className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/*  Annual Heatmap Bar Chart  */}
      <div className="glass-strong p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Annual Risk Heatmap</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedYear(y => y - 1)} className="px-2 py-1 text-xs rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)] transition-all"></button>
            <span className="text-sm font-semibold text-[var(--text-primary)]">{selectedYear}</span>
            <button onClick={() => setSelectedYear(y => y + 1)} className="px-2 py-1 text-xs rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)] transition-all"></button>
          </div>
        </div>

        <div className="flex items-end gap-2 h-40 mb-2">
          {annualData.map((m, i) => {
            const height = Math.max(8, (m.avgRiskScore / 100) * 100) // Normalized to 100 max instead of 60
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer">
                <div className="relative w-full flex justify-center mb-1">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-1 rounded-lg text-[9px] font-medium text-[var(--text-primary)] whitespace-nowrap z-10" style={{ background: 'rgba(22,22,42,0.9)', border: '1px solid var(--glass-border)' }}>
                    {m.avgRiskScore}% avg  {m.highRiskDays}H  {m.criticalRiskDays}C
                  </div>
                </div>
                <div className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 group-hover:opacity-80 ${getBarColor(m.avgRiskScore)}`} style={{ height: `${height}%`, minHeight: '8px' }} />
              </div>
            )
          })}
        </div>
        <div className="flex gap-2">
          {annualData.map((m, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-[9px] text-[var(--text-muted)]">{m.monthName.substring(0, 3)}</span>
            </div>
          ))}
        </div>
      </div>

      {/*  Monthly Risk Breakdown  */}
      <div className="glass-strong p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="w-5 h-5 text-orange-400" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Monthly AI Summaries</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {annualData.filter(m => m.highRiskDays > 0 || m.criticalRiskDays > 0).map(m => (
            <div key={m.month} className="glass p-3 rounded-xl hover:scale-[1.01] transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-primary)]">{m.monthName} {m.year}</span>
                <div className="flex items-center gap-2">
                  {m.criticalRiskDays > 0 && <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-500/20 text-red-400">{m.criticalRiskDays} critical</span>}
                  {m.highRiskDays > 0 && <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-orange-500/20 text-orange-400">{m.highRiskDays} high</span>}
                </div>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{m.aiSummary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
