'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export default function ReportsPage() {
  const [selectedRange, setSelectedRange] = useState('month');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [warehouseData, setWarehouseData] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await apiFetch('/reports');
        const data = response?.data ?? response ?? {};
        const rawWarehouseData = Array.isArray(data.warehouseData) ? data.warehouseData : Array.isArray(data.warehousePerformanceData) ? data.warehousePerformanceData : [];
        const normalizedWarehouseData = rawWarehouseData.map((item) => ({
          name: item?.name || item?.warehouse || 'Warehouse',
          warehouse: item?.warehouse || item?.name || 'Warehouse',
          revenue: toNumber(item?.revenue ?? item?.sales ?? item?.value ?? 0),
          margin: toNumber(item?.margin ?? item?.profitMargin ?? 0),
          expenses: toNumber(item?.expenses ?? item?.cost ?? 0),
        }));
        const normalizedProductData = (Array.isArray(data.productPerformance) ? data.productPerformance : []).map((item) => ({
          name: item?.name || item?.product || 'Product',
          sales: toNumber(item?.sales ?? item?.units ?? item?.value ?? 0),
          value: toNumber(item?.value ?? item?.revenue ?? 0),
        }));
        const normalizedCategoryData = (Array.isArray(data.categoryPerformance) ? data.categoryPerformance : []).map((item) => ({
          name: item?.name || item?.category || item?.label || 'Category',
          value: toNumber(item?.value ?? item?.share ?? item?.amount ?? 0),
        }));
        const rawTrend = Array.isArray(data.salesTrend) ? data.salesTrend : [];
        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const normalizedTrendData = rawTrend.map((item, index) => {
          if (typeof item === 'number') {
            return { label: monthLabels[index] || `P${index + 1}`, value: item };
          }
          return {
            label: item?.label || item?.month || monthLabels[index] || `P${index + 1}`,
            value: toNumber(item?.value ?? item?.revenue ?? item?.amount ?? 0),
          };
        });

        setWarehouseData(normalizedWarehouseData);
        setProductPerformance(normalizedProductData);
        setCategoryPerformance(normalizedCategoryData);
        setSalesTrend(normalizedTrendData);
      } catch (err) {
        console.error(err);
        setWarehouseData([]);
        setProductPerformance([]);
        setCategoryPerformance([]);
        setSalesTrend([]);
      }
    }

    loadData();
  }, []);

  const filteredWarehouseData = useMemo(() => {
    if (selectedWarehouse === 'all') return warehouseData;
    return warehouseData.filter((item) => (item.warehouse || item.name) === selectedWarehouse);
  }, [warehouseData, selectedWarehouse]);

  const totalRevenue = filteredWarehouseData.reduce((sum, item) => sum + toNumber(item.revenue), 0);
  const netSales = totalRevenue;
  const avgMargin = filteredWarehouseData.length
    ? filteredWarehouseData.reduce((sum, item) => sum + toNumber(item.margin), 0) / filteredWarehouseData.length
    : 0;
  const topProduct = productPerformance[0]?.name || 'N/A';

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
              <option key={item.warehouse || item.name} value={item.warehouse || item.name}>{item.warehouse || item.name}</option>
            ))}
          </select>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Revenue" value={`$${(totalRevenue / 1000).toFixed(1)}K`} subtitle="Gross sales" accent="emerald" />
          <SummaryCard label="Net sales" value={`$${(netSales / 1000).toFixed(1)}K`} subtitle="Recorded paid sales" accent="sky" />
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
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Live data</span>
            </div>

            <div className="flex h-64 items-end gap-2">
              {salesTrend.length > 0 ? salesTrend.map((point, index) => {
                const height = Math.max(12, Number(point.value || 0) / Math.max(...salesTrend.map((item) => Number(item.value || 0)), 1) * 100);
                return (
                  <div key={`${point.label}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t-2xl bg-gradient-to-t from-emerald-500 to-emerald-300" style={{ height: `${height}%` }} />
                    <span className="text-[10px] text-slate-400">{point.label}</span>
                  </div>
                );
              }) : <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">No sales trend data available.</div>}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sales by category</p>
            <div className="mt-6 space-y-4">
              {categoryPerformance.length > 0 ? categoryPerformance.map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{item.name}</span>
                    <span className="font-semibold text-slate-900">{Number(item.value || 0).toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${Math.min(Number(item.value || 0), 100)}%` }} />
                  </div>
                </div>
              )) : <div className="text-sm text-slate-500">No category performance data available.</div>}
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Top products</p>
            <div className="mt-5 space-y-4">
              {productPerformance.length > 0 ? productPerformance.map((product) => (
                <div key={product.name} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">#{Number(product.sales || 0)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{product.name}</p>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" style={{ width: `${Math.min((Number(product.sales || 0) / Math.max(...productPerformance.map((item) => Number(item.sales || 0)), 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              )) : <div className="text-sm text-slate-500">No product performance data available.</div>}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Warehouse performance</p>
            <div className="mt-5 space-y-4">
              {filteredWarehouseData.length > 0 ? filteredWarehouseData.map((item) => (
                <div key={item.warehouse || item.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{item.warehouse || item.name}</p>
                    <span className="text-xs font-semibold text-emerald-700">{Number(item.margin || 0).toFixed(1)}% margin</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">${(Number(item.revenue || 0) / 1000).toFixed(1)}K</p>
                      <p className="text-xs text-slate-500">Revenue</p>
                    </div>
                    <div className="h-16 w-28 overflow-hidden rounded-xl bg-white">
                      <div className="h-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${Math.min(Number(item.margin || 0) * 3, 100)}%` }} />
                    </div>
                  </div>
                </div>
              )) : <div className="text-sm text-slate-500">No warehouse data available for the selected range.</div>}
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
