'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';
import { useAuth } from '../components/AuthProvider';

const ALL_MODULE_CARDS = [
  { title: 'Products',          href: '/products',          metric: 'Catalog',      tone: 'from-emerald-500 to-teal-500',     permission: 'products' },
  { title: 'Inventory',         href: '/inventory',         metric: 'Monitoring',   tone: 'from-amber-500 to-orange-500',     permission: 'inventory' },
  { title: 'Customers',         href: '/customers',         metric: 'Profiles',     tone: 'from-violet-500 to-purple-500',    permission: 'customers' },
  { title: 'POS',               href: '/pos',               metric: 'Checkout',     tone: 'from-sky-500 to-cyan-500',         permission: 'pos' },
  { title: 'Sales',             href: '/sales',             metric: 'Orders',       tone: 'from-rose-500 to-pink-500',        permission: 'sales' },
  { title: 'Reports',           href: '/reports',            metric: 'Analytical',   tone: 'from-indigo-500 to-violet-500',    permission: 'reports' },
  { title: 'Users',             href: '/users',             metric: 'Management',   tone: 'from-slate-500 to-gray-500',       permission: 'users' },
  { title: 'Stock Transfers',   href: '/stock-transfers',   metric: 'Transfers',    tone: 'from-teal-500 to-cyan-500',        permission: 'stockTransfers' },
  { title: 'Payments',          href: '/payments',          metric: 'Payables',     tone: 'from-emerald-600 to-emerald-400',  permission: 'payments' },
  { title: 'Expenses',          href: '/expenses',          metric: 'Operational',  tone: 'from-amber-600 to-amber-400',      permission: 'expenses' },
  { title: 'Financial Reports', href: '/financial-reports', metric: 'P&L / Balance', tone: 'from-slate-600 to-slate-400',     permission: 'financialReports' },
];

export default function OverviewPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const permissions = user?.permissions || [];

  const visibleModules = ALL_MODULE_CARDS.filter((mod) =>
    permissions.includes(mod.permission)
  );

  useEffect(()=>{ async function load(){ try{ const d = await apiFetch('/dashboard'); setDashboard(d); }catch(err){ console.error(err); } finally{ setLoading(false); } } load(); },[]);

  return (
    <ModuleLayout title="Operations Overview" subtitle="Track supermarket performance across products, inventory, customers, POS, and sales.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross Sales" value={dashboard?.grossSales || '$0'} change="—" accent="emerald" />
        <StatCard label="Inventory Value" value={dashboard?.inventoryValue || '$0'} change="—" accent="amber" />
        <StatCard label="Active Customers" value={dashboard?.activeCustomers || 0} change="—" accent="violet" />
        <StatCard label="Transactions" value={dashboard?.transactions || 0} change="—" accent="sky" />
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">ERP modules</h3>
          <span className="text-sm text-slate-500">System ready</span>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleModules.map((mod) => (
            <ModuleCard key={mod.permission} title={mod.title} href={mod.href} metric={mod.metric} tone={mod.tone} />
          ))}
        </div>
      </section>
    </ModuleLayout>
  );
}

function StatCard({ label, value, change, accent }) {
  const colors = { emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', violet: 'bg-violet-50 text-violet-700', sky: 'bg-sky-50 text-sky-700' };
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[accent]}`}>{change}</span>
      </div>
      <p className="mt-5 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ModuleCard({ title, href, metric, tone }) {
  return (
    <Link href={href} className={`group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md`}>
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} text-lg font-bold text-white`}>{title.charAt(0)}</div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Module</p>
      <h4 className="mt-2 text-xl font-bold text-slate-900">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-600">{metric}</p>
    </Link>
  );
}
