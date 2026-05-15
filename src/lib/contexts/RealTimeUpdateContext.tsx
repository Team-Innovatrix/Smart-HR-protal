'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface RealTimeUpdateContextType {
  triggerAttendanceUpdate: () => void
  subscribeToAttendanceUpdates: (callback: () => void) => () => void
  isUpdating: boolean
}

const RealTimeUpdateContext = createContext<RealTimeUpdateContextType | undefined>(undefined)

export const useRealTimeUpdates = () => {
  const context = useContext(RealTimeUpdateContext)
  if (!context) {
    // Return safe no-ops instead of throwing — prevents full React tree crash
    // if a component using this hook renders outside the provider tree.
    return {
      triggerAttendanceUpdate: () => {},
      subscribeToAttendanceUpdates: (_callback: () => void) => () => {},
      isUpdating: false,
    }
  }
  return context
}

interface RealTimeUpdateProviderProps {
  children: React.ReactNode
}

export const RealTimeUpdateProvider: React.FC<RealTimeUpdateProviderProps> = ({ children }) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [subscribers, setSubscribers] = useState<Set<() => void>>(new Set())

  const triggerAttendanceUpdate = useCallback(async () => {
    setIsUpdating(true)
    
    // Notify all subscribers
    subscribers.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Error in attendance update callback:', error)
      }
    })
    
    // Reset updating state after a short delay
    setTimeout(() => setIsUpdating(false), 1000)
  }, [subscribers])

  const subscribeToAttendanceUpdates = useCallback((callback: () => void) => {
    setSubscribers(prev => new Set(prev).add(callback))
    
    // Return unsubscribe function
    return () => {
      setSubscribers(prev => {
        const newSet = new Set(prev)
        newSet.delete(callback)
        return newSet
      })
    }
  }, [])

  // Listen for voice command events from the window object
  useEffect(() => {
    const handleVoiceCommandSuccess = (event: CustomEvent) => {
      const { action } = event.detail
      
      // Trigger update for attendance-related actions
      if (action === 'clock_in' || action === 'clock_out') {
        console.log('Voice command attendance action detected, triggering update:', action)
        triggerAttendanceUpdate()
      }
    }

    // Listen for custom events
    window.addEventListener('voiceCommandSuccess', handleVoiceCommandSuccess as EventListener)
    
    return () => {
      window.removeEventListener('voiceCommandSuccess', handleVoiceCommandSuccess as EventListener)
    }
  }, [triggerAttendanceUpdate])

  const value: RealTimeUpdateContextType = {
    triggerAttendanceUpdate,
    subscribeToAttendanceUpdates,
    isUpdating
  }

  return (
    <RealTimeUpdateContext.Provider value={value}>
      {children}
    </RealTimeUpdateContext.Provider>
  )
}
