import { format, parseISO, startOfDay, eachDayOfInterval, addDays, subDays, isSameDay } from 'date-fns'
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz'

// IANA timezone constants for common business locations
export const BUSINESS_TIMEZONES = {
  // 'UTC': 'Coordinated Universal Time',
  // // Americas
  // 'America/New_York': 'Eastern Time (US)',
  // 'America/Chicago': 'Central Time (US)', 
  // 'America/Denver': 'Mountain Time (US)',
  // 'America/Los_Angeles': 'Pacific Time (US)',
  // 'America/Anchorage': 'Alaska Time',
  // 'America/Toronto': 'Eastern Time (Canada)',
  // 'America/Vancouver': 'Pacific Time (Canada)',
  // 'America/Mexico_City': 'Central Time (Mexico)',
  // 'America/Sao_Paulo': 'Brasilia Time',
  // 'America/Argentina/Buenos_Aires': 'Argentina Time',
  // 'Pacific/Honolulu': 'Hawaii Time',
  // // Europe
  // 'Europe/London': 'Greenwich Mean Time',
  // 'Europe/Paris': 'Central European Time',
  // 'Europe/Berlin': 'Central European Time',
  // 'Europe/Rome': 'Central European Time',
  // 'Europe/Madrid': 'Central European Time',
  // 'Europe/Amsterdam': 'Central European Time',
  // 'Europe/Stockholm': 'Central European Time',
  // 'Europe/Moscow': 'Moscow Time',
  // 'Europe/Istanbul': 'Turkey Time',
  // // Asia
  // 'Asia/Tokyo': 'Japan Standard Time',
  // 'Asia/Shanghai': 'China Standard Time',
  // 'Asia/Hong_Kong': 'Hong Kong Time',
  // 'Asia/Singapore': 'Singapore Time',
  'Asia/Kolkata': 'India Standard Time',
  // 'Asia/Dubai': 'Gulf Standard Time',
  // 'Asia/Tehran': 'Iran Standard Time',
  // 'Asia/Karachi': 'Pakistan Standard Time',
  // 'Asia/Dhaka': 'Bangladesh Standard Time',
  // 'Asia/Bangkok': 'Indochina Time',
  // 'Asia/Jakarta': 'Western Indonesia Time',
  // 'Asia/Seoul': 'Korea Standard Time',
  // 'Asia/Manila': 'Philippine Time',
  // // Australia & Pacific
  // 'Australia/Sydney': 'Australian Eastern Time',
  // 'Australia/Melbourne': 'Australian Eastern Time',
  // 'Australia/Perth': 'Australian Western Time',
  // 'Australia/Adelaide': 'Australian Central Time',
  // 'Pacific/Auckland': 'New Zealand Time',
  // 'Pacific/Fiji': 'Fiji Time',
  // // Africa
  // 'Africa/Cairo': 'Eastern European Time',
  // 'Africa/Johannesburg': 'South Africa Time',
  // 'Africa/Lagos': 'West Africa Time',
  // 'Africa/Nairobi': 'East Africa Time',
  // // Atlantic
  // 'Atlantic/Azores': 'Azores Time',
  // 'Atlantic/Canary': 'Western European Time'
} as const

// Extended timezone type to support all IANA timezones
export type IANATimezone = string

// Timezone-aware date utilities
export class TimezoneAwareDate {
  private utcDate: Date
  private timezone: IANATimezone

  constructor(date: Date | string, timezone: IANATimezone) {
    this.utcDate = typeof date === 'string' ? parseISO(date) : date
    this.timezone = timezone
  }

  // Get the date in the specified timezone
  getLocalDate(): Date {
    return toZonedTime(this.utcDate, this.timezone)
  }

  // Get the UTC date
  getUTCDate(): Date {
    return this.utcDate
  }

  // Get the timezone
  getTimezone(): IANATimezone {
    return this.timezone
  }

  // Format date in the local timezone
  formatLocal(pattern: string): string {
    return formatInTimeZone(this.utcDate, this.timezone, pattern)
  }

  // Format date in UTC
  formatUTC(pattern: string): string {
    return format(this.utcDate, pattern)
  }

