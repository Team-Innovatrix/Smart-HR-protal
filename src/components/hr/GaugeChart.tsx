'use client'

import React from 'react'

interface GaugeChartProps {
  data: {
    type: string
    total: number
    taken: number
    remaining: number
  }[]
  size?: number
  strokeWidth?: number
  showLegend?: boolean
  className?: string
  color?: string
}

const GaugeChartComponent: React.FC<GaugeChartProps> = ({
  data,
  size = 200,
  strokeWidth = 20,
  showLegend = true,
  className = '',
  color = '#10B981'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <div className="w-32 h-16 rounded-t-full border-4 border-b-0 border-gray-200 flex items-center justify-center">
            <span className="text-sm">No Data</span>
          </div>
        </div>
      </div>
    )
  }

  const item = data[0]
  // Calculate percentage based on available leaves (remaining) instead of taken
  const availablePercentage = item.total > 0 ? (item.remaining / item.total) : 0
  
  // Ensure percentage is between 0 and 1
  const clampedPercentage = Math.max(0, Math.min(1, availablePercentage))
  
  // Simple semicircle implementation
  const radius = (size - strokeWidth) / 2
  const centerX = size / 2
  const centerY = size / 2
  
  // Create semicircle path from left to right
  const createSemicirclePath = () => {
    const startX = centerX - radius
    const startY = centerY
    const endX = centerX + radius
    const endY = centerY
    
    return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`
  }
  
  // Create filled arc based on percentage
  const createFilledPath = (percentage: number) => {
    if (percentage <= 0) return ''
    
    const startX = centerX - radius
    const startY = centerY
    const angle = Math.PI * percentage // 0 to π
    const endX = centerX - radius * Math.cos(angle)
    const endY = centerY - radius * Math.sin(angle)
    
    return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`
  }

  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
      <div className="relative w-full" style={{ aspectRatio: '2/1' }}>
        {/* SVG Gauge */}
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${size} ${size / 2 + 20}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background semicircle */}
          <path
            d={createSemicirclePath()}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Filled arc */}
          {clampedPercentage > 0 && (
            <path
              d={createFilledPath(clampedPercentage)}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-in-out"
            />
          )}
        </svg>
        
        {/* Center content - Large number display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: '30%' }}>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {item.remaining}
            </div>
            <div className="text-xs text-gray-500">
              of {item.total} total
            </div>
          </div>
        </div>
        
        {/* Min/Max labels removed as per requirement */}
      </div>

      {/* Legend (percentage removed as per requirement) */}
      {showLegend && (
        <div className="mt-4 space-y-2 w-full max-w-xs">
          {data.map((item) => {
            const hasAvailableLeaves = item.remaining > 0
            return (
              <div key={item.type} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div 
                    className={`w-3 h-3 rounded-full ${hasAvailableLeaves ? '' : 'bg-gray-300'}`}
                    style={{ backgroundColor: hasAvailableLeaves ? color : undefined }}
                  />
                  <span className="text-gray-700">{item.type}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {item.remaining}/{item.total}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default GaugeChartComponent