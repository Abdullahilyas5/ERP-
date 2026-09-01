'use client';

import { useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { financialDashboardData } from '../data/erp-data';

const { pAndLRows, cashFlow, warehouseMetrics } = financialDashboardData;

export default function FinancialReportsPage() {
  const [range, setRange] = useState('month');
  const [warehouse, setWarehouse] = useState('all');

  const visibleMetrics = useMemo(() => {
    if (warehouse === 'all') return warehouseMetrics;
    return warehouseMetrics.filter((item) => item.name === warehouse);
  }, [warehouse]);

  const totalRevenue = visibleMetrics.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = visibleMetrics.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = visibleMetrics.reduce((sum, item) => sum + item.profit, 0);

  return (
    <ModuleLayout
      title="Financial Reports"
      subtitle="Track revenue, cost control, cash flow, and margin performance across the retail network."
      allowedRoles={['owner', 'admin', 'manager', 'accountant']}
      headerActions={
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="quarter">Quarter</option>
            <option value="year">This year</option>
          </select>

          <select
            value={warehouse}
            onChange={(event) => setWarehouse(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All warehouses</option>
            {warehouseMetrics.map((item) => (
              <option key={item.name} value={item.name}>{item.name}</option>
            ))}
          </select>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Revenue" value={`$${(totalRevenue / 1000).toFixed(1)}K`} subtitle="Gross sales" accent="emerald" />
          <SummaryCard label="Expenses" value={`$${(totalExpenses / 1000).toFixed(1)}K`} subtitle="Operating costs" accent="rose" />
          <SummaryCard label="Net profit" value={`$${(totalProfit / 1000).toFixed(1)}K`} subtitle="After expenses" accent="sky" />
          <SummaryCard label="Margin" value={`${((totalProfit / totalRevenue) * 100).toFixed(1)}%`} subtitle="Profit margin" accent="violet" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">P&amp;L</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Income statement</h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Updated</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Account</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pAndLRows.map((row) => (
                    <tr key={row.label}>
                      <td className="px-4 py-3 font-medium text-slate-700">{row.label}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${row.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ${row.value.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Cash flow</p>
            <div className="mt-5 flex h-56 items-end gap-3">
              {cashFlow.map((point) => (
                <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-40 w-full items-end justify-center gap-1">
                    <div className="w-1/2 rounded-t-xl bg-emerald-500" style={{ height: `${point.inflow}%` }} />
                    <div className="w-1/2 rounded-t-xl bg-slate-300" style={{ height: `${point.outflow}%` }} />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">{point.month}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Warehouse comparison</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visibleMetrics.map((item) => (
              <div key={item.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{item.name}</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Revenue</span>
                    <span className="font-semibold text-slate-900">${item.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expenses</span>
                    <span className="font-semibold text-slate-900">${item.expenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit</span>
                    <span className="font-semibold text-emerald-600">${item.profit.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ModuleLayout>
  );
}

function SummaryCard({ label, value, subtitle, accent }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    sky: 'bg-sky-50 text-sky-700',
    violet: 'bg-violet-50 text-violet-700',
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[accent]}`}>{subtitle}</span>
      </div>
      <p className="mt-5 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
