'use client'

/**
 * Dev-safe Clerk hook replacements.
 *
 * In development WITHOUT a Clerk publishable key, these hooks use 
 * localStorage to mock a real login session for the HR and Employee portals.
 */

import { useState, useEffect } from 'react'
import { DEV_BYPASS_ENABLED, DEV_USER } from '../devAuth'

import { useUser, useAuth, useClerk, SignOutButton as ClerkSignOutButton } from '@clerk/nextjs'

// Function to safely get the current mock user from local storage
const getLocalDevUser = () => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('dev_auth_user');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function useDevSafeUser() {
  if (!DEV_BYPASS_ENABLED) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useUser();
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [session, setSession] = useState<{ user: any, isLoaded: boolean, isSignedIn: boolean }>({
    user: null,
    isLoaded: false,
    isSignedIn: false
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const localUser = getLocalDevUser();
    setSession({
      user: localUser,
      isLoaded: true,
      isSignedIn: !!localUser
    });
  }, []);

  return session;
}

export function useDevSafeAuth() {
  if (!DEV_BYPASS_ENABLED) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAuth();
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [authOutput, setAuthOutput] = useState<{ isLoaded: boolean, isSignedIn: boolean, userId: string | null, sessionId: string | null, signOut: () => Promise<void> }>({
    isLoaded: false,
    isSignedIn: false,
    userId: null,
    sessionId: null,
    signOut: async () => {},
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const localUser = getLocalDevUser();
    setAuthOutput({
      isLoaded: true,
      isSignedIn: !!localUser,
      userId: localUser?.id || null,
      sessionId: localUser ? 'dev_session_id' : null,
      signOut: async () => {
        localStorage.removeItem('dev_auth_user');
        window.location.href = '/portal/auth';
      }
    });
  }, []);

  return authOutput;
}

export function useDevSafeClerk() {
  if (!DEV_BYPASS_ENABLED) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useClerk();
  }

  return {
    signOut: async () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dev_auth_user');
        window.location.href = '/portal/auth';
      }
    },
    openUserProfile: () => {},
  }
}

import React from 'react'
export function SignOutButton({ children, ...props }: any) {
  if (!DEV_BYPASS_ENABLED) {
    return React.createElement(ClerkSignOutButton, props, children);
  }

  return React.createElement(
    'div',
    {
      onClick: () => {
        localStorage.removeItem('dev_auth_user');
        window.location.href = '/portal/auth';
      },
      ...props
    },
    children
  );
}
