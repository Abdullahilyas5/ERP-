'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export default function FinancialReportsPage() {
  const [range, setRange] = useState('month');
  const [warehouse, setWarehouse] = useState('all');
  const [pAndLRows, setPAndLRows] = useState([]);
  const [cashFlow, setCashFlow] = useState([]);
  const [cashSummary, setCashSummary] = useState({ incoming: 0, outgoing: 0, netCash: 0, revenue: 0, expenses: 0 });
  const [warehouseMetrics, setWarehouseMetrics] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await apiFetch(`/financial-reports?range=${range}&warehouse=${encodeURIComponent(warehouse === 'all' ? '' : warehouse)}`);
        const data = response?.data ?? response ?? {};
        const rawWarehouseMetrics = Array.isArray(data.warehouseMetrics) ? data.warehouseMetrics : Array.isArray(data.warehouseData) ? data.warehouseData : [];
        const nextWarehouseMetrics = rawWarehouseMetrics.map((item) => ({
          name: item?.name || item?.warehouse || 'Warehouse',
          warehouse: item?.warehouse || item?.name || 'Warehouse',
          revenue: toNumber(item?.revenue ?? item?.sales ?? item?.value ?? 0),
          expenses: toNumber(item?.expenses ?? item?.totalExpenses ?? item?.cost ?? 0),
          profit: toNumber(item?.profit ?? (toNumber(item?.revenue ?? item?.sales ?? item?.value ?? 0) - toNumber(item?.expenses ?? item?.totalExpenses ?? item?.cost ?? 0))),
        }));
        const nextPAndLRows = (Array.isArray(data.pAndLRows) ? data.pAndLRows : []).map((row) => ({
          label: row?.label || row?.name || 'Line item',
          value: toNumber(row?.value ?? row?.amount ?? 0),
          type: row?.type || 'income',
        }));
        const rawCashFlow = Array.isArray(data.cashFlow) ? data.cashFlow : [];
        const nextCashFlow = rawCashFlow.map((point, index) => ({
          month: point?.month || point?.label || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][index] || `M${index + 1}`,
          incoming: toNumber(point?.incoming ?? point?.inflow ?? point?.income ?? 0),
          outgoing: toNumber(point?.outgoing ?? point?.outflow ?? point?.expense ?? 0),
          net: toNumber(point?.net ?? (toNumber(point?.incoming ?? point?.inflow ?? 0) - toNumber(point?.outgoing ?? point?.outflow ?? 0))),
        }));
        setPAndLRows(nextPAndLRows);
        setCashFlow(nextCashFlow);
        setCashSummary({
          incoming: toNumber(data.summary?.incoming ?? nextCashFlow.reduce((sum, item) => sum + item.incoming, 0)),
          outgoing: toNumber(data.summary?.outgoing ?? nextCashFlow.reduce((sum, item) => sum + item.outgoing, 0)),
          netCash: toNumber(data.summary?.netCash ?? nextCashFlow.reduce((sum, item) => sum + item.net, 0)),
          revenue: toNumber(data.summary?.revenue),
          expenses: toNumber(data.summary?.expenses),
        });
        setWarehouseMetrics(nextWarehouseMetrics);
      } catch (err) {
        console.error(err);
        setPAndLRows([]);
        setCashFlow([]);
        setCashSummary({ incoming: 0, outgoing: 0, netCash: 0, revenue: 0, expenses: 0 });
        setWarehouseMetrics([]);
      }
    }

    loadData();
  }, [range, warehouse]);

  const visibleMetrics = useMemo(() => {
    if (warehouse === 'all') return warehouseMetrics;
    return warehouseMetrics.filter((item) => (item.name || item.warehouse) === warehouse);
  }, [warehouseMetrics, warehouse]);

  const totalRevenue = cashSummary.revenue || visibleMetrics.reduce((sum, item) => sum + toNumber(item.revenue), 0);
  const totalExpenses = cashSummary.expenses || visibleMetrics.reduce((sum, item) => sum + toNumber(item.expenses), 0);
  const totalProfit = totalRevenue - totalExpenses;

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
            aria-label="Filter financial reports by time period"
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
            aria-label="Filter financial reports by warehouse"
          >
            <option value="all">All warehouses</option>
            {warehouseMetrics.map((item) => (
              <option key={item.name || item.warehouse} value={item.name || item.warehouse}>{item.name || item.warehouse}</option>
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
          <SummaryCard label="Margin" value={`${totalRevenue ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%`} subtitle="Profit margin" accent="violet" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">P&amp;L</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Income statement</h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Updated</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Account</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pAndLRows.length > 0 ? pAndLRows.map((row) => (
                    <tr key={row.label}>
                      <td className="px-4 py-3 font-medium text-slate-700">{row.label}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${row.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ${Number(row.value || 0).toLocaleString()}
                      </td>
                    </tr>
                      )) : <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-500">No P&amp;L data available.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Cash flow</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Money in vs. money out</h3>
                <p className="mt-1 text-xs text-slate-500">Recorded payments grouped by day or month.</p>
              </div>
              <p className={`text-right text-sm font-bold ${cashSummary.netCash >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                Net {formatCurrency(cashSummary.netCash)}
                <span className="block text-xs font-normal text-slate-500">Selected period</span>
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-600" aria-label="Cash flow legend">
              <span className="flex items-center gap-2 text-slate-600"><i className="h-3 w-3 rounded-sm bg-emerald-500" />Incoming ({formatCurrency(cashSummary.incoming)})</span>
              <span className="flex items-center gap-2 text-slate-600"><i className="h-3 w-3 rounded-sm bg-slate-400" />Outgoing ({formatCurrency(cashSummary.outgoing)})</span>
            </div>
            <div className="mt-5 flex h-56 items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 pt-4">
              {cashFlow.length > 0 ? cashFlow.map((point) => {
                const maxValue = Math.max(...cashFlow.map((item) => Math.max(item.incoming, item.outgoing)), 1);
                const incomingHeight = (point.incoming / maxValue) * 100;
                const outgoingHeight = (point.outgoing / maxValue) * 100;

                return (
                  <div key={point.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="flex h-40 w-full items-end justify-center gap-1">
                      <div title={`Incoming: ${formatCurrency(point.incoming)}`} aria-label={`${point.month} incoming: ${formatCurrency(point.incoming)}`} className="w-1/2 rounded-t-xl bg-emerald-500" style={{ height: `${Math.max(point.incoming ? 8 : 0, incomingHeight)}%` }} />
                      <div title={`Outgoing: ${formatCurrency(point.outgoing)}`} aria-label={`${point.month} outgoing: ${formatCurrency(point.outgoing)}`} className="w-1/2 rounded-t-xl bg-slate-300" style={{ height: `${Math.max(point.outgoing ? 8 : 0, outgoingHeight)}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">{point.month}</span>
                    <span className={`text-[10px] ${point.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(point.net)} net</span>
                  </div>
                );
              }) : <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">No cash flow data available.</div>}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Warehouse comparison</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visibleMetrics.length > 0 ? visibleMetrics.map((item) => (
              <div key={item.name || item.warehouse} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{item.name || item.warehouse}</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Revenue</span>
                    <span className="font-semibold text-slate-900">${Number(item.revenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expenses</span>
                    <span className="font-semibold text-slate-900">${Number(item.expenses || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit</span>
                    <span className="font-semibold text-emerald-600">${Number(item.profit || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )) : <div className="text-sm text-slate-500">No warehouse metrics available for the selected warehouse.</div>}
          </div>
        </section>
      </div>
    </ModuleLayout>
  );
}

function formatCurrency(value) {
  return `$${toNumber(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
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
