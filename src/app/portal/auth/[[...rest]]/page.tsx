'use client'

import { SignIn, SignUp } from '@clerk/nextjs'
import { useState } from 'react'
import Link from 'next/link'
import { DEV_USER } from '../../../lib/devAuth'

// Synchronous check — NEXT_PUBLIC_* vars are inlined at build time
const IS_DEV_BYPASS = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

/* ─── animated orb ─────────────────────────────────────────────── */
function Orb({ className }: { className: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-30 animate-pulse ${className}`} />
  )
}

/* ─── feature bullet ────────────────────────────────────────────── */
function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-base flex-shrink-0">
        {icon}
      </div>
      <span className="text-white/80 text-sm font-medium">{text}</span>
    </div>
  )
}

/* ─── account chip ──────────────────────────────────────────────── */
function AccountChip({
  initial, name, role, email, password, onFill, color,
}: {
  initial: string; name: string; role: string; email: string; password: string;
  onFill: (e: string, p: string) => void; color: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onFill(email, password)}
      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200 text-left group"
    >
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-lg`}>
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-bold truncate">{name}</p>
        <p className="text-white/50 text-[10px] truncate">{role} · pw: {password}</p>
      </div>
      <span className="text-white/30 text-[10px] group-hover:text-white/60 transition-colors flex-shrink-0">fill →</span>
    </button>
  )
}

