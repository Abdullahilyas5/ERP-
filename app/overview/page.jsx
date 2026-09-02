'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';
import { useAuth } from '../components/AuthProvider';
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
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  AlertTriangle,
  Store,
  Calendar,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

const SYSTEM_MODULES = [
  { title: 'Products Catalogue', href: '/products', permission: 'products', icon: Package, tone: 'from-emerald-500 to-teal-600', desc: 'Active master items & SKU catalog' },
  { title: 'Inventory Levels', href: '/inventory', permission: 'inventory', icon: Boxes, tone: 'from-blue-500 to-indigo-600', desc: 'Stock audits, valuation & alerts' },
  { title: 'POS Cashier Terminal', href: '/pos', permission: 'pos', icon: ShoppingCart, tone: 'from-emerald-600 to-teal-700', desc: 'Live register & checkout terminal' },
  { title: 'Sales Orders', href: '/sales', permission: 'sales', icon: Receipt, tone: 'from-sky-500 to-blue-600', desc: 'Customer sales receipts & revenue' },
  { title: 'Suppliers & Vendors', href: '/suppliers', permission: 'suppliers', icon: Building2, tone: 'from-amber-500 to-orange-600', desc: 'Vendor procurement directory' },
  { title: 'Store CMS & News', href: '/cms', permission: 'cms', icon: Newspaper, tone: 'from-purple-500 to-indigo-600', desc: 'Announcements, flyers & deal promos' },
  { title: 'Customer Profiles', href: '/customers', permission: 'customers', icon: Users2, tone: 'from-rose-500 to-pink-600', desc: 'Customer accounts & purchase logs' },
  { title: 'Financial Reports', href: '/financial-reports', permission: 'financialReports', icon: LineChart, tone: 'from-slate-700 to-slate-900', desc: 'P&L, balance sheets & tax summaries' },
  { title: 'Operating Expenses', href: '/expenses', permission: 'expenses', icon: Wallet, tone: 'from-red-500 to-amber-600', desc: 'Utility bills, rent & vendor payouts' },
  { title: 'User & Permissions', href: '/users', permission: 'users', icon: ShieldCheck, tone: 'from-teal-600 to-emerald-700', desc: 'Staff access & sidebar controls' },
];

export default function OverviewPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const permissions = user?.permissions || [];

  const visibleModules = SYSTEM_MODULES.filter((mod) =>
    permissions.includes(mod.permission)
  );

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, postsRes] = await Promise.all([
          apiFetch('/dashboard').catch(() => null),
          apiFetch('/posts?limit=3').catch(() => ({ posts: [] })),
        ]);
        setDashboard(dashRes);
        setAnnouncements(Array.isArray(postsRes) ? postsRes : (postsRes?.posts || []));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <ModuleLayout
      title="Store Operations & Executive Overview"
      subtitle="Enterprise-grade supermarket telemetry across sales, inventory health, staff performance, and customer engagement."
    >
      <div className="space-y-8">
        {/* Luxury Supermarket Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-950 text-white shadow-xl">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
            style={{ backgroundImage: "url('/images/supermarket_hero.jpg')" }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>

          <div className="relative z-10 flex flex-col justify-between p-6 md:p-10 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="h-3.5 w-3.5" />
                  Premium Retail Hub
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {dashboard?.metricDate ? `Metrics for ${dashboard.metricDate}` : 'Loading metrics...'}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white md:text-4xl">
                Welcome back, {user?.name || 'Store Director'}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                Real-time central command for stock logistics, active cash registers, customer transactions, and automated supplier replenishment.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 lg:mt-0">
              <Link
                href="/pos"
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400 active:scale-95"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Open POS Terminal</span>
              </Link>
              <Link
                href="/inventory"
                className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <Boxes className="h-4 w-4" />
                <span>Stock Audit</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Executive KPI Metrics */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <StatCard
            label="Gross Sales Revenue"
            value={dashboard ? dashboard.grossSales : '—'}
            subtitle="Today's paid register intake"
            accent="emerald"
            icon={TrendingUp}
            growth={formatComparison(dashboard?.comparisons?.grossSales, 'vs yesterday', loading)}
          />
          <StatCard
            label="Inventory Valuation"
            value={dashboard ? dashboard.inventoryValue : '—'}
            subtitle="Across all warehouse SKUs"
            accent="sky"
            icon={Package}
            growth={formatComparison(dashboard?.comparisons?.inventoryValue, 'vs yesterday', loading)}
          />
          <StatCard
            label="Active Customers"
            value={dashboard?.activeCustomers ?? '—'}
            subtitle={dashboard ? `${dashboard.newCustomersToday ?? 0} new customers today` : 'Loading metrics...'}
            accent="purple"
            icon={Users2}
            growth={formatComparison(dashboard?.comparisons?.activeCustomers, 'vs yesterday', loading)}
          />
          <StatCard
            label="Completed Orders"
            value={dashboard?.transactions ?? '—'}
            subtitle="Cash & card checkout tickets"
            accent="amber"
            icon={Receipt}
            growth={formatComparison(dashboard?.comparisons?.transactions, 'vs yesterday', loading)}
          />
        </div>

        {/* Two-Column Insights & CMS Bulletins */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Department Visual Highlights (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Store Departments & Live Modules</h3>
                <p className="text-xs text-slate-500">Quick navigation to authorized modules</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {visibleModules.length} Modules Active
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {visibleModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Link
                    key={mod.permission}
                    href={mod.href}
                    className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${mod.tone} text-white shadow-md`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-emerald-600" />
                    </div>

                    <div className="mt-4">
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                        {mod.title}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        {mod.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Column: Store News & Bulletins from CMS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Store Announcements</h3>
                <p className="text-xs text-slate-500">From CMS portal</p>
              </div>
              <Link href="/cms" className="text-xs font-bold text-emerald-700 hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-500">
                  <Newspaper className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-xs font-medium text-slate-600">No announcements published yet.</p>
                  <Link
                    href="/cms"
                    className="mt-3 inline-block rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow"
                  >
                    Create in CMS
                  </Link>
                </div>
              ) : (
                announcements.map((post) => (
                  <div
                    key={post._id || post.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 border border-emerald-200">
                        {post.category || 'Announcement'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="mt-2 text-sm font-bold text-slate-900 line-clamp-1">
                      {post.title}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {post.excerpt || post.content}
                    </p>
                  </div>
                ))
              )}

            </div>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}

function formatComparison(metric, label, loading) {
  if (loading) return <Loader2 className="h-3.5 w-3.5 animate-spin" aria-label="Loading comparison" />;
  if (!metric) return 'No comparison data';
  if (!metric.hasPreviousData || metric.changePercent == null) return 'No previous data';
  const prefix = metric.changePercent > 0 ? '+' : '';
  return `${prefix}${metric.changePercent}% ${label}`;
}

function StatCard({ label, value, subtitle, accent, icon: Icon, growth }) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
  };

  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="min-w-0 break-words text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${styles[accent]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 flex min-w-0 flex-wrap items-baseline justify-between gap-2">
        <p className="min-w-0 break-words text-2xl font-black tracking-tight text-slate-900">{value}</p>
        {growth && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
            {growth}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}
