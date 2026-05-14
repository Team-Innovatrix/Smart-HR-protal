/**
 * Comprehensive Indian Holiday Calendar (2024–2027)
 * Includes National, State, Festival, and Company holidays
 * Used by the AI Leave Prediction Engine for risk analysis
 */

export interface IndianHoliday {
  name: string
  date: string            // YYYY-MM-DD
  type: 'national' | 'state' | 'festival' | 'company' | 'restricted'
  category: 'gazetted' | 'restricted' | 'festival' | 'company'
  region?: string         // e.g. 'Maharashtra', 'All India'
  isMajorFestival?: boolean
  travelLikely?: boolean  // festivals where employees typically travel home
}

export const INDIAN_HOLIDAYS: Record<string, IndianHoliday[]> = {
  '2024': [
    // National Holidays
    { name: 'Republic Day', date: '2024-01-26', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Independence Day', date: '2024-08-15', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Gandhi Jayanti', date: '2024-10-02', type: 'national', category: 'gazetted', region: 'All India' },
    // Major Festivals
    { name: 'Makar Sankranti / Pongal', date: '2024-01-15', type: 'festival', category: 'festival', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Maha Shivaratri', date: '2024-03-08', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Holi', date: '2024-03-25', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Good Friday', date: '2024-03-29', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Eid ul-Fitr', date: '2024-04-11', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Ram Navami', date: '2024-04-17', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Mahavir Jayanti', date: '2024-04-21', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Buddha Purnima', date: '2024-05-23', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Eid ul-Adha (Bakrid)', date: '2024-06-17', type: 'festival', category: 'gazetted', region: 'All India', travelLikely: true },
    { name: 'Muharram', date: '2024-07-17', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Raksha Bandhan', date: '2024-08-19', type: 'festival', category: 'festival', region: 'All India', travelLikely: true },
    { name: 'Janmashtami', date: '2024-08-26', type: 'festival', category: 'gazetted', region: 'All India', travelLikely: true },
    { name: 'Milad un-Nabi', date: '2024-09-16', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Ganesh Chaturthi', date: '2024-09-07', type: 'festival', category: 'festival', region: 'Maharashtra', isMajorFestival: true, travelLikely: true },
    { name: 'Navratri Begins', date: '2024-10-03', type: 'festival', category: 'festival', region: 'All India', isMajorFestival: true },
    { name: 'Dussehra (Vijayadashami)', date: '2024-10-12', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Diwali', date: '2024-11-01', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Diwali (Day 2 - Govardhan Puja)', date: '2024-11-02', type: 'festival', category: 'festival', region: 'All India', isMajorFestival: true },
    { name: 'Bhai Dooj', date: '2024-11-03', type: 'festival', category: 'festival', region: 'All India', travelLikely: true },
    { name: 'Guru Nanak Jayanti', date: '2024-11-15', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Christmas', date: '2024-12-25', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    // State Holidays
    { name: 'Maharashtra Day', date: '2024-05-01', type: 'state', category: 'gazetted', region: 'Maharashtra' },
    { name: 'Onam', date: '2024-09-15', type: 'state', category: 'gazetted', region: 'Kerala', isMajorFestival: true, travelLikely: true },
    { name: 'Chhath Puja', date: '2024-11-07', type: 'state', category: 'festival', region: 'Bihar', travelLikely: true },
  ],
  '2025': [
    // National Holidays
    { name: 'Republic Day', date: '2025-01-26', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Independence Day', date: '2025-08-15', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Gandhi Jayanti', date: '2025-10-02', type: 'national', category: 'gazetted', region: 'All India' },
    // Major Festivals
    { name: 'Makar Sankranti / Pongal', date: '2025-01-14', type: 'festival', category: 'festival', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Maha Shivaratri', date: '2025-02-26', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Holi', date: '2025-03-14', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Good Friday', date: '2025-04-18', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Eid ul-Fitr', date: '2025-03-31', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Ram Navami', date: '2025-04-06', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Mahavir Jayanti', date: '2025-04-10', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Buddha Purnima', date: '2025-05-12', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Eid ul-Adha (Bakrid)', date: '2025-06-07', type: 'festival', category: 'gazetted', region: 'All India', travelLikely: true },
    { name: 'Muharram', date: '2025-07-06', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Raksha Bandhan', date: '2025-08-09', type: 'festival', category: 'festival', region: 'All India', travelLikely: true },
    { name: 'Janmashtami', date: '2025-08-16', type: 'festival', category: 'gazetted', region: 'All India', travelLikely: true },
    { name: 'Milad un-Nabi', date: '2025-09-05', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Ganesh Chaturthi', date: '2025-08-27', type: 'festival', category: 'festival', region: 'Maharashtra', isMajorFestival: true, travelLikely: true },
    { name: 'Navratri Begins', date: '2025-09-22', type: 'festival', category: 'festival', region: 'All India', isMajorFestival: true },
    { name: 'Dussehra (Vijayadashami)', date: '2025-10-02', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Diwali', date: '2025-10-20', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Diwali (Day 2 - Govardhan Puja)', date: '2025-10-21', type: 'festival', category: 'festival', region: 'All India', isMajorFestival: true },
    { name: 'Bhai Dooj', date: '2025-10-23', type: 'festival', category: 'festival', region: 'All India', travelLikely: true },
    { name: 'Guru Nanak Jayanti', date: '2025-11-05', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Christmas', date: '2025-12-25', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    // State Holidays
    { name: 'Maharashtra Day', date: '2025-05-01', type: 'state', category: 'gazetted', region: 'Maharashtra' },
    { name: 'Onam', date: '2025-09-05', type: 'state', category: 'gazetted', region: 'Kerala', isMajorFestival: true, travelLikely: true },
    { name: 'Chhath Puja', date: '2025-10-26', type: 'state', category: 'festival', region: 'Bihar', travelLikely: true },
  ],
  '2026': [
    // National Holidays
    { name: 'Republic Day', date: '2026-01-26', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Independence Day', date: '2026-08-15', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'national', category: 'gazetted', region: 'All India' },
    // Major Festivals
    { name: 'Makar Sankranti / Pongal', date: '2026-01-14', type: 'festival', category: 'festival', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Maha Shivaratri', date: '2026-02-15', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Holi', date: '2026-03-04', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Good Friday', date: '2026-04-03', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Eid ul-Fitr', date: '2026-03-20', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Ram Navami', date: '2026-03-26', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Mahavir Jayanti', date: '2026-03-31', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Buddha Purnima', date: '2026-05-01', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Eid ul-Adha (Bakrid)', date: '2026-05-27', type: 'festival', category: 'gazetted', region: 'All India', travelLikely: true },
    { name: 'Muharram', date: '2026-06-26', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Raksha Bandhan', date: '2026-07-30', type: 'festival', category: 'festival', region: 'All India', travelLikely: true },
    { name: 'Janmashtami', date: '2026-08-06', type: 'festival', category: 'gazetted', region: 'All India', travelLikely: true },
    { name: 'Milad un-Nabi', date: '2026-08-26', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Ganesh Chaturthi', date: '2026-08-17', type: 'festival', category: 'festival', region: 'Maharashtra', isMajorFestival: true, travelLikely: true },
    { name: 'Navratri Begins', date: '2026-09-12', type: 'festival', category: 'festival', region: 'All India', isMajorFestival: true },
    { name: 'Dussehra (Vijayadashami)', date: '2026-09-21', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Diwali', date: '2026-10-09', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Diwali (Day 2 - Govardhan Puja)', date: '2026-10-10', type: 'festival', category: 'festival', region: 'All India', isMajorFestival: true },
    { name: 'Bhai Dooj', date: '2026-10-11', type: 'festival', category: 'festival', region: 'All India', travelLikely: true },
    { name: 'Guru Nanak Jayanti', date: '2026-10-25', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Christmas', date: '2026-12-25', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    // State Holidays
    { name: 'Maharashtra Day', date: '2026-05-01', type: 'state', category: 'gazetted', region: 'Maharashtra' },
    { name: 'Onam', date: '2026-08-25', type: 'state', category: 'gazetted', region: 'Kerala', isMajorFestival: true, travelLikely: true },
    { name: 'Chhath Puja', date: '2026-10-15', type: 'state', category: 'festival', region: 'Bihar', travelLikely: true },
  ],
  '2027': [
    // National Holidays
    { name: 'Republic Day', date: '2027-01-26', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Independence Day', date: '2027-08-15', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Gandhi Jayanti', date: '2027-10-02', type: 'national', category: 'gazetted', region: 'All India' },
    // Major Festivals
    { name: 'Makar Sankranti / Pongal', date: '2027-01-14', type: 'festival', category: 'festival', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Holi', date: '2027-03-22', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Good Friday', date: '2027-03-26', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Eid ul-Fitr', date: '2027-03-10', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Diwali', date: '2027-10-29', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Dussehra (Vijayadashami)', date: '2027-10-11', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Christmas', date: '2027-12-25', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Ganesh Chaturthi', date: '2027-09-06', type: 'festival', category: 'festival', region: 'Maharashtra', isMajorFestival: true, travelLikely: true },
    { name: 'Navratri Begins', date: '2027-10-01', type: 'festival', category: 'festival', region: 'All India', isMajorFestival: true },
  ],
}

/**
 * Get holidays for a specific year
 */
export function getHolidaysForYear(year: number): IndianHoliday[] {
  return INDIAN_HOLIDAYS[String(year)] || []
}

/**
 * Get holidays for a date range
 */
export function getHolidaysInRange(startDate: Date, endDate: Date): IndianHoliday[] {
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()
  const holidays: IndianHoliday[] = []
  
  for (let y = startYear; y <= endYear; y++) {
    const yearHolidays = getHolidaysForYear(y)
    holidays.push(...yearHolidays.filter(h => {
      const hDate = new Date(h.date)
      return hDate >= startDate && hDate <= endDate
    }))
  }
  
  return holidays
}

/**
 * Check if a date is a holiday
 */
export function isHoliday(dateStr: string): IndianHoliday | undefined {
  const year = dateStr.substring(0, 4)
  const holidays = INDIAN_HOLIDAYS[year] || []
  return holidays.find(h => h.date === dateStr)
}

/**
 * Get festival season windows (±5 days around major festivals)
 */
export function getFestivalSeasons(year: number): Array<{ name: string; start: string; end: string; peakDate: string }> {
  const holidays = getHolidaysForYear(year).filter(h => h.isMajorFestival)
  return holidays.map(h => {
    const peakDate = new Date(h.date)
    const start = new Date(peakDate)
    start.setDate(start.getDate() - 3)
    const end = new Date(peakDate)
    end.setDate(end.getDate() + 3)
    
    return {
      name: h.name,
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      peakDate: h.date,
    }
  })
}
