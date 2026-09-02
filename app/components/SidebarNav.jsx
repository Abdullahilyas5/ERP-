'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import {
  LayoutDashboard,
  LineChart,
  BarChart3,
  Package,
  Boxes,
  ArrowLeftRight,
  Building2,
  ShoppingCart,
  Receipt,
  Users2,
  CreditCard,
  Newspaper,
  Wallet,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Store,
  Settings,
} from 'lucide-react';

const navigationGroups = [
  {
    groupTitle: 'Overview & Insights',
    items: [
      { href: '/overview', label: 'Overview', permission: 'dashboard', icon: LayoutDashboard },
      { href: '/financial-reports', label: 'Financial Reports', permission: 'financialReports', icon: LineChart },
      { href: '/reports', label: 'Reports & Analytics', permission: 'reports', icon: BarChart3 },
    ],
  },
  {
    groupTitle: 'Inventory & Operations',
    items: [
      { href: '/products', label: 'Products', permission: 'products', icon: Package },
      { href: '/inventory', label: 'Inventory', permission: 'inventory', icon: Boxes },
      { href: '/warehouses', label: 'Warehouses', permission: 'warehouses', icon: Building2 },
      { href: '/stock-transfers', label: 'Stock Transfers', permission: 'stockTransfers', icon: ArrowLeftRight },
      { href: '/suppliers', label: 'Suppliers', permission: 'suppliers', icon: Building2 },
    ],
  },
  {
    groupTitle: 'Sales & Checkout',
    items: [
      { href: '/pos', label: 'POS Terminal', permission: 'pos', icon: ShoppingCart, badge: 'Live' },
      { href: '/sales', label: 'Sales Orders', permission: 'sales', icon: Receipt },
      { href: '/customers', label: 'Customers', permission: 'customers', icon: Users2 },
      { href: '/payments', label: 'Payments', permission: 'payments', icon: CreditCard },
    ],
  },
  {
    groupTitle: 'Marketing & Content',
    items: [
      { href: '/cms', label: 'CMS & Announcements', permission: 'cms', icon: Newspaper, badge: 'CMS' },
    ],
  },
  {
    groupTitle: 'Administration & Finance',
    items: [
      { href: '/expenses', label: 'Expenses', permission: 'expenses', icon: Wallet },
      { href: '/users', label: 'Users & Permissions', permission: 'users', icon: ShieldCheck },
      { href: '/settings', label: 'My settings', icon: Settings },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const permissions = user?.permissions || [];

  return (
    <aside className="w-full max-w-[270px] shrink-0 rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md transition-all">
      {/* Brand Header */}
      <div className="mb-6 flex items-center gap-3 px-2 pt-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-200">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-emerald-700">Enterprise Suite</p>
          <h1 className="text-lg font-black tracking-tight text-slate-900">Supermarket ERP</h1>
        </div>
      </div>

      {/* User Info Capsule */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-800">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-900">{user?.name || 'Guest User'}</p>
            <p className="truncate text-[11px] font-medium capitalize text-slate-500">{user?.role?.replace('_', ' ') || 'Guest'}</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-800">
          Online
        </span>
      </div>

      {/* Grouped Navigation */}
      <nav className="space-y-5">
        {navigationGroups.map((group) => {
          // Filter items based on permissions
          const visibleItems = group.items.filter((item) => {
            return permissions.includes(item.permission);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.groupTitle} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                {group.groupTitle}
              </p>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-semibold transition ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-200'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-xl transition ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-700'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>{item.label}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight
                          className={`h-3.5 w-3.5 transition ${
                            isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-500'
                          }`}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Logout Button */}
      <button
        type="button"
        onClick={logout}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 active:scale-[0.99]"
      >
        <LogOut className="h-4 w-4" />
        <span>Sign Out</span>
      </button>

      {/* Store Banner Mini Card */}
      <div className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-3.5 text-white shadow-lg shadow-slate-200">
        <div className="relative z-10">
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
            System Live
          </span>
          <p className="mt-2 text-sm font-bold">Main Store Terminal</p>
          <p className="mt-0.5 text-[11px] text-slate-400">All services operational</p>
        </div>
        <div className="pointer-events-none absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-emerald-500/10 blur-xl"></div>
      </div>
    </aside>
  );
}
