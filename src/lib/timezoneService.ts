/**
 * Centralized Timezone Service
 * Provides all timezone-related utilities and functions
 */

import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz'
import { format, parseISO, startOfDay, addDays, isSameDay } from 'date-fns'
import { logger } from './logger'

export class TimezoneService {

  /**
   * Check if a timezone is valid IANA timezone
   */
  static isValidTimezone(timezone: string): boolean {
    if (!timezone || typeof timezone !== 'string') return false
    
    // Check if it's UTC
    if (timezone === 'UTC') return true
    
    // Check basic IANA timezone format: Region/City
    if (!/^[A-Za-z_]+\/[A-Za-z_]+$/.test(timezone)) return false
    
    // Try to create a date in the timezone to validate it
    try {
      const testDate = new Date()
      formatInTimeZone(testDate, timezone, 'yyyy-MM-dd HH:mm:ss')
      return true
    } catch {
      return false
    }
  }

  /**
   * Get today's date in the specified timezone
   */
  static getTodayInTimezone(timezone: string): Date {
    const now = new Date()
    
    // Get the current time in the user's timezone using Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    
    const parts = formatter.formatToParts(now)
    
    const year = parseInt(parts.find(part => part.type === 'year')?.value || '0')
    const month = parseInt(parts.find(part => part.type === 'month')?.value || '0') - 1
    const day = parseInt(parts.find(part => part.type === 'day')?.value || '0')
    const hour = parseInt(parts.find(part => part.type === 'hour')?.value || '0')
    const minute = parseInt(parts.find(part => part.type === 'minute')?.value || '0')
    const second = parseInt(parts.find(part => part.type === 'second')?.value || '0')
    
    // Create the date in the target timezone using fromZonedTime
    // This creates a UTC date that represents the local time in the target timezone
    const resultDate = fromZonedTime(new Date(year, month, day, hour, minute, second), timezone)
    
    return resultDate
  }

  /**
   * Format a date in the specified timezone
   */
  static formatInTimezone(date: Date, timezone: string, formatString: string): string {

    try {
      // Validate the date first
      if (isNaN(date.getTime())) {
        logger.error('Invalid date passed', { date: date.toString() })
        return 'Invalid Date'
      }
      
      // Validate the timezone — default to IST if missing
      if (!timezone || typeof timezone !== 'string') {
        logger.error('Invalid timezone passed, defaulting to Asia/Kolkata', { timezone })
        timezone = 'Asia/Kolkata'
      }
      
      const result = formatInTimeZone(date, timezone, formatString)
      
      
      return result
    } catch (error) {
      logger.error('Error formatting date in timezone', { 
        date: date.toISOString(), 
        timezone, 
        formatString, 
        error: error instanceof Error ? error.message : String(error)
      })
      
      // Fallback to IST (Asia/Kolkata) formatting if timezone conversion fails
      try {
        const fallbackResult = formatInTimeZone(date, 'Asia/Kolkata', formatString)
        return fallbackResult
      } catch (fallbackError) {
        logger.error('Fallback formatting also failed', {
          inputDate: date.toISOString(),
          formatString,
          fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        })
        return 'Invalid Date'
      }
    }
  }

  /**
   * Check if a date is today in the specified timezone
   */
  static isTodayInTimezone(date: Date, timezone: string): boolean {
    const today = this.getTodayInTimezone(timezone)
    return isSameDay(date, today)
  }