  // Get ISO string in UTC (for API I/O)
  toISOString(): string {
    return this.utcDate.toISOString()
  }

  // Get RFC3339 string with timezone offset
  toRFC3339(): string {
    return formatInTimeZone(this.utcDate, this.timezone, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
  }
}

// Date range utilities (half-open intervals: [start, end))
export class DateRange {
  private start: Date
  private end: Date

  constructor(start: Date, end: Date) {
    this.start = start
    this.end = end
  }

  // Check if a date is within the range (inclusive start, exclusive end)
  contains(date: Date): boolean {
    return date >= this.start && date < this.end
  }

  // Check if this range overlaps with another range
  overlaps(other: DateRange): boolean {
    return this.start < other.end && this.end > other.start
  }

  // Get all days in the range (as dates, not datetimes)
  getDays(): Date[] {
    return eachDayOfInterval({ start: this.start, end: subDays(this.end, 1) })
  }

  // Get working days (excluding weekends)
  getWorkingDays(): Date[] {
    return this.getDays().filter(date => {
      const day = date.getDay()
      return day !== 0 && day !== 6 // Not Sunday (0) or Saturday (6)
    })
  }

  // Get the start date
  getStart(): Date {
    return this.start
  }

  // Get the end date
  getEnd(): Date {
    return this.end
  }

  // Get duration in days
  getDuration(): number {
    return Math.ceil((this.end.getTime() - this.start.getTime()) / (1000 * 60 * 60 * 24))
  }
}

// Leave-specific utilities
export class LeaveDateUtils {
  /**
   * Create a leave date range from start and end dates
   * Handles full-day leaves (stored as dates, not datetimes)
   */
  static createLeaveRange(startDate: string | Date, endDate: string | Date): DateRange {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
    
    // For full-day leaves, start at midnight and end at midnight of next day
    // This creates a half-open interval [start, end) that covers the full days
    const rangeStart = startOfDay(start)
    const rangeEnd = startOfDay(addDays(end, 1))
    
    return new DateRange(rangeStart, rangeEnd)
  }

  /**
   * Create a leave date range from user timezone dates
   * Converts user timezone dates to UTC for storage
   */
  static createLeaveRangeFromUserTimezone(
    startDate: string | Date, 
    endDate: string | Date, 
    userTimezone: string
  ): DateRange {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
    
    // Convert user timezone dates to UTC
    const startUTC = fromZonedTime(start, userTimezone as IANATimezone)
    const endUTC = fromZonedTime(end, userTimezone as IANATimezone)
    
    // For full-day leaves, start at midnight and end at midnight of next day
    const rangeStart = startOfDay(startUTC)
    const rangeEnd = startOfDay(addDays(endUTC, 1))
    
    return new DateRange(rangeStart, rangeEnd)
  }

  /**
   * Check if a leave overlaps with existing leaves
   */
  static checkOverlap(
    newLeave: { startDate: Date, endDate: Date },
    existingLeaves: Array<{ startDate: Date, endDate: Date }>
  ): boolean {
    const newRange = LeaveDateUtils.createLeaveRange(newLeave.startDate, newLeave.endDate)
    
    return existingLeaves.some(existing => {
      const existingRange = LeaveDateUtils.createLeaveRange(existing.startDate, existing.endDate)
      return newRange.overlaps(existingRange)
    })
  }

  /**
   * Calculate working days between two dates (excluding weekends)
   */
  static calculateWorkingDays(startDate: Date, endDate: Date): number {
    const range = LeaveDateUtils.createLeaveRange(startDate, endDate)
    return range.getWorkingDays().length
  }

  /**
   * Convert a date to UTC midnight for consistent storage
   */
  static toUTCMidnight(date: Date): Date {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  }

  /**
   * Convert a date from UTC to local timezone
   */
  static fromUTCToLocal(utcDate: Date, timezone: IANATimezone): Date {
    return toZonedTime(utcDate, timezone)
  }

  /**
   * Convert a local date to UTC
   */
  static fromLocalToUTC(localDate: Date, timezone: IANATimezone): Date {
    return fromZonedTime(localDate, timezone)
  }

