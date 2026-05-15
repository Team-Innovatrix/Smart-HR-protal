'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface DateRisk {
  date: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number
  isHoliday: boolean
  isWeekend: boolean
  holidayName?: string
  holidayType?: string
  reasons: string[]
  patterns: Array<{ type: string; description: string; confidence: number; historicalFrequency?: number }>
  absenteeismProbability: number
  aiInsight?: string
  recommendations?: string[]
}

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

interface AIInsight {
  id: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  affectedDates: string[]
  recommendation: string
  confidence: number
  category: string
}

export default function SmartRiskCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [riskData, setRiskData] = useState<DateRisk[]>([])
  const [summary, setSummary] = useState<MonthSummary | null>(null)
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<DateRisk | null>(null)
  const [showInsights, setShowInsights] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    try {
      const [calRes, sumRes, insRes] = await Promise.all([
        fetch(`/api/leave-prediction?year=${year}&month=${month}&mode=calendar`),
        fetch(`/api/leave-prediction?year=${year}&month=${month}&mode=summary`),
        fetch(`/api/leave-prediction?year=${year}&month=${month}&mode=insights`),
      ])
      const [calData, sumData, insData] = await Promise.all([calRes.json(), sumRes.json(), insRes.json()])
      if (calData.success) setRiskData(calData.data)
      if (sumData.success) setSummary(sumData.data)
      if (insData.success) setInsights(insData.data)
    } catch (e) { console.error('Failed to fetch prediction data:', e) }
    finally { setLoading(false) }
  }, [currentDate])

  useEffect(() => { fetchData() }, [fetchData])

  const navigateMonth = (dir: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + (dir === 'prev' ? -1 : 1))
      return d
    })
    setSelectedDate(null)
  }

  const goToToday = () => { setCurrentDate(new Date()); setSelectedDate(null) }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    return { daysInMonth: lastDay.getDate(), startingDay: (firstDay.getDay() + 6) % 7 }
  }

  const getRiskForDate = (day: number): DateRisk | undefined => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return riskData.find(r => r.date === dateStr)
  }

  const getCellColor = (risk?: DateRisk) => {
    if (!risk) return 'bg-[rgba(255,255,255,0.02)]'
    if (risk.isHoliday) return 'bg-[rgba(239,68,68,0.15)] border-red-500/30'
    if (risk.isWeekend) return 'bg-[rgba(255,255,255,0.02)] opacity-50'
    switch (risk.riskLevel) {
      case 'critical': return 'bg-[rgba(249,115,22,0.2)] border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.1)]'
      case 'high': return 'bg-[rgba(249,115,22,0.12)] border-orange-400/30'
      case 'medium': return 'bg-[rgba(234,179,8,0.12)] border-yellow-500/30'
      default: return 'bg-[rgba(34,197,94,0.08)] border-green-500/20'
    }
  }

  const getDotColor = (risk?: DateRisk) => {
    if (!risk) return 'bg-gray-600'
    if (risk.isHoliday) return 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
    if (risk.isWeekend) return 'bg-gray-600'
    switch (risk.riskLevel) {
      case 'critical': return 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)] animate-pulse'
      case 'high': return 'bg-orange-400 shadow-[0_0_4px_rgba(249,115,22,0.4)]'
      case 'medium': return 'bg-yellow-400 shadow-[0_0_4px_rgba(234,179,8,0.4)]'
      default: return 'bg-green-400'
    }
  }

  const getTextColor = (risk?: DateRisk) => {
    if (!risk) return 'text-[var(--text-muted)]'
    if (risk.isHoliday) return 'text-red-400 font-bold'
    if (risk.isWeekend) return 'text-[var(--text-muted)]'
    switch (risk.riskLevel) {
      case 'critical': return 'text-orange-400 font-bold'
      case 'high': return 'text-orange-300 font-semibold'
      case 'medium': return 'text-yellow-300 font-medium'
      default: return 'text-green-300'
    }
  }

  const isToday = (day: number) => {
    const now = new Date()
    return day === now.getDate() && currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear()
  }

  const monthYear = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="glass-strong p-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-[var(--glass-border)]" />
              <div className="absolute inset-0 rounded-full border-2 border-t-[var(--accent)] animate-spin" />
              <SparklesIcon className="absolute inset-3 w-10 h-10 text-[var(--accent)] animate-pulse" />
            </div>
            <p className="text-[var(--accent)] text-sm font-medium">AI Analyzing Leave Patterns...</p>
            <p className="text-[var(--text-muted)] text-xs mt-1">Scanning holidays, bridge patterns & risk factors</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/*  Header with Summary Stats  */}
      <div className="glass-strong p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(234,179,8,0.15))', border: '1px solid rgba(249,115,22,0.3)' }}>
              <SparklesIcon className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Smart Risk Calendar</h2>
              <p className="text-xs text-[var(--text-muted)]">AI-powered absenteeism prediction</p>
            </div>
          </div>
          {/* Month nav */}
          <div className="flex items-center gap-2">
            <button onClick={() => navigateMonth('prev')} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)] transition-all"><ChevronLeftIcon className="h-5 w-5" /></button>
            <span className="text-sm font-semibold text-[var(--text-primary)] min-w-[160px] text-center">{monthYear}</span>
            <button onClick={() => navigateMonth('next')} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)] transition-all"><ChevronRightIcon className="h-5 w-5" /></button>
            <button onClick={goToToday} className="ml-2 px-3 py-1.5 text-xs text-[var(--accent)] hover:bg-[rgba(52,211,153,0.08)] rounded-lg transition-all">Today</button>
          </div>
        </div>

        {/* Quick stats */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="glass p-3 rounded-xl text-center"><p className="text-2xl font-bold text-[var(--text-primary)]">{summary.totalWorkingDays}</p><p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Working Days</p></div>
            <div className="glass p-3 rounded-xl text-center"><p className="text-2xl font-bold text-red-400">{summary.criticalRiskDays}</p><p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Critical Risk</p></div>
            <div className="glass p-3 rounded-xl text-center"><p className="text-2xl font-bold text-orange-400">{summary.highRiskDays}</p><p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">High Risk</p></div>
            <div className="glass p-3 rounded-xl text-center"><p className="text-2xl font-bold text-yellow-400">{summary.avgRiskScore}%</p><p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Avg Risk</p></div>
          </div>
        )}

        {/* AI Summary */}
        {summary && (
          <div className="mt-4 p-3 rounded-xl flex items-start gap-3" style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)' }}>
            <SparklesIcon className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange-200/80 leading-relaxed">{summary.aiSummary}</p>
          </div>
        )}
      </div>

      {/*  Calendar Grid  */}
      <div className="glass-strong p-4 sm:p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="p-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{day}</div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: getDaysInMonth().startingDay }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2 min-h-[72px]" />
          ))}
          {Array.from({ length: getDaysInMonth().daysInMonth }).map((_, i) => {
            const day = i + 1
            const risk = getRiskForDate(day)
            const today = isToday(day)
            return (
              <button
                key={day}
                onClick={() => risk && setSelectedDate(risk)}
                className={`relative p-2 min-h-[72px] rounded-xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer group ${getCellColor(risk)} ${today ? 'ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg-base)]' : 'border-transparent'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${getTextColor(risk)}`}>{day}</span>
                  <div className={`w-2 h-2 rounded-full ${getDotColor(risk)}`} />
                </div>
                {risk?.isHoliday && (
                  <p className="text-[8px] text-red-400 truncate leading-tight mt-0.5" title={risk.holidayName}>{risk.holidayName}</p>
                )}
                {!risk?.isHoliday && !risk?.isWeekend && risk && risk.riskScore > 20 && (
                  <p className="text-[8px] text-[var(--text-muted)] leading-tight mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">{risk.absenteeismProbability}% risk</p>
                )}
                {today && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-[var(--glass-border)]">
          {[
            { color: 'bg-green-400', label: 'Low Risk' },
            { color: 'bg-yellow-400', label: 'Medium Risk' },
            { color: 'bg-orange-400', label: 'High/Critical Risk' },
            { color: 'bg-red-500', label: 'Holiday' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="text-[10px] text-[var(--text-muted)]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/*  AI Insights Panel  */}
      {insights.length > 0 && showInsights && (
        <div className="glass-strong p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-400" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">AI Insights & Alerts</h3>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-orange-500/20 text-orange-400 font-medium">{insights.length}</span>
            </div>
            <button onClick={() => setShowInsights(false)} className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-[var(--text-muted)]"><XMarkIcon className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            {insights.map(insight => (
              <div key={insight.id} className="p-3 rounded-xl transition-all duration-200 hover:scale-[1.01]" style={{
                background: insight.severity === 'critical' ? 'rgba(239,68,68,0.08)' : insight.severity === 'warning' ? 'rgba(249,115,22,0.06)' : 'rgba(96,165,250,0.06)',
                border: `1px solid ${insight.severity === 'critical' ? 'rgba(239,68,68,0.2)' : insight.severity === 'warning' ? 'rgba(249,115,22,0.15)' : 'rgba(96,165,250,0.15)'}`,
              }}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${insight.severity === 'critical' ? 'bg-red-500/20' : insight.severity === 'warning' ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
                    {insight.severity === 'critical' ? <ExclamationTriangleIcon className="w-3.5 h-3.5 text-red-400" /> : <InformationCircleIcon className="w-3.5 h-3.5 text-orange-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xs font-semibold text-[var(--text-primary)]">{insight.title}</h4>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[var(--text-muted)]">{insight.confidence}% confidence</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{insight.description}</p>
                    <p className="text-[10px] text-[var(--accent)] mt-1.5 flex items-center gap-1"><SparklesIcon className="w-3 h-3" />{insight.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*  Date Detail Modal  */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDate(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()} style={{ background: 'rgba(22,22,42,0.95)', backdropFilter: 'blur(40px)', border: '1px solid var(--glass-border-hover)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-float)' }}>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getDotColor(selectedDate)}`} />
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      {new Date(selectedDate.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h3>
                    {selectedDate.isHoliday && <p className="text-xs text-red-400 font-medium">{selectedDate.holidayName} ({selectedDate.holidayType})</p>}
                  </div>
                </div>
                <button onClick={() => setSelectedDate(null)} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-[var(--text-muted)]"><XMarkIcon className="w-5 h-5" /></button>
              </div>

              {/* Risk Score */}
              {!selectedDate.isHoliday && !selectedDate.isWeekend && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="glass p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold" style={{ color: selectedDate.riskLevel === 'critical' ? '#f97316' : selectedDate.riskLevel === 'high' ? '#fb923c' : selectedDate.riskLevel === 'medium' ? '#eab308' : '#22c55e' }}>{selectedDate.riskScore}</p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">Risk Score</p>
                  </div>
                  <div className="glass p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{selectedDate.absenteeismProbability}%</p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">Absenteeism Prob.</p>
                  </div>
                </div>
              )}

              {/* AI Insight */}
              {selectedDate.aiInsight && (
                <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)' }}>
                  <div className="flex items-start gap-2">
                    <SparklesIcon className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-orange-200/80 leading-relaxed">{selectedDate.aiInsight}</p>
                  </div>
                </div>
              )}

              {/* Detected Patterns */}
              {selectedDate.patterns.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Detected Patterns</h4>
                  <div className="space-y-2">
                    {selectedDate.patterns.map((p, i) => (
                      <div key={i} className="glass p-2.5 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-medium text-[var(--accent)] uppercase">{p.type.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{p.confidence}% confidence</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{p.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedDate.recommendations && selectedDate.recommendations.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">HR Recommendations</h4>
                  <ul className="space-y-1.5">
                    {selectedDate.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-[var(--text-secondary)]">
                        <span className="text-[var(--accent)] mt-0.5"></span>{rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
