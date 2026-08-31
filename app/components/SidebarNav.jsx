'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';

const fallbackModules = [
  { href: '/overview', label: 'Overview', permission: 'dashboard', icon: '◫' },
  { href: '/products', label: 'Products', permission: 'products', icon: '▣' },
  { href: '/inventory', label: 'Inventory', permission: 'inventory', icon: '◭' },
  { href: '/customers', label: 'Customers', permission: 'customers', icon: '◎' },
  { href: '/pos', label: 'POS', permission: 'pos', icon: '◬' },
  { href: '/sales', label: 'Sales', permission: 'sales', icon: '◨' },
  { href: '/reports', label: 'Reports', permission: 'reports', icon: '◳' },
  { href: '/users', label: 'Users', permission: 'users', icon: '◍' },
  { href: '/stock-transfers', label: 'Stock Transfers', permission: 'stockTransfers', icon: '⇄' },
  { href: '/payments', label: 'Payments', permission: 'payments', icon: '◈' },
  { href: '/expenses', label: 'Expenses', permission: 'expenses', icon: '◐' },
  { href: '/financial-reports', label: 'Financial Reports', permission: 'financialReports', icon: '◴' },
];

export function SidebarNav() {
  const { user, logout } = useAuth();
  const permissions = user?.permissions || [];

  const visibleNavItems = fallbackModules.filter((item) => {
    if (item.permission === 'dashboard') return true;
    return permissions.includes(item.permission);
  });

  return (
    <aside className="w-full max-w-[260px] rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-200">
          S
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Supermarket</p>
          <h1 className="text-xl font-bold text-slate-900">ERP Hub</h1>
        </div>
      </div>

      <div className="mb-6 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Signed in</p>
        <p className="mt-2 font-semibold text-slate-900">{user?.name || 'Guest'}</p>
        <p className="text-xs text-slate-500">{user?.role || 'No role'}</p>
      </div>

      <nav className="space-y-2">
        {visibleNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between rounded-2xl border border-transparent px-3 py-3 text-sm font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-base group-hover:bg-emerald-100">
                {item.icon}
              </span>
              {item.label}
            </span>
            <span className="text-xs text-slate-400">→</span>
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={logout}
        className="mt-6 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-700"
      >
        Log out
      </button>

      <div className="mt-8 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-lg shadow-emerald-200">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Today</p>
        <p className="mt-3 text-3xl font-bold">$9,840</p>
        <p className="mt-2 text-sm text-emerald-100">Sales completed</p>
      </div>
    </aside>
  );
}