  /**
   * Convert a user timezone date to UTC midnight for consistent storage
   */
  static toUTCMidnightFromUserTimezone(date: Date, userTimezone: string): Date {
    // Create a date at midnight in the user's timezone
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()
    
    // Create midnight in user timezone
    const midnightInUserTimezone = new Date(year, month, day, 0, 0, 0, 0)
    
    // Convert to UTC
    const utcMidnight = fromZonedTime(midnightInUserTimezone, userTimezone as IANATimezone)
    return new Date(Date.UTC(utcMidnight.getUTCFullYear(), utcMidnight.getUTCMonth(), utcMidnight.getUTCDate()))
  }

  /**
   * Get today's date in user timezone as UTC midnight
   */
  static getTodayUTCFromUserTimezone(userTimezone: string): Date {
    const now = new Date()
    const userLocalDate = toZonedTime(now, userTimezone as IANATimezone)
    const utcDate = fromZonedTime(userLocalDate, userTimezone as IANATimezone)
    return new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate()))
  }

  /**
   * Get date range for a specific day in user timezone
   */
  static getDayRangeInUserTimezone(date: Date, userTimezone: string): { start: Date, end: Date } {
    // Create a date at midnight in the user's timezone
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()
    
    // Create midnight in user timezone
    const midnightInUserTimezone = new Date(year, month, day, 0, 0, 0, 0)
    
    // Convert to UTC
    const utcMidnight = fromZonedTime(midnightInUserTimezone, userTimezone as IANATimezone)
    const start = new Date(Date.UTC(utcMidnight.getUTCFullYear(), utcMidnight.getUTCMonth(), utcMidnight.getUTCDate()))
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
    return { start, end }
  }
}

// Calendar utilities
export class CalendarUtils {
  /**
   * Get month boundaries in UTC
   */
  static getMonthBoundaries(year: number, month: number): { start: Date, end: Date } {
    const start = new Date(Date.UTC(year, month, 1))
    const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))
    return { start, end }
  }

  /**
   * Get today's date in UTC
   */
  static getTodayUTC(): Date {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  }

  /**
   * Get today's date in local time (midnight)
   */
  static getTodayLocal(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }

  /**
   * Check if a date is today (LOCAL)
   */
  static isToday(date: Date): boolean {
    const today = CalendarUtils.getTodayLocal()
    return isSameDay(date, today)
  }

  /**
   * Format date for display in user's timezone
   */
  static formatForDisplay(date: Date, timezone: string, formatString: string = 'PPP'): string {
    try {
      return formatInTimeZone(date, timezone, formatString)
    } catch {
      // Fallback to UTC formatting if timezone conversion fails
      return format(date, formatString)
    }
  }

  /**
   * Format date for API (UTC ISO string)
   */
  static formatForAPI(date: Date): string {
    return date.toISOString()
  }
}

// Browser timezone detection has been completely removed.
// Use UserProfile.timezone as the single source of truth for all timezone decisions.

/**
 * Check if a timezone is valid IANA timezone
 */
