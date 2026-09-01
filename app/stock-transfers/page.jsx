'use client';

import { useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { stockTransferRecords, warehouseCatalog } from '../data/erp-data';

const statusClasses = {
  Approved: 'bg-emerald-100 text-emerald-700',
  'In Transit': 'bg-sky-100 text-sky-700',
  Pending: 'bg-amber-100 text-amber-700',
  Completed: 'bg-violet-100 text-violet-700',
  Rejected: 'bg-rose-100 text-rose-700',
};

export default function StockTransfersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');

  const filteredTransfers = useMemo(() => {
    return stockTransferRecords.filter((transfer) => {
      const matchesSearch =
        !search ||
        transfer.product.toLowerCase().includes(search.toLowerCase()) ||
        transfer.id.toLowerCase().includes(search.toLowerCase()) ||
        transfer.from.toLowerCase().includes(search.toLowerCase()) ||
        transfer.to.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
      const matchesWarehouse =
        warehouseFilter === 'all' ||
        transfer.from === warehouseFilter ||
        transfer.to === warehouseFilter;

      return matchesSearch && matchesStatus && matchesWarehouse;
    });
  }, [search, statusFilter, warehouseFilter]);

  const warehouseOptions = warehouseCatalog.map((warehouse) => warehouse.name);
  const totalQty = filteredTransfers.reduce((sum, item) => sum + item.qty, 0);
  const totalValue = filteredTransfers.reduce((sum, item) => sum + item.value, 0);

  return (
    <ModuleLayout
      title="Stock Transfers"
      subtitle="Monitor internal stock movement between warehouses and retail locations."
      allowedRoles={['owner', 'admin', 'manager', 'warehouse_staff']}
      headerActions={
        <button
          type="button"
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:from-emerald-500 hover:to-teal-500"
        >
          New transfer
        </button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Transfers" value={filteredTransfers.length} subtitle="Current filter" accent="emerald" />
          <SummaryCard label="Units moved" value={totalQty.toLocaleString()} subtitle="Across visible routes" accent="sky" />
          <SummaryCard label="Value moved" value={`$${totalValue.toLocaleString()}`} subtitle="Inventory value" accent="amber" />
          <SummaryCard label="Pending" value={filteredTransfers.filter((item) => item.status === 'Pending').length} subtitle="Awaiting approval" accent="rose" />
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔎</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search transfer ID, product or warehouse..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All statuses</option>
                <option value="Approved">Approved</option>
                <option value="In Transit">In Transit</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={warehouseFilter}
                onChange={(event) => setWarehouseFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All warehouses</option>
                {warehouseOptions.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>{warehouse}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Transfer</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Route</th>
                  <th className="px-4 py-3 font-semibold">Qty</th>
                  <th className="px-4 py-3 font-semibold">Value</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Requested by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                      No transfer records match the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">{transfer.id}</div>
                        <div className="text-xs text-slate-500">{transfer.movedAt}</div>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-800">{transfer.product}</td>
                      <td className="px-4 py-4">
                        <div>{transfer.from}</div>
                        <div className="text-xs text-slate-500">→ {transfer.to}</div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{transfer.qty}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">${transfer.value.toLocaleString()}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[transfer.status] || 'bg-slate-100 text-slate-600'}`}>
                          {transfer.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{transfer.requestedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ModuleLayout>
  );
}

function SummaryCard({ label, value, subtitle, accent }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
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