export default function HRPortalAuthPage() {
  const [showSignUp, setShowSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const handleDevSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setIsLogging(true)

    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        localStorage.setItem('dev_auth_user', JSON.stringify(data.user));
        // Redirect logic based on role
        if (data.user.publicMetadata?.role === 'Admin') {
          window.location.href = '/portal/admin';
        } else {
          window.location.href = '/portal/dashboard';
        }
      } else {
        setAuthError(data.error || 'Invalid credentials.');
        setIsLogging(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setAuthError('Network error connecting to login server.');
      setIsLogging(false);
    }
  }

  /* ── Clerk mode (real auth) ─────────────────────────────────────── */
  if (!IS_DEV_BYPASS) {
    return (
      <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
          <Orb className="w-96 h-96 bg-orange-500 -top-24 -left-24" />
          <Orb className="w-64 h-64 bg-violet-500 bottom-32 right-0" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-2xl shadow-xl">🚀</div>
              <div>
                <div className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Innovatrix</div>
                <div className="text-white font-black text-base leading-none">Smart Dashboard</div>
              </div>
            </div>
            <h2 className="text-5xl font-black text-white leading-tight mb-4">
              The future of<br />
              <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                HR management
              </span>
            </h2>
            <p className="text-white/60 text-base mb-10 leading-relaxed">
              One dashboard to manage your entire workforce — attendance, leaves, analytics, and AI-powered insights.
            </p>
            <div className="space-y-4">
              <Feature icon="📊" text="Real-time workforce analytics" />
              <Feature icon="🤖" text="AI-powered predictive insights" />
              <Feature icon="🛡️" text="Risk intelligence & compliance" />
              <Feature icon="⚡" text="Instant attendance tracking" />
            </div>
          </div>
          <p className="relative z-10 text-white/30 text-xs">© 2026 Innovatrix · Smart Dashboard</p>
        </div>

        {/* Right panel — Clerk */}
        <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 bg-white/[0.03] backdrop-blur-sm">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black text-white mb-1">{showSignUp ? 'Create account' : 'Welcome back'}</h2>
              <p className="text-white/50 text-sm">{showSignUp ? 'Join Innovatrix Smart Dashboard' : 'Sign in to your workspace'}</p>
            </div>
            <div className="flex mb-6 bg-white/10 rounded-2xl p-1">
              {['Sign In', 'Sign Up'].map((label, i) => (
                <button key={label} onClick={() => setShowSignUp(i === 1)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${(showSignUp ? i === 1 : i === 0) ? 'bg-white text-gray-900 shadow-lg' : 'text-white/60 hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="w-full flex justify-center">
              {showSignUp
                ? <SignUp routing="hash" afterSignUpUrl="/portal/dashboard" fallbackRedirectUrl="/portal/dashboard" />
                : <SignIn routing="hash" afterSignInUrl="/portal/dashboard" fallbackRedirectUrl="/portal/dashboard" />
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Dev bypass mode ──────────────────────────────────────────────── */
  // Only shown when IS_DEV_BYPASS is true (no Clerk key configured)
  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#1a0533 100%)' }}>

      {/* ── LEFT PANEL ───────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] p-14 relative overflow-hidden">
        {/* Animated orbs */}
        <Orb className="w-[500px] h-[500px] bg-orange-600 -top-40 -left-40" />
        <Orb className="w-80 h-80 bg-violet-600 top-1/2 -right-20" />
        <Orb className="w-56 h-56 bg-amber-400 bottom-20 left-40" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-2xl shadow-2xl">🚀</div>
            <div>
              <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Innovatrix</div>
              <div className="text-white font-black text-lg leading-none tracking-tight">Smart Dashboard</div>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-3">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Day 1 · Company is Live
            </span>
          </div>
          <h2 className="text-5xl xl:text-6xl font-black text-white leading-[1.05] mb-6">
            The smartest<br />
            <span className="inline bg-gradient-to-r from-orange-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">
              HR platform
            </span><br />
            on earth.
          </h2>
          <p className="text-white/55 text-base leading-relaxed mb-12 max-w-md">
            Manage your entire workforce from a single command centre. 
            Real-time analytics, AI-powered insights, and beautiful design — built for Day 1.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '📊', text: 'Live Analytics' },
              { icon: '🤖', text: 'AI Predictions' },
              { icon: '✅', text: 'Attendance Tracking' },
              { icon: '🛡️', text: 'Risk Intelligence' },
              { icon: '📋', text: 'Leave Management' },
              { icon: '⚡', text: 'Instant Reports' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-2.5 bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                <span className="text-lg">{f.icon}</span>
                <span className="text-white/70 text-xs font-semibold">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/20 text-xs">© 2026 Innovatrix · All rights reserved</p>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Subtle right panel bg */}
        <div className="absolute inset-0 bg-white/[0.02]" />

        <div className="relative z-10 w-full max-w-[400px]">

          {/* Card */}
          <div className="bg-white/[0.09] backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-2xl">

            {/* Header */}
            <div className="mb-8">
              {/* Mobile brand (hidden on lg) */}
              <div className="flex items-center gap-2.5 mb-6 lg:hidden">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-xl">🚀</div>
                <div className="text-white font-black text-sm">Innovatrix Smart Dashboard</div>
              </div>
              <h1 className="text-2xl font-black text-white mb-1">Welcome back 👋</h1>
              <p className="text-white/50 text-sm">Sign in to your workspace</p>
            </div>

            {/* Error banner */}
            {authError && (
              <div className="mb-5 flex items-center gap-2.5 bg-red-500/15 border border-red-400/30 rounded-2xl px-4 py-3">
                <span className="text-red-300 text-base">⚠️</span>
                <p className="text-red-300 text-xs font-medium">{authError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleDevSignIn} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">
                  Email / Employee ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="mohit@innovatrix.io"
                    className="w-full h-12 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-white/30
                               px-4 text-sm font-medium outline-none focus:border-orange-400/60 focus:bg-white/15
                               transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-white/60 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-white/30
                               px-4 pr-12 text-sm font-medium outline-none focus:border-orange-400/60 focus:bg-white/15
                               transition-all duration-200"
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors text-sm">
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLogging}
                className="w-full h-12 rounded-2xl font-black text-white text-sm transition-all duration-200
                           hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] disabled:opacity-60 disabled:scale-100
                           flex items-center justify-center gap-2 mt-2"
                style={{ background: isLogging ? '#ea580c99' : 'linear-gradient(135deg,#c2410c,#ea580c,#f97316)' }}
              >
                {isLogging
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
                  : <>Sign In to Workspace →</>
                }
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs font-semibold uppercase tracking-wider">Dynamic Simulator</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Sandbox Notice */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-white text-sm leading-relaxed">
              <span className="text-blue-300 font-bold block mb-1">50 Employee DB active</span>
              You can log in as the CEO or any auto-generated employee.
              <ul className="mt-2 space-y-1 text-white/70">
                <li>• <strong className="text-white/90">CEO:</strong> mohit@innovatrix.io (Pass: mohit 123)</li>
                <li>• <strong className="text-white/90">Employees:</strong> Try any generated email (Pass: test123)</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-white/25 text-xs mt-6">
            Innovatrix Smart Dashboard · Day 1 · Local Dev Mode
          </p>
        </div>
      </div>
    </div>
  )
}
