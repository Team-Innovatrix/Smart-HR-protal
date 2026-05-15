'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDevSafeUser } from '../../lib/hooks/useDevSafeClerk';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const { user, isLoaded } = useDevSafeUser();
  const [status, setStatus] = useState<'checking' | 'authorized' | 'denied'>('checking');

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        router.replace('/portal/auth');
      } else {
        const role = user.publicMetadata?.role as string;
        if (role === 'admin' || role === 'owner') {
          setStatus('authorized');
        } else {
          router.replace('/portal/admin/access-denied');
        }
      }
    }
  }, [isLoaded, user, router]);

  if (status === 'checking') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-base)' }}
        suppressHydrationWarning
      >
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--glass-border)]" />
            <div className="absolute inset-0 rounded-full border-4 border-t-[var(--accent)] animate-spin" />
          </div>
          <p className="text-[var(--accent)] font-bold text-sm">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (status === 'denied') return null;

  return <>{children}</>;
}
