'use client'

import { SignIn } from '@clerk/nextjs'
import dynamic from 'next/dynamic'

function Orb({ className, animationClass }: { className: string, animationClass: string }) {
  return (
    <div className={`absolute rounded-full blur-[100px] opacity-40 ${className} ${animationClass}`} />
  )
}

function HRPortalAuthPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" 
         style={{ background: 'linear-gradient(135deg,#02110c,#062b1e,#041c14)' }} 
         suppressHydrationWarning>

      <style>{`
        @keyframes float {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -50px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes floatReverse {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-40px, 50px) scale(1.1); }
          66% { transform: translate(30px, -30px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-float-1 { animation: float 15s ease-in-out infinite; }
        .animate-float-2 { animation: floatReverse 12s ease-in-out infinite; }
      `}</style>

      {/* Background Orbs */}
      <Orb className="w-[600px] h-[600px] bg-emerald-600/30 top-0 left-0 -translate-x-1/2 -translate-y-1/2" animationClass="animate-float-1" />
      <Orb className="w-[500px] h-[500px] bg-teal-500/30 bottom-0 right-0 translate-x-1/3 translate-y-1/3" animationClass="animate-float-2" />
      <Orb className="w-[400px] h-[400px] bg-green-500/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" animationClass="animate-float-1" />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
        {/* Header Text */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white leading-tight mb-2 tracking-tight">
            Smart HR
          </h1>
          <p className="text-emerald-400 font-medium tracking-widest text-xs uppercase">
            Workforce Portal
          </p>
        </div>

        {/* Clerk Sign In */}
        <div className="w-full flex justify-center mb-12 shadow-2xl shadow-emerald-900/50 rounded-2xl">
          <SignIn 
            routing="hash" 
            afterSignInUrl="/portal/dashboard" 
            fallbackRedirectUrl="/portal/dashboard" 
            appearance={{
              variables: {
                colorText: 'white',
                colorPrimary: '#10b981',
                colorBackground: 'transparent',
                colorInputBackground: 'rgba(255,255,255,0.08)',
                colorInputText: 'white',
                colorTextSecondary: 'rgba(255,255,255,0.7)',
                colorNeutral: 'rgba(255,255,255,0.8)',
                colorDanger: '#ef4444',
                colorSuccess: '#22c55e',
                colorWarning: '#f59e0b',
                fontFamily: 'Inter, sans-serif',
              },
              elements: {
                footerAction: { display: 'none' },
                card: { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.05)' },
                formButtonPrimary: { backgroundColor: '#10b981', color: '#000', fontWeight: 'bold' },
                headerTitle: { color: 'white' },
                headerSubtitle: { color: 'rgba(255,255,255,0.7)' },
                socialButtonsBlockButton: { border: '1px solid rgba(255,255,255,0.1)', color: 'white' },
                socialButtonsBlockButtonText: { color: 'white' },
                socialButtonsBlockButtonArrow: { filter: 'brightness(0) invert(1)' },
                formFieldLabel: { color: 'rgba(255,255,255,0.9)' },
                formFieldInput: { border: '1px solid rgba(255,255,255,0.1)', color: 'white' },
                dividerLine: { backgroundColor: 'rgba(255,255,255,0.1)' },
                dividerText: { color: 'rgba(255,255,255,0.5)' },
                identityPreviewText: { color: 'white' },
                identityPreviewEditButtonIcon: { filter: 'brightness(0) invert(1)' },
                formResendCodeLink: { color: '#10b981' }
              }
            }}
          />
        </div>

        {/* Team Credits Footer */}
        <div className="text-center border-t border-white/10 pt-6 w-full">
          <h3 className="text-emerald-500/80 font-bold tracking-[0.2em] text-[10px] uppercase mb-4">
            Created by Team Innovatrix
          </h3>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-white/50 text-xs font-medium">
            <span>Mohit Mohatkar</span>
            <span className="text-emerald-500/30"></span>
            <span>Rudra Bambal</span>
            <span className="text-emerald-500/30"></span>
            <span>Viplav Bhure</span>
            <span className="text-emerald-500/30"></span>
            <span>Kartikey Kalbande</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(HRPortalAuthPage), { ssr: false })