  /**
   * Parse a date string in the specified timezone
   * Handles various date formats consistently
   */
  static parseDateStringInTimezone(dateString: string, timezone: string): Date {
    try {
      if (!dateString || dateString === 'Invalid Date' || dateString === 'null' || dateString === 'undefined') {
        throw new Error('Invalid date string')
      }

      let date: Date
      
      if (dateString.includes('T')) {
        // ISO string - parse directly
        date = new Date(dateString)
      } else if (dateString.includes('-') && dateString.split('-').length === 3) {
        // YYYY-MM-DD format - parse as date in timezone using date-fns-tz
        const [year, month, day] = dateString.split('-').map(Number)
        // Create date in the specified timezone
        date = fromZonedTime(new Date(year, month - 1, day), timezone)
      } else {
        // Try parsing as is
        date = new Date(dateString)
      }
      
      // Validate the date
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date string')
      }
      
      return date
    } catch (error) {
      console.error('Error parsing date string in timezone:', error)
      throw error
    }
  }

  /**
   * Format a date string (YYYY-MM-DD) in the specified timezone
   */
  static formatDateStringInTimezone(dateString: string, timezone: string, formatString: string = 'PPP'): string {
    try {
      const date = this.parseDateStringInTimezone(dateString, timezone)
      return this.formatInTimezone(date, timezone, formatString)
    } catch (error) {
      console.error('Error formatting date string in timezone:', error)
      return 'Invalid Date'
    }
  }

  /**
   * Get today's date string (YYYY-MM-DD) in the specified timezone
   */
  static getTodayDateStringInTimezone(timezone: string): string {
    const today = this.getTodayInTimezone(timezone)
    return this.formatInTimezone(today, timezone, 'yyyy-MM-dd')
  }

  /**
   * Check if two dates are on the same day in the specified timezone
   */
  static isSameDayInTimezone(date1: Date, date2: Date, timezone: string): boolean {
    const local1 = toZonedTime(date1, timezone)
    const local2 = toZonedTime(date2, timezone)
    return local1.getFullYear() === local2.getFullYear() &&
           local1.getMonth() === local2.getMonth() &&
           local1.getDate() === local2.getDate()
  }

  /**
   * Get start and end of day in the specified timezone
   */
  static getDayBoundariesInTimezone(date: Date, timezone: string): { start: Date, end: Date } {
    const localDate = toZonedTime(date, timezone)
    const year = localDate.getFullYear()
    const month = localDate.getMonth()
    const day = localDate.getDate()
    
    // Create start and end of day in the target timezone using fromZonedTime
    const start = fromZonedTime(new Date(year, month, day, 0, 0, 0, 0), timezone)
    const end = fromZonedTime(new Date(year, month, day, 23, 59, 59, 999), timezone)
    return { start, end }
  }

  /**
   * Format time with timezone offset (e.g., 2025-09-09 08:47:25+05:30)
   */
  static formatTimeWithOffset(date: Date, timezone: string, formatString: string = 'yyyy-MM-dd HH:mm:ss'): string {
    try {
      // Get the time in the specified timezone
      const localTime = toZonedTime(date, timezone)
      
      // Get timezone offset
      const offset = this.getTimezoneOffset(timezone, date)
      const offsetHours = Math.floor(Math.abs(offset) / (1000 * 60 * 60))
      const offsetMinutes = Math.floor((Math.abs(offset) % (1000 * 60 * 60)) / (1000 * 60))
      const offsetSign = offset >= 0 ? '+' : '-'
      const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`
      
      // Format the time
      const timeString = this.formatInTimezone(date, timezone, formatString)
      
      return `${timeString}${offsetString}`
    } catch (error) {
      console.error('Error formatting time with offset:', error)
      // Fallback to UTC if timezone conversion fails
      return date.toISOString().replace('T', ' ').replace('Z', '+00:00')
    }
  }

  /**
   * Get timezone offset for a specific date
   */
  static getTimezoneOffset(timezone: string, date: Date): number {
    try {
      const localDate = toZonedTime(date, timezone)
      const utcDate = fromZonedTime(localDate, timezone)
      return localDate.getTime() - utcDate.getTime()
    } catch {
      return 0
    }
  }

  /**
   * Convert a date from UTC to the specified timezone
   */
  static fromUTCToTimezone(utcDate: Date, timezone: string): Date {
    return toZonedTime(utcDate, timezone)
  }

  /**
   * Convert a date from the specified timezone to UTC
   */
  static fromTimezoneToUTC(localDate: Date, timezone: string): Date {
    return fromZonedTime(localDate, timezone)
  }

  /**
   * Get all possible UTC date ranges that could contain records
   * for a given timezone day. This handles cases where a timezone day
   * spans multiple UTC days.
   */
  static getPossibleUTCDateRangesForTimezoneDay(
    timezoneDate: Date, 
    timezone: string
  ): Array<{ start: Date, end: Date, utcDate: Date }> {
    // Get the start and end of the day in the timezone
    const { start: dayStart, end: dayEnd } = this.getDayBoundariesInTimezone(timezoneDate, timezone)
    
    // Convert timezone day boundaries to UTC
    const utcDayStart = fromZonedTime(dayStart, timezone)
    const utcDayEnd = fromZonedTime(dayEnd, timezone)
    
    // Get the UTC dates that this timezone day spans
    const utcStartDate = new Date(Date.UTC(utcDayStart.getUTCFullYear(), utcDayStart.getUTCMonth(), utcDayStart.getUTCDate()))
    const utcEndDate = new Date(Date.UTC(utcDayEnd.getUTCFullYear(), utcDayEnd.getUTCMonth(), utcDayEnd.getUTCDate()))
    
    const ranges: Array<{ start: Date, end: Date, utcDate: Date }> = []
    
    // If the timezone day spans multiple UTC days, we need to check all of them
    if (utcStartDate.getTime() !== utcEndDate.getTime()) {
      // Add range for the start UTC date
      ranges.push({
        start: utcStartDate,
        end: new Date(utcStartDate.getTime() + 24 * 60 * 60 * 1000),
        utcDate: utcStartDate
      })
      
      // Add range for the end UTC date (if different)
      ranges.push({
        start: utcEndDate,
        end: new Date(utcEndDate.getTime() + 24 * 60 * 60 * 1000),
        utcDate: utcEndDate
      })
    } else {
      // Single UTC date
      ranges.push({
        start: utcStartDate,
        end: new Date(utcStartDate.getTime() + 24 * 60 * 60 * 1000),
        utcDate: utcStartDate
      })
    }
    
    return ranges
  }

  /**
   * Get today's date in timezone and return all possible UTC date ranges
   * that could contain records for today.
   */
  static getTodayUTCDateRangesForTimezone(timezone: string): Array<{ start: Date, end: Date, utcDate: Date }> {
    const todayInTimezone = new Date()
    return this.getPossibleUTCDateRangesForTimezoneDay(todayInTimezone, timezone)
  }

  /**
   * Create a date at midnight in the specified timezone
   */
  static createMidnightInTimezone(date: Date, timezone: string): Date {
    const localDate = toZonedTime(date, timezone)
    const year = localDate.getFullYear()
    const month = localDate.getMonth()
    const day = localDate.getDate()
    
    // Create midnight in the timezone
    const midnightInTimezone = new Date(year, month, day, 0, 0, 0, 0)
    
    // Convert to UTC
    return fromZonedTime(midnightInTimezone, timezone)
  }

  /**
   * Get timezone display name
   */
  static getTimezoneDisplayName(timezone: string): string {
    try {
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'long'
      })
      return formatter.formatToParts(new Date())
        .find(part => part.type === 'timeZoneName')?.value || timezone
    } catch {
      return timezone.replace('_', ' ').replace('/', ' - ')
    }
  }

  /**
   * Get timezone abbreviation
   */
  static getTimezoneAbbreviation(timezone: string, date: Date = new Date()): string {
    try {
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'short'
      })
      return formatter.formatToParts(date)
        .find(part => part.type === 'timeZoneName')?.value || timezone
    } catch {
      return timezone
    }
  }
}

// Export commonly used functions for backward compatibility
export const {
  isValidTimezone,
  getTodayInTimezone,
  formatInTimezone,
  isTodayInTimezone,
  formatDateStringInTimezone,
  getTodayDateStringInTimezone,
  isSameDayInTimezone,
  getDayBoundariesInTimezone,
  formatTimeWithOffset,
  getTimezoneOffset,
  fromUTCToTimezone,
  fromTimezoneToUTC,
  getPossibleUTCDateRangesForTimezoneDay,
  getTodayUTCDateRangesForTimezone,
  createMidnightInTimezone,
  getTimezoneDisplayName,
  getTimezoneAbbreviation
} = TimezoneService
