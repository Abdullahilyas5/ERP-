'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useToast } from './ToastProvider';
import { LoaderCircle, Store } from 'lucide-react';

const moduleRoutes = [
  ['/overview', 'dashboard'],
  ['/financial-reports', 'financialReports'],
  ['/reports', 'reports'],
  ['/products', 'products'],
  ['/inventory', 'inventory'],
  ['/warehouses', 'warehouses'],
  ['/stock-transfers', 'stockTransfers'],
  ['/suppliers', 'suppliers'],
  ['/pos', 'pos'],
  ['/sales', 'sales'],
  ['/customers', 'customers'],
  ['/payments', 'payments'],
  ['/cms', 'cms'],
  ['/expenses', 'expenses'],
  ['/users', 'users'],
  ['/settings', null],
];

export function ProtectedRoute({ children, allowedRoles = [], requiredPermission }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, ready } = useAuth();
  const toast = useToast();
  const deniedPath = useRef('');
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
      const fallback = moduleRoutes.find(([, permission]) => (user.permissions || []).includes(permission))?.[0] || '/login';
      if (deniedPath.current !== pathname) {
        deniedPath.current = pathname;
        toast.error('Access denied', 'You do not have access to this module. Redirecting to an available module.');
      }
      router.replace(fallback);
      return;
    }

    if (routePermission && !(user.permissions || []).includes(routePermission)) {
      const fallback = moduleRoutes.find(([, permission]) => (user.permissions || []).includes(permission))?.[0] || '/login';
      if (deniedPath.current !== pathname) {
        deniedPath.current = pathname;
        toast.error('Access denied', 'You do not have access to this module. Redirecting to an available module.');
      }
      router.replace(fallback);
      return;
    }
  }, [allowedRoles, pathname, ready, routePermission, router, toast, token, user]);

  if (!ready || !token || !user) {
    return (
      <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-slate-100 px-6 text-slate-800">
        <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
            <Store className="h-8 w-8" />
            <LoaderCircle className="absolute -right-2 -top-2 h-6 w-6 animate-spin rounded-full bg-white p-1 text-emerald-600" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Supermarket ERP</p>
          <h2 className="mt-2 text-lg font-bold text-slate-900">Preparing your workspace</h2>
          <p className="mt-1 text-sm text-slate-500">Loading secure dashboard data...</p>
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) return null;
  if (routePermission && !(user.permissions || []).includes(routePermission)) return null;

  return children;
}
