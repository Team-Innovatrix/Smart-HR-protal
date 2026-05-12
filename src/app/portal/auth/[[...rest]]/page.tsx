'use client'

import { SignIn, SignUp } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'

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

function HRPortalAuthPage() {
  const [showSignUp, setShowSignUp] = useState(false)
  const [companyName, setCompanyName] = useState('HR Dashboard')
  const [companyLogo, setCompanyLogo] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.general) {
          if (data.data.general.companyName) setCompanyName(data.data.general.companyName)
          if (data.data.general.companyLogo) setCompanyLogo(data.data.general.companyLogo)
        }
      })
      .catch(console.error)
  }, [])

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }} suppressHydrationWarning>

      {/* ── LEFT PANEL ───────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] p-14 relative overflow-hidden">
        <Orb className="w-[500px] h-[500px] bg-orange-600 -top-40 -left-40" />
        <Orb className="w-80 h-80 bg-violet-600 top-1/2 -right-20" />
        <Orb className="w-56 h-56 bg-amber-400 bottom-20 left-40" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            {companyLogo ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-2xl">
                <Image src={companyLogo} alt={companyName} width={48} height={48} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-2xl shadow-2xl">🚀</div>
            )}
            <div>
              <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Workspace</div>
              <div className="text-white font-black text-lg leading-none tracking-tight">{companyName}</div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.05] mb-6">
            The smartest<br />
            <span className="inline bg-gradient-to-r from-orange-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">
              HR platform
            </span><br />
            on earth.
          </h1>
          <p className="text-white/55 text-base leading-relaxed mb-12 max-w-md">
            Manage your entire workforce from a single command centre.
            Real-time analytics, AI-powered insights, and beautiful design.
          </p>

          {/* Features */}
          <div className="space-y-4">
            <Feature icon="📊" text="Real-time workforce analytics" />
            <Feature icon="🤖" text="AI-powered predictive insights" />
            <Feature icon="🛡️" text="Risk intelligence & compliance" />
            <Feature icon="⚡" text="Instant attendance tracking" />
          </div>
        </div>

        <p className="relative z-10 text-white/20 text-xs">© {new Date().getFullYear()} {companyName} · All rights reserved</p>
      </div>

      {/* ── RIGHT PANEL — Clerk ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white/[0.03] backdrop-blur-sm">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            {/* Mobile brand */}
            <div className="flex items-center justify-center gap-2.5 mb-6 lg:hidden">
              {companyLogo ? (
                <div className="w-9 h-9 rounded-xl overflow-hidden">
                  <Image src={companyLogo} alt={companyName} width={36} height={36} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-xl">🚀</div>
              )}
              <div className="text-white font-black text-sm">{companyName}</div>
            </div>
            <h2 className="text-2xl font-black text-white mb-1">
              {showSignUp ? 'Create account' : 'Welcome back'}
            </h2>
            <p className="text-white/50 text-sm">
              {showSignUp ? `Join ${companyName}` : 'Sign in to your workspace'}
            </p>
          </div>

          {/* Sign In / Sign Up toggle */}
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
          {/* Admin Login tab */}
          <div className="mt-6 flex justify-center">
            <Link
              href="/portal/admin/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border border-white/10 hover:border-white/25 hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              <span>🛡️</span>
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrap with dynamic to avoid SSR mismatches from browser extensions
export default dynamic(() => Promise.resolve(HRPortalAuthPage), { ssr: false })
