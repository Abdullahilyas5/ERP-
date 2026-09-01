'use client';

import { useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { categoryPerformance, productPerformance, salesTrend, warehousePerformanceData } from '../data/erp-data';

const warehouseData = warehousePerformanceData;

export default function ReportsPage() {
  const [selectedRange, setSelectedRange] = useState('month');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');

  const filteredWarehouseData = useMemo(() => {
    if (selectedWarehouse === 'all') return warehouseData;
    return warehouseData.filter((item) => item.warehouse === selectedWarehouse);
  }, [selectedWarehouse]);

  const totalRevenue = filteredWarehouseData.reduce((sum, item) => sum + item.revenue, 0);
  const netSales = totalRevenue * 0.82;
  const avgMargin = filteredWarehouseData.length
    ? filteredWarehouseData.reduce((sum, item) => sum + item.margin, 0) / filteredWarehouseData.length
    : 0;
  const topProduct = productPerformance[0].name;

  return (
    <ModuleLayout
      title="Reports & Analytics"
      subtitle="Operational performance, sales trends, and inventory insights across the business."
      allowedRoles={['owner', 'admin', 'manager']}
      headerActions={
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedRange}
            onChange={(event) => setSelectedRange(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="quarter">Quarter</option>
          </select>

          <select
            value={selectedWarehouse}
            onChange={(event) => setSelectedWarehouse(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All warehouses</option>
            {warehouseData.map((item) => (
              <option key={item.warehouse} value={item.warehouse}>{item.warehouse}</option>
            ))}
          </select>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Revenue" value={`$${(totalRevenue / 1000).toFixed(1)}K`} subtitle="Gross sales" accent="emerald" />
          <SummaryCard label="Net sales" value={`$${(netSales / 1000).toFixed(1)}K`} subtitle="After returns" accent="sky" />
          <SummaryCard label="Avg margin" value={`${avgMargin.toFixed(1)}%`} subtitle="Storewide" accent="violet" />
          <SummaryCard label="Top product" value={topProduct} subtitle="Best seller" accent="amber" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sales trend</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Revenue performance</h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">+18.2%</span>
            </div>

            <div className="flex h-64 items-end gap-2">
              {salesTrend.map((value, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-2xl bg-gradient-to-t from-emerald-500 to-emerald-300" style={{ height: `${value}%` }} />
                  <span className="text-[10px] text-slate-400">{index + 1}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sales by category</p>
            <div className="mt-6 space-y-4">
              {categoryPerformance.map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{item.name}</span>
                    <span className="font-semibold text-slate-900">{item.value}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Top products</p>
            <div className="mt-5 space-y-4">
              {productPerformance.map((product) => (
                <div key={product.name} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">#{product.sales}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{product.name}</p>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" style={{ width: `${(product.sales / 240) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Warehouse performance</p>
            <div className="mt-5 space-y-4">
              {filteredWarehouseData.map((item) => (
                <div key={item.warehouse} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{item.warehouse}</p>
                    <span className="text-xs font-semibold text-emerald-700">{item.margin}% margin</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">${(item.revenue / 1000).toFixed(1)}K</p>
                      <p className="text-xs text-slate-500">Revenue</p>
                    </div>
                    <div className="h-16 w-28 overflow-hidden rounded-xl bg-white">
                      <div className="h-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${Math.min(item.margin * 3, 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ModuleLayout>
  );
}

function SummaryCard({ label, value, subtitle, accent }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
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
