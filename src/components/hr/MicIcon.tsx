'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useDevSafeUser as useUser } from '@/lib/hooks/useDevSafeClerk'
import { useRouter } from 'next/navigation'
import {
  MicrophoneIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  UsersIcon,
  DocumentTextIcon,
  HomeIcon,
  UserIcon,
  XMarkIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { VoiceRecorder } from '@/lib/voiceRecorder'
import { VoiceCommandClient, VoiceCommandState } from '@/lib/voiceCommandClient'
import { requestLocationPermission, showLocationPermissionMessage } from '@/lib/locationPermissionUtils'
import VoiceCommandChatSimple from '../VoiceCommandChatSimple'

/* ─── Quick action definition ───────────────────────────────────── */
interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  glow: string
  action: () => Promise<{ success: boolean; message: string }>
}

/* ─── Feedback toast ────────────────────────────────────────────── */
function Toast({ message, success, onDone }: { message: string; success: boolean; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className={`absolute bottom-20 right-0 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-white text-sm font-semibold
                     whitespace-nowrap animate-fade-in border
                     ${success
                       ? 'bg-emerald-600/90 backdrop-blur-sm border-emerald-400/30'
                       : 'bg-red-600/90 backdrop-blur-sm border-red-400/30'}`}>
      {success ? <CheckCircleIcon className="w-4 h-4 flex-shrink-0" /> : <XCircleIcon className="w-4 h-4 flex-shrink-0" />}
      {message}
    </div>
  )
}

