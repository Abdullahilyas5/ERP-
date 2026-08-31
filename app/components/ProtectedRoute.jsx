'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './AuthProvider';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const router = useRouter();
  const { user, token, ready } = useAuth();

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!token || !user) {
      router.replace('/login');
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      router.replace('/');
    }
  }, [allowedRoles, ready, router, token, user]);

  if (!ready || !token || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading dashboard...
      </div>
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return null;
  }

  return children;
}
