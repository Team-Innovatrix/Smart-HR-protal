'use client'

import { SignIn, SignUp } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { DEV_USER } from '../../../lib/devAuth'

export default function HRPortalAuthPage() {
  const [showSignUp, setShowSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [devAuthError, setDevAuthError] = useState<string | null>(null)

  useEffect(() => {
    // Check if Clerk is properly configured
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    if (!publishableKey) {
      setError('Authentication is not configured. Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.')
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    )
  }

  const handleDevSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setDevAuthError(null);
    const email = (document.getElementById('dev-email') as HTMLInputElement).value;
    const password = (document.getElementById('dev-password') as HTMLInputElement).value;

    // Admin (Mohit)
    if (email === 'mohit@inovatrix.io' && password === 'mohit 123') {
      const devAdminUser = {
        id: DEV_USER.userId,
        firstName: DEV_USER.firstName,
        lastName: DEV_USER.lastName,
        fullName: `${DEV_USER.firstName} ${DEV_USER.lastName}`,
        emailAddresses: [{ emailAddress: DEV_USER.email, id: 'dev_email' }],
        primaryEmailAddressId: 'dev_email',
        imageUrl: '',
        username: 'dev-admin',
        publicMetadata: { role: DEV_USER.role },
      };
      localStorage.setItem('dev_auth_user', JSON.stringify(devAdminUser));
      window.location.href = '/portal/admin';

    // Legacy employee
    } else if (email === 'employee@inovatrix.io' && password === 'employee 123') {
      const devEmployeeUser = {
        id: 'dev_user_emp_002',
        firstName: 'Jane',
        lastName: 'Doe',
        fullName: 'Jane Doe',
        emailAddresses: [{ emailAddress: 'employee@inovatrix.io', id: 'dev_email_emp' }],
        primaryEmailAddressId: 'dev_email_emp',
        imageUrl: '',
        username: 'dev-emp',
        publicMetadata: { role: 'Employee' },
      };
      localStorage.setItem('dev_auth_user', JSON.stringify(devEmployeeUser));
      window.location.href = '/portal/dashboard';

    // Rudra Bambal — Employee ID: EMP006
    } else if ((email === 'rudra@inovatrix.io' || email === 'EMP006') && password === 'test123') {
      const rudraUser = {
        id: 'dev_user_rudra_006',
        firstName: 'Rudra',
        lastName: 'Bambal',
        fullName: 'Rudra Bambal',
        emailAddresses: [{ emailAddress: 'rudra@inovatrix.io', id: 'dev_email_rudra' }],
        primaryEmailAddressId: 'dev_email_rudra',
        imageUrl: '',
        username: 'rudra-bambal',
        publicMetadata: { role: 'Employee', employeeId: 'EMP006', department: 'Engineering', position: 'Software Engineer' },
      };
      localStorage.setItem('dev_auth_user', JSON.stringify(rudraUser));
      window.location.href = '/portal/dashboard';

    // Viplav Bhure — Employee ID: EMP007
    } else if ((email === 'viplav@inovatrix.io' || email === 'EMP007') && password === 'test123') {
      const viklavUser = {
        id: 'dev_user_viplav_007',
        firstName: 'Viplav',
        lastName: 'Bhure',
        fullName: 'Viplav Bhure',
        emailAddresses: [{ emailAddress: 'viplav@inovatrix.io', id: 'dev_email_viplav' }],
        primaryEmailAddressId: 'dev_email_viplav',
        imageUrl: '',
        username: 'viplav-bhure',
        publicMetadata: { role: 'Employee', employeeId: 'EMP007', department: 'Engineering', position: 'Backend Engineer' },
      };
      localStorage.setItem('dev_auth_user', JSON.stringify(viklavUser));
      window.location.href = '/portal/dashboard';

    } else {
      setDevAuthError('Invalid credentials. Please check your email/Employee ID and password.');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
           style={{ background: 'linear-gradient(135deg,#fff7ed 0%,#ffffff 50%,#fffbf7 100%)' }}>

        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden">

          {/* Orange header */}
          <div className="p-8 text-white relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg,#ea580c,#f97316,#fb923c)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 text-2xl font-black">
                T
              </div>
              <h1 className="text-2xl font-black tracking-tight">Employee Portal</h1>
              <p className="text-orange-100 text-sm mt-1">Local Development Mode</p>
            </div>
          </div>

          <div className="p-8">
            {devAuthError && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl text-center font-medium">
                {devAuthError}
              </div>
            )}

            <form onSubmit={handleDevSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
                  Email / Employee ID
                </label>
                <input
                  id="dev-email"
                  type="text"
                  required
                  className="w-full h-11 border-2 border-orange-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-200
                             rounded-xl px-4 text-sm outline-none transition-all"
                  placeholder="email@inovatrix.io or EMP006"
                  defaultValue="rudra@inovatrix.io"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Password</label>
                <input
                  id="dev-password"
                  type="password"
                  required
                  className="w-full h-11 border-2 border-orange-100 focus:border-orange-400 focus:ring-2 focus:ring-orange-200
                             rounded-xl px-4 text-sm outline-none transition-all"
                  placeholder="Enter password"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 text-white font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.01] mt-2"
                style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}
              >
                Sign In →
              </button>
            </form>

            {/* Credentials reference */}
            <div className="mt-8 pt-6 border-t border-orange-100">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Available Accounts</p>
              <div className="space-y-2">
                {[
                  { role: 'Admin', name: 'Mohit Mohatkar', id: 'mohit@inovatrix.io', pw: 'mohit 123', color: 'bg-violet-100 text-violet-700', badge: 'HR Manager' },
                  { role: 'Employee', name: 'Rudra Bambal', id: 'rudra@inovatrix.io or EMP006', pw: 'test123', color: 'bg-orange-100 text-orange-700', badge: 'EMP006' },
                  { role: 'Employee', name: 'Viplav Bhure', id: 'viplav@inovatrix.io or EMP007', pw: 'test123', color: 'bg-amber-100 text-amber-700', badge: 'EMP007' },
                ].map(u => (
                  <div
                    key={u.name}
                    className="flex items-center gap-3 p-3 bg-orange-50 rounded-2xl border border-orange-100 cursor-pointer
                               hover:bg-orange-100 transition-colors"
                    onClick={() => {
                      (document.getElementById('dev-email') as HTMLInputElement).value = u.id.split(' or ')[0];
                      (document.getElementById('dev-password') as HTMLInputElement).value = u.pw;
                    }}
                  >
                    <div className={`text-xs font-bold px-2 py-1 rounded-lg ${u.color}`}>{u.badge}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-neutral-800 truncate">{u.name}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{u.id} · pw: {u.pw}</p>
                    </div>
                    <span className="text-[10px] text-orange-400 font-medium">click to fill</span>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/hr" className="inline-flex items-center justify-center w-full mt-5 py-2.5 text-sm
                                         text-neutral-600 hover:text-orange-600 transition-colors font-medium gap-1">
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Corporate Site
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to HR Home */}
        <div className="mb-6">
          <Link 
            href="/hr" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to HR Module
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8 w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">HR Portal</h1>
          <p className="text-base text-gray-600">
            {showSignUp ? 'Create your account to access the HR portal' : 'Please sign in to access the HR portal'}
          </p>
        </div>
        
        {/* Toggle between Sign In and Sign Up */}
        <div className="flex mb-8 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200">
          <button
            onClick={() => setShowSignUp(false)}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 ${
              !showSignUp 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setShowSignUp(true)}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 ${
              showSignUp 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Authentication Form Container */}
        <div className="w-full flex justify-center">
          {showSignUp ? (
            <SignUp
              routing="hash"
              afterSignUpUrl="/hr/portal/dashboard"
              fallbackRedirectUrl="/hr/portal/dashboard"
              appearance={{
                elements: {
                  rootBox: 'w-full max-w-sm',
                  card: 'shadow-none bg-transparent p-0 m-0 border-0',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton: 'w-full h-11 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-200 rounded-lg font-medium px-4 shadow-none',
                  socialButtonsBlockButtonText: 'text-gray-700 font-medium text-sm',
                  socialButtonsBlockButtonArrow: 'hidden',
                  socialButtonsBlockButtonIcon: 'w-5 h-5',
                  dividerLine: 'bg-gray-200 h-px',
                  dividerText: 'text-gray-500 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-3 text-sm',
                  formButtonPrimary: 'w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 text-sm px-4 shadow-none',
                  formFieldInput: 'w-full h-11 border border-gray-200 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white text-sm shadow-none',
                  formFieldLabel: 'text-gray-700 font-medium mb-2 text-sm',
                  formFieldLabelRow: 'mb-2',
                  formFieldInputShowPasswordButton: 'text-gray-500 hover:text-gray-700',
                  formFieldInputShowPasswordButtonIcon: 'w-4 h-4',
                  formFieldError: 'text-red-600 text-xs mt-1',
                  formResendCodeLink: 'text-blue-600 hover:text-blue-700 font-medium text-sm',
                  footerActionLink: 'text-blue-600 hover:text-blue-700 font-medium text-sm',
                  footerActionText: 'text-gray-600 text-sm',
                  identityPreviewText: 'text-gray-700 text-sm',
                  identityPreviewEditButton: 'text-blue-600 hover:text-blue-700 text-sm',
                  formHeaderTitle: 'hidden',
                  formHeaderSubtitle: 'hidden',
                  alert: 'rounded-lg border border-gray-200 p-3 bg-white shadow-none',
                  alertText: 'text-sm',
                  alertIcon: 'w-4 h-4',
                  verificationCodeFieldInput: 'w-12 h-11 border border-gray-200 rounded-lg px-2 text-center text-base font-mono focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white shadow-none',
                  formFieldCheckbox: 'rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4',
                  formFieldCheckboxLabel: 'text-gray-700 text-sm ml-2',
                  formFieldCheckboxLabelRow: 'items-center',
                  formFieldRow: 'mb-4',
                  formField: 'mb-4',
                  form: 'space-y-4',
                  socialButtonsBlock: 'space-y-3 mb-4',
                  formFields: 'space-y-4',
                  formActions: 'mt-6',
                  footer: 'mt-6 pt-4 border-t border-gray-200',
                  // Override any potential card-like styling
                  main: 'shadow-none bg-transparent p-0 m-0 border-0',
                  pageScrollBox: 'shadow-none bg-transparent p-0 m-0 border-0',
                  scrollBox: 'shadow-none bg-transparent p-0 m-0 border-0',
                  page: 'shadow-none bg-transparent p-0 m-0 border-0',
                  content: 'shadow-none bg-transparent p-0 m-0 border-0',
                  container: 'shadow-none bg-transparent p-0 m-0 border-0',
                },
                variables: {
                  colorPrimary: '#2563eb',
                  colorText: '#111827',
                  colorTextSecondary: '#4b5563',
                  colorBackground: 'transparent',
                  colorInputBackground: '#ffffff',
                  colorInputText: '#111827',
                  colorBorder: '#e5e7eb',
                  colorSuccess: '#059669',
                  colorDanger: '#dc2626',
                  colorWarning: '#d97706',
                  colorNeutral: '#6b7280',
                  borderRadius: '0.5rem',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: {
                    normal: '400',
                    medium: '500',
                    semibold: '600',
                    bold: '700',
                  },
                  spacingUnit: '4px',
                },
              }}
            />
          ) : (
            <SignIn
              routing="hash"
              afterSignInUrl="/hr/portal/dashboard"
              fallbackRedirectUrl="/hr/portal/dashboard"
              appearance={{
                elements: {
                  rootBox: 'w-full max-w-sm',
                  card: 'shadow-none bg-transparent p-0 m-0 border-0',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton: 'w-full h-11 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-200 rounded-lg font-medium px-4 shadow-none',
                  socialButtonsBlockButtonText: 'text-gray-700 font-medium text-sm',
                  socialButtonsBlockButtonArrow: 'hidden',
                  socialButtonsBlockButtonIcon: 'w-5 h-5',
                  dividerLine: 'bg-gray-200 h-px',
                  dividerText: 'text-gray-500 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-3 text-sm',
                  formButtonPrimary: 'w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 text-sm px-4 shadow-none',
                  formFieldInput: 'w-full h-11 border border-gray-200 rounded-lg px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white text-sm shadow-none',
                  formFieldLabel: 'text-gray-700 font-medium mb-2 text-sm',
                  formFieldLabelRow: 'mb-2',
                  formFieldInputShowPasswordButton: 'text-gray-500 hover:text-gray-700',
                  formFieldInputShowPasswordButtonIcon: 'w-4 h-4',
                  formFieldError: 'text-red-600 text-xs mt-1',
                  formResendCodeLink: 'text-blue-600 hover:text-blue-700 font-medium text-sm',
                  footerActionLink: 'text-blue-600 hover:text-blue-700 font-medium text-sm',
                  footerActionText: 'text-gray-600 text-sm',
                  identityPreviewText: 'text-gray-700 text-sm',
                  identityPreviewEditButton: 'text-blue-600 hover:text-blue-700 text-sm',
                  formHeaderTitle: 'hidden',
                  formHeaderSubtitle: 'hidden',
                  alert: 'rounded-lg border border-gray-200 p-3 bg-white shadow-none',
                  alertText: 'text-sm',
                  alertIcon: 'w-4 h-4',
                  verificationCodeFieldInput: 'w-12 h-11 border border-gray-200 rounded-lg px-2 text-center text-base font-mono focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white shadow-none',
                  formFieldRow: 'mb-4',
                  formField: 'mb-4',
                  form: 'space-y-4',
                  socialButtonsBlock: 'space-y-3 mb-4',
                  formFields: 'space-y-4',
                  formActions: 'mt-6',
                  footer: 'mt-6 pt-4 border-t border-gray-200',
                  // Override any potential card-like styling
                  main: 'shadow-none bg-transparent p-0 m-0 border-0',
                  pageScrollBox: 'shadow-none bg-transparent p-0 m-0 border-0',
                  scrollBox: 'shadow-none bg-transparent p-0 m-0 border-0',
                  page: 'shadow-none bg-transparent p-0 m-0 border-0',
                  content: 'shadow-none bg-transparent p-0 m-0 border-0',
                  container: 'shadow-none bg-transparent p-0 m-0 border-0',
                },
                variables: {
                  colorPrimary: '#2563eb',
                  colorText: '#111827',
                  colorTextSecondary: '#4b5563',
                  colorBackground: 'transparent',
                  colorInputBackground: '#ffffff',
                  colorInputText: '#111827',
                  colorBorder: '#e5e7eb',
                  colorSuccess: '#059669',
                  colorDanger: '#dc2626',
                  colorWarning: '#d97706',
                  colorNeutral: '#6b7280',
                  borderRadius: '0.5rem',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: {
                    normal: '400',
                    medium: '500',
                    semibold: '600',
                    bold: '700',
                  },
                  spacingUnit: '4px',
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
