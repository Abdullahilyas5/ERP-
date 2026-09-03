'use client';

import { Fragment, useEffect, useState } from 'react';
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

function localDateInputValue(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function defaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return localDateInputValue(date);
}

export default function OverviewPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = localDateInputValue();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(today);

  const permissions = user?.permissions || [];

  const visibleModules = SYSTEM_MODULES.filter((mod) =>
    permissions.includes(mod.permission)
  );

  useEffect(() => {
    const cacheKey = `erp-dashboard:${user?.id || user?.email || 'current'}:${startDate}:${endDate}`;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached?.dashboard) {
        Promise.resolve().then(() => {
          setDashboard(cached.dashboard);
          setAnnouncements(Array.isArray(cached.announcements) ? cached.announcements : []);
        });
      }
    } catch {
      // Ignore unavailable or malformed browser storage.
    }

    async function load() {
      try {
        const [dashRes, postsRes] = await Promise.all([
          apiFetch(`/dashboard?startDate=${startDate}&endDate=${endDate}&timezone=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')}`).catch(() => null),
          apiFetch('/posts?limit=3').catch(() => ({ posts: [] })),
        ]);
        const nextAnnouncements = Array.isArray(postsRes) ? postsRes : (postsRes?.posts || []);
        if (dashRes) setDashboard(dashRes);
        setAnnouncements((current) => (nextAnnouncements.length ? nextAnnouncements : current));
        if (dashRes) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify({ dashboard: dashRes, announcements: nextAnnouncements }));
          } catch {
            // Caching is best effort and must not affect the live dashboard.
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [startDate, endDate, user?.id, user?.email]);

  const trend = (Array.isArray(dashboard?.salesTrend) ? dashboard.salesTrend : []).map((item) => ({
    ...item,
    value: Number.isFinite(Number(item?.value)) ? Number(item.value) : 0,
  }));
  const maxTrend = Math.max(...trend.map((item) => item.value), 1);
  const heatmap = (Array.isArray(dashboard?.salesHeatmap) ? dashboard.salesHeatmap : []).map((item) => ({
    ...item,
    day: Number(item?.day),
    hour: Number(item?.hour),
    value: Number.isFinite(Number(item?.value)) ? Number(item.value) : 0,
  }));
  const maxHeat = Math.max(...heatmap.map((item) => item.value), 1);
  const heatDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <ModuleLayout
      title="Store Operations & Executive Overview"
      subtitle="Enterprise-grade supermarket telemetry across sales, inventory health, staff performance, and customer engagement."
    >
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,#d1fae5_0%,transparent_35%)]" />
          <div className="relative grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:p-10">
            <div className="min-w-0 self-center">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                  <Sparkles className="h-5 w-5 shrink-0" strokeWidth={2.25} />
                  Operations overview
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {dashboard?.metricDate ? `Last updated ${dashboard.metricDate}` : 'Preparing live metrics'}
                </span>
              </div>
              <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                Good morning, {user?.name || 'Store Director'}.
                <span className="mt-1 block text-emerald-600">Here is your store at a glance.</span>
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                Monitor the numbers that matter, spot operational changes early, and keep every part of your supermarket moving from one focused workspace.
              </p>
              <div className="mt-7 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Live sales visibility</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Inventory health</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Team-ready insights</span>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-700">Report period</p>
                    <p className="mt-1 text-[11px] text-slate-500">Adjust the data shown below</p>
                  </div>
                  <Calendar className="h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2.25} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-slate-600">
                    <span>Start date</span>
                    <input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} className="min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  </label>
                  <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-slate-600">
                    <span>End date</span>
                    <input type="date" value={endDate} min={startDate} max={today} onChange={(event) => setEndDate(event.target.value)} className="min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                href="/pos"
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400 active:scale-95"
              >
                <ShoppingCart className="h-[22px] w-[22px] shrink-0" strokeWidth={2.25} />
                <span>Open POS Terminal</span>
              </Link>
              <Link
                href="/inventory"
                className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
              >
                <Boxes className="h-[22px] w-[22px] shrink-0" strokeWidth={2.25} />
                <span>Stock Audit</span>
              </Link>
            </div>
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
            growth={formatComparison(dashboard?.comparisons?.grossSales, dashboard?.range?.days > 1 ? 'vs previous period' : 'vs yesterday', loading)}
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
            growth={formatComparison(dashboard?.comparisons?.transactions, dashboard?.range?.days > 1 ? 'vs previous period' : 'vs yesterday', loading)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Sales trend</h3>
                <p className="text-xs text-slate-500">Daily paid sales for the selected range</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {formatComparison(dashboard?.comparisons?.grossSales, 'vs previous period', loading)}
              </span>
            </div>
            <div className="mt-6 flex h-44 items-end gap-1.5">
              {trend.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">No paid sales in this range.</div>
              ) : trend.map((item) => (
                <div key={item.label} className="group flex h-full min-w-0 flex-1 flex-col justify-end" title={`${item.label}: $${item.value.toFixed(2)}`}>
                  <div className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-300 transition group-hover:from-emerald-400" style={{ height: `${Math.max((item.value / maxTrend) * 100, item.value ? 4 : 1)}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between gap-3 text-[10px] text-slate-400">
              <span className="truncate">{startDate || trend[0]?.label || '—'}</span>
              <span className="truncate text-right">{endDate || trend[trend.length - 1]?.label || '—'}</span>
            </div>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Sales activity heatmap</h3>
              <p className="text-xs text-slate-500">Revenue by day of week and hour</p>
            </div>
            <div className="mt-5 grid grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] gap-1 text-[9px]">
              <span />
              {[0, 4, 8, 12, 16, 20].map((hour) => <span key={hour} className="col-span-4 text-center text-slate-400">{hour}:00</span>)}
              {heatDays.map((day, dayIndex) => (
                <Fragment key={day}>
                  <span className="py-1 text-slate-400">{day}</span>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const cell = heatmap.find((item) => item.day === dayIndex && item.hour === hour);
                    const intensity = cell ? Math.max(15, (cell.value / maxHeat) * 100) : 0;
                    return <span key={`${day}-${hour}`} title={`${day} ${hour}:00 — $${(cell?.value || 0).toFixed(2)}`} className="h-4 rounded-sm bg-emerald-500" style={{ opacity: intensity / 100 }} />;
                  })}
                </Fragment>
              ))}
            </div>
          </section>
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
                        <Icon className="h-6 w-6 shrink-0" strokeWidth={2.1} />
                      </div>
                      <ArrowUpRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-emerald-600" strokeWidth={2.1} />
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
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${styles[accent]}`}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
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
