'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'authorized' | 'denied'>('checking');

  useEffect(() => {
    fetch('/api/admin/auth/check')
      .then(r => r.json())
      .then(d => {
        if (d.authenticated) {
          setStatus('authorized');
        } else {
          router.replace('/portal/admin/login');
        }
      })
      .catch(() => {
        router.replace('/portal/admin/login');
      });
  }, [router]);

  if (status === 'checking') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #f8fafc, #eef2ff, #f0fdfa)' }}
        suppressHydrationWarning
      >
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
          </div>
          <p className="text-indigo-600 font-bold text-sm">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (status === 'denied') return null;

  return <>{children}</>;
}
