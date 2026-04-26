'use client'

/**
 * Clerk hook re-exports.
 *
 * These are simple pass-throughs to real Clerk hooks.
 * The dev-bypass pattern has been removed — the app always uses real Clerk auth.
 */

import { useUser, useAuth, useClerk, SignOutButton as ClerkSignOutButton } from '@clerk/nextjs'

export function useDevSafeUser() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useUser()
}

export function useDevSafeAuth() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useAuth()
}

export function useDevSafeClerk() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useClerk()
}

import React from 'react'
export function SignOutButton({ children, ...props }: any) {
  return React.createElement(ClerkSignOutButton, props, children)
}
