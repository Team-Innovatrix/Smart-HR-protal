'use client'

import React, { createContext, useContext, useCallback, ReactNode } from 'react'
import { TimezoneService } from '../timezoneService'

const FIXED_TIMEZONE = 'Asia/Kolkata'

interface TimezoneContextType {
  timezone: string
  isLoading: boolean
  timezoneReady: boolean
  error: string | null
  setTimezone: (timezone: string) => void
  refreshTimezone: () => Promise<void>
  formatDate: (date: Date, format?: string) => string
  formatTime: (date: Date, format?: string) => string
  getToday: () => Date
  isToday: (date: Date) => boolean
  formatDateString: (dateString: string, format?: string) => string
  getTodayDateString: () => string
  isSameDay: (date1: Date, date2: Date) => boolean
  getDayBoundaries: (date: Date) => { start: Date; end: Date }
  formatTimeWithOffset: (date: Date, format?: string) => string
  parseDateString: (dateString: string) => Date
  safeFormatDate: (dateString: string, format?: string) => string
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined)

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const timezone = FIXED_TIMEZONE

  const setTimezone = useCallback((_tz: string) => {
    // IST only for now
  }, [])

  const refreshTimezone = useCallback(async () => {
    // IST only for now
  }, [])

  const formatDate = useCallback(
    (date: Date, fmt = 'PPP') => TimezoneService.formatInTimezone(date, timezone, fmt),
    [timezone]
  )

  const formatTime = useCallback(
    (date: Date, fmt = 'HH:mm:ss') => TimezoneService.formatInTimezone(date, timezone, fmt),
    [timezone]
  )

  const getToday = useCallback(() => TimezoneService.getTodayInTimezone(timezone), [timezone])

  const isToday = useCallback(
    (date: Date) => TimezoneService.isTodayInTimezone(date, timezone),
    [timezone]
  )

  const formatDateString = useCallback(
    (dateString: string, fmt = 'PPP') =>
      TimezoneService.formatDateStringInTimezone(dateString, timezone, fmt),
    [timezone]
  )

  const getTodayDateString = useCallback(
    () => TimezoneService.getTodayDateStringInTimezone(timezone),
    [timezone]
  )

  const isSameDay = useCallback(
    (date1: Date, date2: Date) => TimezoneService.isSameDayInTimezone(date1, date2, timezone),
    [timezone]
  )

  const getDayBoundaries = useCallback(
    (date: Date) => TimezoneService.getDayBoundariesInTimezone(date, timezone),
    [timezone]
  )

  const formatTimeWithOffset = useCallback(
    (date: Date, fmt = 'yyyy-MM-dd HH:mm:ss') =>
      TimezoneService.formatTimeWithOffset(date, timezone, fmt),
    [timezone]
  )

  const parseDateString = useCallback(
    (dateString: string) => TimezoneService.parseDateStringInTimezone(dateString, timezone),
    [timezone]
  )

  const safeFormatDate = useCallback(
    (dateString: string, fmt = 'PPP') => {
      try {
        if (!dateString || dateString === 'Invalid Date' || dateString === 'null' || dateString === 'undefined') {
          return 'Invalid Date'
        }
        const date = TimezoneService.parseDateStringInTimezone(dateString, timezone)
        return TimezoneService.formatInTimezone(date, timezone, fmt)
      } catch {
        return 'Invalid Date'
      }
    },
    [timezone]
  )

  const value: TimezoneContextType = {
    timezone,
    isLoading: false,
    timezoneReady: true,
    error: null,
    setTimezone,
    refreshTimezone,
    formatDate,
    formatTime,
    getToday,
    isToday,
    formatDateString,
    getTodayDateString,
    isSameDay,
    getDayBoundaries,
    formatTimeWithOffset,
    parseDateString,
    safeFormatDate,
  }

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  )
}

export function useTimezone() {
  const context = useContext(TimezoneContext)
  if (context === undefined) {
    // Return safe defaults instead of crashing — prevents TimezoneErrorBoundary from triggering
    const fallbackTz = 'Asia/Kolkata'
    const noop = () => {}
    const noopAsync = async () => {}
    return {
      timezone: fallbackTz,
      isLoading: false,
      timezoneReady: true,
      error: null,
      setTimezone: noop,
      refreshTimezone: noopAsync,
      formatDate: (date: Date) => date.toLocaleDateString(),
      formatTime: (date: Date) => date.toLocaleTimeString(),
      getToday: () => new Date(),
      isToday: (date: Date) => {
        const today = new Date()
        return date.toDateString() === today.toDateString()
      },
      formatDateString: (dateString: string) => {
        try { return new Date(dateString).toLocaleDateString() } catch { return 'Invalid Date' }
      },
      getTodayDateString: () => new Date().toISOString().split('T')[0],
      isSameDay: (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString(),
      getDayBoundaries: (date: Date) => {
        const start = new Date(date); start.setHours(0, 0, 0, 0)
        const end = new Date(date); end.setHours(23, 59, 59, 999)
        return { start, end }
      },
      formatTimeWithOffset: (date: Date) => date.toISOString(),
      parseDateString: (dateString: string) => new Date(dateString),
      safeFormatDate: (dateString: string) => {
        try { return new Date(dateString).toLocaleDateString() } catch { return 'Invalid Date' }
      },
    } as TimezoneContextType
  }
  return context
}

