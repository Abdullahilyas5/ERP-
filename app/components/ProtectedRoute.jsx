'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './AuthProvider';

export function ProtectedRoute({ children, allowedRoles = [], requiredPermission }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, ready } = useAuth();
  const routePermission = requiredPermission || {
    '/overview': 'dashboard',
    '/financial-reports': 'financialReports',
    '/reports': 'reports',
    '/products': 'products',
    '/inventory': 'inventory',
    '/warehouses': 'warehouses',
    '/stock-transfers': 'stockTransfers',
    '/suppliers': 'suppliers',
    '/pos': 'pos',
    '/sales': 'sales',
    '/customers': 'customers',
    '/payments': 'payments',
    '/cms': 'cms',
    '/expenses': 'expenses',
    '/users': 'users',
  }[pathname];

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
      return;
    }
  }, [allowedRoles, ready, routePermission, router, token, user]);

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

  if (routePermission && !(user.permissions || []).includes(routePermission)) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-sm">
        <h2 className="text-xl font-bold">Permission required</h2>
        <p className="mt-2 text-sm">Your account is active, but the owner has not granted access to this module.</p>
      </div>
    );
  }

  return children;
}
