'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import {
  LayoutDashboard,
  LineChart,
  BarChart3,
  Package,
  PackageSearch,
  ArrowLeftRight,
  Building2,
  Truck,
  ShoppingCart,
  Receipt,
  Users2,
  CreditCard,
  Newspaper,
  Wallet,
  ShieldCheck,
  LogOut,
  ChevronRight,
  PanelLeftOpen,
  PanelLeftClose,
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
      { href: '/inventory', label: 'Inventory', permission: 'inventory', icon: PackageSearch },
      { href: '/warehouses', label: 'Warehouses', permission: 'warehouses', icon: Building2 },
      { href: '/stock-transfers', label: 'Stock Transfers', permission: 'stockTransfers', icon: ArrowLeftRight },
      { href: '/suppliers', label: 'Suppliers', permission: 'suppliers', icon: Truck },
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

export function SidebarNav({ collapsed = false, onToggle }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const permissions = user?.permissions || [];
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside className={`flex w-full min-w-0 shrink-0 flex-col overflow-x-hidden overflow-y-hidden rounded-2xl border border-slate-200/80 bg-slate-50 p-2 transition-all sm:rounded-3xl sm:p-3 lg:sticky lg:top-0 lg:h-full lg:rounded-none lg:border-0 lg:p-3 ${collapsed ? 'lg:max-w-[76px]' : 'lg:max-w-[260px]'}`}>
      <div className={`mb-3 flex min-w-0 items-center justify-between px-1 pt-1 ${collapsed ? 'lg:justify-center' : ''}`}>
        <div className={`flex items-center gap-2 ${collapsed ? 'lg:hidden' : ''}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Store className="h-5 w-5 shrink-0" strokeWidth={2.25} />
          </div>
          <span className="text-sm font-semibold text-slate-800">GreenCart ERP</span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
        >
          <ToggleIcon className="h-5 w-5 shrink-0" strokeWidth={2.25} />
        </button>
      </div>

      {/* Grouped Navigation */}
      <nav className={`min-h-0 max-h-[40vh] min-w-0 flex-1 overflow-x-hidden overflow-y-auto pr-1 lg:max-h-none lg:space-y-3 ${collapsed ? 'lg:px-0' : 'px-1'}`}>
        {navigationGroups.map((group) => {
          // Filter items based on permissions
          const visibleItems = group.items.filter((item) => {
            // Settings is available to every authenticated user, while module
            // links remain restricted to the permissions granted by the server.
            return !item.permission || permissions.includes(item.permission);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.groupTitle} className="min-w-0 space-y-1">
              <p className={`px-2.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400 ${collapsed ? 'lg:hidden' : ''}`}>
                {group.groupTitle}
              </p>
              <div className="space-y-2.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`group flex min-h-11 min-w-0 items-center justify-between rounded-lg px-2.5 py-2.5 text-[13px] font-medium transition ${collapsed ? 'lg:mx-auto lg:w-11 lg:justify-center lg:px-0' : ''} ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                            isActive
                              ? 'bg-emerald-200 text-emerald-800'
                              : 'bg-slate-200 text-slate-500 group-hover:bg-white group-hover:text-emerald-700'
                          }`}
                        >
                          <Icon className="h-[22px] w-[22px] shrink-0" strokeWidth={2.25} />
                        </span>
                        <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                      </span>

                      <div className={`flex items-center gap-1.5 ${collapsed ? 'lg:hidden' : ''}`}>
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
                            isActive ? 'text-emerald-700' : 'text-slate-300 group-hover:text-slate-500'
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

      <div className={`mt-4 flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 ${collapsed ? 'lg:mx-auto lg:w-11 lg:justify-center lg:border-0 lg:bg-transparent lg:p-0' : ''}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-800">
          {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
        </div>
        <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
          <p className="truncate text-xs font-semibold text-slate-900">{user?.name || 'Guest User'}</p>
          <p className="truncate text-[11px] capitalize text-slate-500">{user?.role?.replace('_', ' ') || 'Guest'}</p>
        </div>
        <span className={`h-2 w-2 rounded-full bg-emerald-500 ${collapsed ? 'lg:hidden' : ''}`} title="Online" />
      </div>

      {/* Logout Button */}
      <button
        type="button"
        onClick={logout}
        className={`mt-3 flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-red-600 bg-red-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm shadow-red-200 transition hover:border-red-700 hover:bg-red-700 active:scale-[0.99] ${collapsed ? 'lg:mx-auto lg:w-11 lg:px-0' : ''}`}
      >
        <LogOut className="h-5 w-5 shrink-0" strokeWidth={2.5} />
        <span className={collapsed ? 'lg:hidden' : ''}>Sign Out</span>
      </button>

    </aside>
  );
}
