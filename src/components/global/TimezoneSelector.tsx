'use client'

import { useState, useEffect } from 'react'

interface TimezoneOption {
  value: string
  label: string
}

interface TimezoneSelectorProps {
  value: string
  onChange: (timezone: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export default function TimezoneSelector({ 
  value, 
  onChange, 
  className = '', 
  placeholder = 'Select timezone',
  disabled = false 
}: TimezoneSelectorProps) {
  const [timezones, setTimezones] = useState<TimezoneOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTimezones()
  }, [])

  const fetchTimezones = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/timezones', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch timezones: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        setTimezones(data.data)
      } else {
        throw new Error('Invalid timezone data received')
      }
    } catch (error) {
      console.error('Error fetching timezones:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch timezones')
      
      // Fallback to basic timezones if API fails
      setTimezones([
        // { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
        // { value: 'America/New_York', label: 'Eastern Time (US) - America/New_York' },
        // { value: 'America/Chicago', label: 'Central Time (US) - America/Chicago' },
        // { value: 'America/Denver', label: 'Mountain Time (US) - America/Denver' },
        // { value: 'America/Los_Angeles', label: 'Pacific Time (US) - America/Los_Angeles' },
        // { value: 'Europe/London', label: 'Greenwich Mean Time - Europe/London' },
        // { value: 'Asia/Tokyo', label: 'Japan Standard Time - Asia/Tokyo' },
        { value: 'Asia/Kolkata', label: 'India Standard Time - Asia/Kolkata' }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <select 
        disabled 
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 ${className}`}
      >
        <option>Loading timezones...</option>
      </select>
    )
  }

  if (error) {
    console.warn('TimezoneSelector: Using fallback timezones due to error:', error)
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {timezones.map((timezone) => (
          <option key={timezone.value} value={timezone.value}>
            {timezone.label}
          </option>
        ))}
      </select>
      
      {error && (
        <div className="mt-1 text-xs text-amber-600">
          Using limited timezone list due to connection issue
        </div>
      )}
    </div>
  )
}