/* ─── Main component ────────────────────────────────────────────── */
const MicIcon = () => {
  const [mounted, setMounted] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatRefreshTrigger, setChatRefreshTrigger] = useState(0)
  const [isPressed, setIsPressed] = useState(false)
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null)
  const [runningAction, setRunningAction] = useState<string | null>(null)

  const [commandState, setCommandState] = useState<VoiceCommandState>({
    isRecording: false,
    isProcessing: false,
    transcription: '',
    intent: null,
    error: null,
    success: false,
    nodeProgress: [],
    currentNode: undefined,
    nodeStatus: 'idle',
  })

  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const chatTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const rippleRef = useRef<HTMLDivElement>(null)
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null)
  const voiceCommandClientRef = useRef<VoiceCommandClient | null>(null)
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      try {
        voiceRecorderRef.current = new VoiceRecorder()
        voiceCommandClientRef.current = new VoiceCommandClient()
      } catch {
        setCommandState(prev => ({ ...prev, error: 'Voice services not available' }))
      }
    }
    return () => {
      pressTimeoutRef.current && clearTimeout(pressTimeoutRef.current)
      chatTimeoutRef.current && clearTimeout(chatTimeoutRef.current)
    }
  }, [])

  const refreshChat = useCallback(() => {
    setChatRefreshTrigger(p => p + 1)
  }, [])

  const showChatTemporarily = useCallback(() => {
    setShowChat(true)
    chatTimeoutRef.current && clearTimeout(chatTimeoutRef.current)
    chatTimeoutRef.current = setTimeout(() => setShowChat(false), 5000)
  }, [])

  const hideChatAfterSuccess = useCallback(() => {
    chatTimeoutRef.current && clearTimeout(chatTimeoutRef.current)
    chatTimeoutRef.current = setTimeout(() => setShowChat(false), 5000)
  }, [])

  /* ── Quick action executor ──────────────────────────────────── */
  const execAction = useCallback(async (actionId: string, apiFn: () => Promise<{ success: boolean; message: string }>) => {
    if (runningAction) return
    setRunningAction(actionId)
    setToast(null)
    try {
      const result = await apiFn()
      setToast({ message: result.message, success: result.success })
      if (result.success) {
        window.dispatchEvent(new CustomEvent('voiceCommandSuccess', {
          detail: { action: actionId, timestamp: new Date().toISOString() }
        }))
      }
    } catch (e) {
      setToast({ message: 'Action failed. Try again.', success: false })
    } finally {
      setRunningAction(null)
    }
  }, [runningAction])

  /* ── API helpers ────────────────────────────────────────────── */
  const clockIn = useCallback(async () => {
    const locResult = await requestLocationPermission({ enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 })
    if (!locResult.granted) {
      showLocationPermissionMessage(locResult.error || 'Location required', locResult.userDeclined)
      return { success: false, message: 'Location permission denied' }
    }
    const res = await fetch('/api/attendance/clock-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, location: locResult.location }),
    })
    const d = await res.json()
    return { success: d.success, message: d.success ? '✅ Clocked in!' : (d.message || 'Already clocked in') }
  }, [user])

  const clockOut = useCallback(async () => {
    const locResult = await requestLocationPermission({ enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 })
    if (!locResult.granted) {
      showLocationPermissionMessage(locResult.error || 'Location required', locResult.userDeclined)
      return { success: false, message: 'Location permission denied' }
    }
    const res = await fetch('/api/attendance/clock-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, location: locResult.location }),
    })
    const d = await res.json()
    return { success: d.success, message: d.success ? '👋 Clocked out!' : (d.message || 'Not clocked in') }
  }, [user])

  /* ── Quick actions list ─────────────────────────────────────── */
  const quickActions: QuickAction[] = [
    {
      id: 'clock_in',
      label: 'Clock In',
      icon: <ClockIcon className="w-5 h-5" />,
      color: 'from-emerald-500 to-teal-600',
      glow: 'shadow-emerald-500/40',
      action: clockIn,
    },
    {
      id: 'clock_out',
      label: 'Clock Out',
      icon: <ClockIcon className="w-5 h-5" />,
      color: 'from-orange-500 to-red-500',
      glow: 'shadow-orange-500/40',
      action: clockOut,
    },
    {
      id: 'leaves',
      label: 'Request Leave',
      icon: <CalendarIcon className="w-5 h-5" />,
      color: 'from-violet-500 to-purple-600',
      glow: 'shadow-violet-500/40',
      action: async () => { router.push('/portal/leaves'); return { success: true, message: 'Opening leaves →' } },
    },
    {
      id: 'attendance',
      label: 'My Attendance',
      icon: <DocumentTextIcon className="w-5 h-5" />,
      color: 'from-sky-500 to-indigo-500',
      glow: 'shadow-sky-500/40',
      action: async () => { router.push('/portal/attendance'); return { success: true, message: 'Opening attendance →' } },
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: <UserIcon className="w-5 h-5" />,
      color: 'from-pink-500 to-rose-500',
      glow: 'shadow-pink-500/40',
      action: async () => { router.push('/portal/profile'); return { success: true, message: 'Opening profile →' } },
    },
    {
      id: 'team',
      label: 'My Team',
      icon: <UsersIcon className="w-5 h-5" />,
      color: 'from-amber-500 to-orange-500',
      glow: 'shadow-amber-500/40',
      action: async () => { router.push('/portal/team'); return { success: true, message: 'Opening team →' } },
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <HomeIcon className="w-5 h-5" />,
      color: 'from-slate-500 to-gray-600',
      glow: 'shadow-slate-500/40',
      action: async () => { router.push('/portal/dashboard'); return { success: true, message: 'Going home →' } },
    },
  ]

  /* ── Voice recording handlers ───────────────────────────────── */
  const handleMouseDown = async () => {
    if (!user || !isLoaded || !voiceRecorderRef.current || !voiceCommandClientRef.current) return
    setIsPressed(true)
    if (rippleRef.current) {
      const r = document.createElement('div')
      r.className = 'absolute inset-0 bg-white/30 rounded-full animate-ripple'
      rippleRef.current.appendChild(r)
      setTimeout(() => r.parentNode?.removeChild(r), 600)
    }
    pressTimeoutRef.current = setTimeout(async () => {
      try {
        setCommandState(prev => ({ ...prev, isRecording: true, error: null }))
        await voiceRecorderRef.current?.startRecording()
        setShowChat(true)
        chatTimeoutRef.current && clearTimeout(chatTimeoutRef.current)
        setPanelOpen(false)
      } catch (e) {
        setCommandState(prev => ({ ...prev, error: `Recording failed: ${e}`, isRecording: false }))
      }
    }, 500)
  }

  const stopRecordingAndProcess = useCallback(async () => {
    try {
      setCommandState(prev => ({ ...prev, isRecording: false, isProcessing: true }))
      refreshChat()
      const recordingResult = await voiceRecorderRef.current?.stopRecording()
      if (!recordingResult) throw new Error('No recording data')
      const result = await voiceCommandClientRef.current?.processVoiceCommand(recordingResult.audioBlob)
      if (result) {
        // Handle location-required attendance
        if (result.executionResult?.error === 'LOCATION_REQUIRED' && result.executionResult?.data?.requiresClientLocationRequest) {
          setCommandState(prev => ({ ...prev, transcription: result.transcription, intent: result.intent, success: false, error: null }))
          refreshChat()
          const locResult = await requestLocationPermission({ enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 })
          if (!locResult.granted) {
            showLocationPermissionMessage(locResult.error || 'Location required', locResult.userDeclined)
            setCommandState(prev => ({ ...prev, isProcessing: false, error: 'Location permission denied' }))
            return
          }
          const res = await fetch(result.executionResult.data.apiEndpoint, {
            method: result.executionResult.data.method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...result.executionResult.data.payload, location: locResult.location }),
          })
          const d = await res.json()
          if (d.success) {
            setCommandState(prev => ({ ...prev, success: true, isProcessing: false }))
            window.dispatchEvent(new CustomEvent('voiceCommandSuccess', { detail: { action: result.intent, timestamp: new Date().toISOString() } }))
          } else {
            setCommandState(prev => ({ ...prev, error: d.message || 'Command failed', isProcessing: false }))
          }
          refreshChat()
          hideChatAfterSuccess()
          setTimeout(() => setCommandState({ isRecording: false, isProcessing: false, transcription: '', intent: null, error: null, success: false, nodeProgress: [], currentNode: undefined, nodeStatus: 'idle' }), 3000)
          return
        }

        setCommandState(prev => ({
          ...prev,
          transcription: result.transcription,
          intent: result.intent,
          success: result.success,
          isProcessing: false,
          nodeProgress: result.nodeStatus?.nodeProgress || [],
          currentNode: result.nodeStatus?.currentNode,
          nodeStatus: result.nodeStatus?.nodeStatus,
        }))
        refreshChat()

        if ((result.intent === 'clock_in' || result.intent === 'clock_out') && result.executionResult?.success !== false) {
          window.dispatchEvent(new CustomEvent('voiceCommandSuccess', { detail: { action: result.intent, timestamp: new Date().toISOString(), userId: user?.id, success: true } }))
        }

        const dest = result.executionResult?.data?.destination || result.payload?.destination ||
          (((result.intent === 'apply_leave' || result.intent === 'request_leave') && result.executionResult?.success !== false) ? '/portal/leaves' : null)
        if (dest) router.push(dest)

        hideChatAfterSuccess()
        setTimeout(() => setCommandState({ isRecording: false, isProcessing: false, transcription: '', intent: null, error: null, success: false, nodeProgress: [], currentNode: undefined, nodeStatus: 'idle' }), 3000)
      } else {
        throw new Error('No result from voice command processing')
      }
    } catch (e) {
      setCommandState(prev => ({ ...prev, error: `Processing failed: ${e}`, isRecording: false, isProcessing: false }))
    }
  }, [user, router, refreshChat, hideChatAfterSuccess])

  const handleMouseUp = useCallback(async () => {
    setIsPressed(false)
    pressTimeoutRef.current && clearTimeout(pressTimeoutRef.current)
    if (commandState.isRecording) await stopRecordingAndProcess()
  }, [commandState.isRecording, stopRecordingAndProcess])

  if (!mounted) return null

  const isVoiceSupported = typeof window !== 'undefined' &&
    navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'

  const isBusy = commandState.isRecording || commandState.isProcessing

  return (
    <div className="fixed bottom-6 right-6 z-20 flex flex-col items-end gap-3">

      {/* Toast */}
      {toast && <Toast message={toast.message} success={toast.success} onDone={() => setToast(null)} />}

      {/* Voice chat */}
      {showChat && (
        <div className="pointer-events-auto transition-all duration-300 animate-fade-in">
          <div className="voice-chat-container relative rounded-2xl shadow-2xl p-4 max-w-sm">
            <VoiceCommandChatSimple
              maxMessages={5}
              className="text-xs"
              refreshTrigger={chatRefreshTrigger}
              showProcessingSteps={isBusy || commandState.success}
              processingState={{
                isRecording: commandState.isRecording,
                isProcessing: commandState.isProcessing,
                transcription: commandState.transcription,
                intent: commandState.intent?.intent,
                success: commandState.success,
                error: commandState.error,
                nodeProgress: commandState.nodeProgress || [],
                currentNode: commandState.currentNode,
                nodeStatus: commandState.nodeStatus,
              }}
            />
          </div>
        </div>
      )}

      {/* Quick Actions Panel */}
      {panelOpen && !isBusy && (
        <div className="pointer-events-auto animate-fade-in">
          <div className="bg-gray-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-5 w-72">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-black text-sm">Quick Actions</h3>
                <p className="text-white/40 text-[10px] mt-0.5">or hold 🎙️ to speak</p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* User chip */}
            {user && (
              <div className="flex items-center gap-2.5 mb-4 p-2.5 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-bold truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-white/40 text-[10px] truncate">{user.primaryEmailAddressId ? user.emailAddresses?.[0]?.emailAddress : 'Active session'}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-400 text-[10px] font-bold">Online</span>
                </div>
              </div>
            )}

            {/* Actions grid */}
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map(action => (
                <button
                  key={action.id}
                  disabled={!!runningAction}
                  onClick={() => execAction(action.id, action.action)}
                  className={`relative flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-gradient-to-br ${action.color}
                               text-white text-xs font-bold transition-all duration-200 shadow-lg ${action.glow}
                               hover:scale-[1.04] hover:shadow-xl active:scale-[0.97]
                               disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                               ${action.id === 'dashboard' ? 'col-span-2' : ''}`}>
                  {runningAction === action.id
                    ? <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    : action.icon}
                  {action.label}
                </button>
              ))}
            </div>

            {/* Voice tip */}
            {isVoiceSupported && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/10">
                <MicrophoneIcon className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <p className="text-white/50 text-[10px]">Hold the mic button to give a voice command</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAB row */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {/* Panel toggle */}
        <button
          onClick={() => setPanelOpen(p => !p)}
          disabled={isBusy}
          className={`h-12 px-4 rounded-2xl flex items-center gap-2 text-white text-xs font-bold
                       shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50
                       ${panelOpen
                         ? 'bg-gray-800 border border-white/20'
                         : 'border border-white/20'
                       }`}
          style={panelOpen ? {} : { background: 'linear-gradient(135deg,#1e1e2e,#302b63)' }}>
          <ChevronUpIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${panelOpen ? 'rotate-180' : ''}`} />
          Actions
        </button>

        {/* Mic FAB */}
        <button
          className={`relative w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ease-out
            ${isPressed ? 'scale-90' : 'scale-100 hover:scale-105'}
            ${isBusy
              ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-red-500/50'
              : commandState.success
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/50'
              : commandState.error
              ? 'bg-gradient-to-br from-red-600 to-red-700 shadow-red-500/50'
              : 'shadow-orange-500/50'}`}
          style={(!isBusy && !commandState.success && !commandState.error) ? { background: 'linear-gradient(135deg,#c2410c,#ea580c,#f97316)' } : {}}
          onClick={() => { if (!isBusy) showChatTemporarily() }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setIsPressed(false); pressTimeoutRef.current && clearTimeout(pressTimeoutRef.current) }}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          aria-label="Voice assistant"
          disabled={commandState.isProcessing || !user}>
          <div ref={rippleRef} className="absolute inset-0 rounded-full overflow-hidden" />
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            {commandState.isProcessing
              ? <ArrowPathIcon className="w-6 h-6 text-white animate-spin" />
              : commandState.success
              ? <CheckCircleIcon className="w-6 h-6 text-white" />
              : commandState.error
              ? <XCircleIcon className="w-6 h-6 text-white" />
              : <MicrophoneIcon className="w-6 h-6 text-white" />}
          </div>
          {commandState.isRecording && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
              <div className="absolute inset-0 rounded-full bg-red-300 animate-pulse" />
            </>
          )}
          {commandState.success && (
            <>
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default MicIcon