export function isValidTimezone(timezone: string): boolean {
  if (!timezone || typeof timezone !== 'string') return false;
  
  // Check if it's UTC
  if (timezone === 'UTC') return true;
  
  // Check basic IANA timezone format: Region/City
  if (!/^[A-Za-z_]+\/[A-Za-z_]+$/.test(timezone)) return false;
  
  // Try to create a date in the timezone to validate it
  try {
    const testDate = new Date();
    formatInTimeZone(testDate, timezone, 'yyyy-MM-dd HH:mm:ss');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get timezone display name (for predefined business timezones)
 */
export function getTimezoneDisplayName(timezone: string): string {
  if (timezone in BUSINESS_TIMEZONES) {
    return BUSINESS_TIMEZONES[timezone as keyof typeof BUSINESS_TIMEZONES]
  }
  // For other timezones, return a formatted version
  return timezone.replace('_', ' ').replace('/', ' - ')
}

/**
 * Get all available timezones (common business timezones + some additional ones)
 */
export function getAvailableTimezones(): Array<{ value: string, label: string }> {
  const timezones = Object.entries(BUSINESS_TIMEZONES).map(([value, label]) => ({
    value,
    label: `${label} (${value})`
  }));

  // Add some additional common timezones
  const additionalTimezones = [
    'America/Detroit',
    'America/Indiana/Indianapolis',
    'America/Phoenix',
    'America/Edmonton',
    'America/Winnipeg',
    'America/Halifax',
    'America/St_Johns',
    'Europe/Dublin',
    'Europe/Athens',
    'Europe/Prague',
    'Europe/Warsaw',
    'Europe/Helsinki',
    'Europe/Kiev',
    'Asia/Kathmandu',
    'Asia/Colombo',
    'Asia/Kuala_Lumpur',
    'Asia/Ho_Chi_Minh',
    'Asia/Taipei',
    'Asia/Macau',
    'Asia/Calcutta',
    'Asia/Karachi',
    'Asia/Tashkent',
    'Asia/Almaty',
    'Asia/Yekaterinburg',
    'Asia/Novosibirsk',
    'Asia/Vladivostok',
    'Asia/Kamchatka',
    'Australia/Darwin',
    'Australia/Brisbane',
    'Pacific/Guam',
    'Pacific/Chatham',
    'Pacific/Tongatapu'
  ];

  additionalTimezones.forEach(tz => {
    if (!timezones.find(t => t.value === tz)) {
      timezones.push({
        value: tz,
        label: `${tz.replace('_', ' ').replace('/', ' - ')} (${tz})`
      });
    }
  });

  return timezones.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Get timezone offset for a specific date
 */
export function getTimezoneOffset(timezone: string, date: Date): number {
  try {
    const localDate = toZonedTime(date, timezone as IANATimezone)
    const utcDate = fromZonedTime(localDate, timezone as IANATimezone)
    return localDate.getTime() - utcDate.getTime()
  } catch {
    // If timezone conversion fails, return 0
    return 0
  }
}

// User timezone storage utilities
export class UserTimezoneStorage {
  /**
   * Convert current time to user timezone for storage
   */
  static getCurrentTimeInUserTimezone(userTimezone: string): Date {
    const now = new Date()
    return toZonedTime(now, userTimezone as IANATimezone)
  }

  /**
   * Get today's date in user timezone (for date field)
   */
  static getTodayInUserTimezone(userTimezone: string): Date {
    const now = new Date()
    const userLocalDate = toZonedTime(now, userTimezone as IANATimezone)
    // Return midnight of today in user timezone using fromZonedTime to ensure proper timezone handling
    const year = userLocalDate.getFullYear()
    const month = userLocalDate.getMonth()
    const day = userLocalDate.getDate()
    return fromZonedTime(new Date(year, month, day, 0, 0, 0, 0), userTimezone as IANATimezone)
  }

  /**
   * Get date range for a specific day in user timezone
   */
  static getDayRangeInUserTimezone(date: Date, userTimezone: string): { start: Date, end: Date } {
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()
    
    // Create start of day in user timezone
    const start = fromZonedTime(new Date(year, month, day, 0, 0, 0, 0), userTimezone as IANATimezone)
    // Create end of day in user timezone
    const end = fromZonedTime(new Date(year, month, day, 23, 59, 59, 999), userTimezone as IANATimezone)
    return { start, end }
  }

  /**
   * Convert stored user timezone time back to UTC for calculations
   */
  static fromUserTimezoneToUTC(userTimezoneTime: Date, userTimezone: string): Date {
    return fromZonedTime(userTimezoneTime, userTimezone as IANATimezone)
  }

  /**
   * Convert UTC time to user timezone for display
   */
  static fromUTCToUserTimezone(utcTime: Date, userTimezone: string): Date {
    return toZonedTime(utcTime, userTimezone as IANATimezone)
  }

  /**
   * Format time for display in user timezone with timezone offset
   */
  static formatTimeInUserTimezone(time: Date, userTimezone: string, format: string = 'yyyy-MM-dd HH:mm:ss'): string {
    return formatInTimeZone(time, userTimezone, format)
  }

  /**
   * Format time with timezone offset (e.g., 2025-09-09 08:47:25+05:30)
   */
  static formatTimeWithTimezoneOffset(time: Date, userTimezone: string): string {
    try {
      // Get the time in user timezone
      const localTime = toZonedTime(time, userTimezone as IANATimezone)
      
      // Get timezone offset
      const offset = this.getTimezoneOffset(userTimezone, time)
      const offsetHours = Math.floor(Math.abs(offset) / (1000 * 60 * 60))
      const offsetMinutes = Math.floor((Math.abs(offset) % (1000 * 60 * 60)) / (1000 * 60))
      const offsetSign = offset >= 0 ? '+' : '-'
      const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`
      
      // Format the time
      const timeString = formatInTimeZone(time, userTimezone, 'yyyy-MM-dd HH:mm:ss')
      
      return `${timeString}${offsetString}`
    } catch (error) {
      // Fallback to UTC if timezone conversion fails
      return time.toISOString().replace('T', ' ').replace('Z', '+00:00')
    }
  }

  /**
   * Get timezone offset for a specific date
   */
  static getTimezoneOffset(userTimezone: string, date: Date): number {
    try {
      const localDate = toZonedTime(date, userTimezone as IANATimezone)
      const utcDate = fromZonedTime(localDate, userTimezone as IANATimezone)
      return localDate.getTime() - utcDate.getTime()
    } catch {
      return 0
    }
  }

  /**
   * Check if two dates are on the same day in user timezone
   */
  static isSameDayInUserTimezone(date1: Date, date2: Date, userTimezone: string): boolean {
    const local1 = toZonedTime(date1, userTimezone as IANATimezone)
    const local2 = toZonedTime(date2, userTimezone as IANATimezone)
    return local1.getFullYear() === local2.getFullYear() &&
           local1.getMonth() === local2.getMonth() &&
           local1.getDate() === local2.getDate()
  }

  /**
   * Get start and end of day in user timezone
   */
  static getDayBoundariesInUserTimezone(date: Date, userTimezone: string): { start: Date, end: Date } {
    const localDate = toZonedTime(date, userTimezone as IANATimezone)
    const year = localDate.getFullYear()
    const month = localDate.getMonth()
    const day = localDate.getDate()
    
    // Create start and end of day in the target timezone using fromZonedTime
    const start = fromZonedTime(new Date(year, month, day, 0, 0, 0, 0), userTimezone as IANATimezone)
    const end = fromZonedTime(new Date(year, month, day, 23, 59, 59, 999), userTimezone as IANATimezone)
    return { start, end }
  }

  /**
   * Get all possible UTC date ranges that could contain attendance records
   * for a given user timezone day. This handles cases where a user timezone day
   * spans multiple UTC days (e.g., when user is in a timezone ahead of UTC).
   */
  static getPossibleUTCDateRangesForUserTimezoneDay(
    userTimezoneDate: Date, 
    userTimezone: string
  ): Array<{ start: Date, end: Date, utcDate: Date }> {
    // Get the start and end of the day in user timezone
    const { start: userDayStart, end: userDayEnd } = UserTimezoneStorage.getDayBoundariesInUserTimezone(userTimezoneDate, userTimezone)
    
    // Convert user timezone day boundaries to UTC
    const utcDayStart = fromZonedTime(userDayStart, userTimezone as IANATimezone)
    const utcDayEnd = fromZonedTime(userDayEnd, userTimezone as IANATimezone)
    
    // Get the UTC dates that this user timezone day spans
    const utcStartDate = new Date(Date.UTC(utcDayStart.getUTCFullYear(), utcDayStart.getUTCMonth(), utcDayStart.getUTCDate()))
    const utcEndDate = new Date(Date.UTC(utcDayEnd.getUTCFullYear(), utcDayEnd.getUTCMonth(), utcDayEnd.getUTCDate()))
    
    const ranges: Array<{ start: Date, end: Date, utcDate: Date }> = []
    
    // If the user timezone day spans multiple UTC days, we need to check all of them
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
   * Get today's date in user timezone and return all possible UTC date ranges
   * that could contain attendance records for today.
   */
  static getTodayUTCDateRangesForUserTimezone(userTimezone: string): Array<{ start: Date, end: Date, utcDate: Date }> {
    const todayInUserTimezone = new Date()
    return UserTimezoneStorage.getPossibleUTCDateRangesForUserTimezoneDay(todayInUserTimezone, userTimezone)
  }
}

// Utility function to format date strings as user timezone dates
export const formatDateStringInUserTimezone = (
  dateString: string, 
  userTimezone: string, 
  formatOptions: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }
): string => {
  try {
    if (!dateString) return 'Invalid Date'

    let date: Date
    if (dateString.includes('T')) {
      // ISO string
      date = new Date(dateString)
    } else if (dateString.includes('-')) {
      // Assume YYYY-MM-DD
      const [yearStr, monthStr, dayStr] = dateString.split('-')
      const year = parseInt(yearStr, 10)
      const month = parseInt(monthStr, 10)
      const day = parseInt(dayStr, 10)
      if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
        return 'Invalid Date'
      }
      date = new Date(year, month - 1, day)
    } else {
      // Fallback parse
      date = new Date(dateString)
    }

    if (isNaN(date.getTime())) return 'Invalid Date'

    return date.toLocaleDateString('en-US', { ...formatOptions, timeZone: userTimezone })
  } catch (error) {
    console.error('Error formatting date string in user timezone:', error)
    return 'Invalid Date'
  }
}

// Export commonly used functions
export const createLeaveRange = LeaveDateUtils.createLeaveRange
export const createLeaveRangeFromUserTimezone = LeaveDateUtils.createLeaveRangeFromUserTimezone
export const checkOverlap = LeaveDateUtils.checkOverlap
export const calculateWorkingDays = LeaveDateUtils.calculateWorkingDays
export const toUTCMidnight = LeaveDateUtils.toUTCMidnight
export const toUTCMidnightFromUserTimezone = LeaveDateUtils.toUTCMidnightFromUserTimezone
export const getTodayUTCFromUserTimezone = LeaveDateUtils.getTodayUTCFromUserTimezone
export const getDayRangeInUserTimezone = LeaveDateUtils.getDayRangeInUserTimezone
export const fromUTCToLocal = LeaveDateUtils.fromUTCToLocal
export const fromLocalToUTC = LeaveDateUtils.fromLocalToUTC

// New user timezone storage functions
export const getCurrentTimeInUserTimezone = UserTimezoneStorage.getCurrentTimeInUserTimezone
export const getTodayInUserTimezone = UserTimezoneStorage.getTodayInUserTimezone
export const getDayRangeInUserTimezoneForStorage = UserTimezoneStorage.getDayRangeInUserTimezone
export const fromUserTimezoneToUTC = UserTimezoneStorage.fromUserTimezoneToUTC
export const fromUTCToUserTimezone = UserTimezoneStorage.fromUTCToUserTimezone
export const formatTimeInUserTimezone = UserTimezoneStorage.formatTimeInUserTimezone
export const formatTimeWithTimezoneOffset = UserTimezoneStorage.formatTimeWithTimezoneOffset
export const isSameDayInUserTimezone = UserTimezoneStorage.isSameDayInUserTimezone
export const getDayBoundariesInUserTimezone = UserTimezoneStorage.getDayBoundariesInUserTimezone
export const getPossibleUTCDateRangesForUserTimezoneDay = UserTimezoneStorage.getPossibleUTCDateRangesForUserTimezoneDay
export const getTodayUTCDateRangesForUserTimezone = UserTimezoneStorage.getTodayUTCDateRangesForUserTimezone

export const getMonthBoundaries = CalendarUtils.getMonthBoundaries
export const getTodayUTC = CalendarUtils.getTodayUTC
export const formatForDisplay = CalendarUtils.formatForDisplay
export const formatForAPI = CalendarUtils.formatForAPI

// Standalone functions that work without class context
export const isToday = (date: Date): boolean => {
  const today = CalendarUtils.getTodayLocal()
  return isSameDay(date, today)
}

// Browser timezone detection removed - use UserProfile.timezone instead
// Only export utility functions that don't depend on browser detection
