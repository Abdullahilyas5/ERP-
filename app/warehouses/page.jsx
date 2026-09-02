'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const initialWarehouseForm = {
  code: '',
  name: '',
  location: '',
  manager: '',
  status: 'Active',
};

export default function WarehousesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialWarehouseForm);
  const [warehouseRows, setWarehouseRows] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [warehouseResponse, productResponse, transferResponse] = await Promise.all([
          apiFetch('/warehouses?page=1&limit=200').catch(() => apiFetch('/pos/warehouses')),
          apiFetch('/products?page=1&limit=200'),
          apiFetch('/stock-transfers?page=1&limit=200'),
        ]);

        const warehouseData = warehouseResponse?.items ?? warehouseResponse?.data?.items ?? warehouseResponse?.data ?? warehouseResponse ?? [];
        const productData = productResponse?.items ?? productResponse?.data?.items ?? productResponse?.data ?? productResponse ?? [];
        const transferData = transferResponse?.items ?? transferResponse?.data?.items ?? transferResponse?.data ?? transferResponse ?? [];

        if (Array.isArray(warehouseData) && warehouseData.length) {
          setWarehouseRows(
            warehouseData.map((warehouse) => {
              const warehouseId = String(warehouse._id || warehouse.id);
              const warehouseProducts = productData.filter((product) => String(product.warehouseId?._id || product.warehouseId || '') === warehouseId);
              const stockUnits = warehouseProducts.reduce((sum, product) => sum + Number(product.stock || 0), 0);
              const stockValue = warehouseProducts.reduce((sum, product) => sum + Number(product.costPrice || 0) * Number(product.stock || 0), 0);
              const transfers = transferData.filter((transfer) => String(transfer.fromWarehouseId) === warehouseId || String(transfer.toWarehouseId) === warehouseId).length;
              return { ...warehouse, stockUnits, stockValue, transfers, productCount: warehouseProducts.length };
            }),
          );
        }

        setRecentTransfers(Array.isArray(transferData) ? transferData.slice(0, 5) : []);
      } catch (err) {
        console.error(err);
        setWarehouseRows([]);
        setRecentTransfers([]);
      }
    }

    loadData();
  }, []);

  const filteredWarehouses = useMemo(() => {
    return warehouseRows.filter((warehouse) => {
      const matchesSearch =
        !search ||
        [warehouse.name, warehouse.location, warehouse.manager, warehouse.code]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || warehouse.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [warehouseRows, search, statusFilter]);

  const totalUnits = warehouseRows.reduce((sum, warehouse) => sum + toNumber(warehouse.stockUnits), 0);
  const totalValue = warehouseRows.reduce((sum, warehouse) => sum + toNumber(warehouse.stockValue), 0);
  const totalTransfers = warehouseRows.reduce((sum, warehouse) => sum + toNumber(warehouse.transfers), 0);

  function handleCreateWarehouse(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;

    apiFetch('/warehouses', {
      method: 'POST',
      body: JSON.stringify({
      code: form.code,
      name: form.name,
      location: form.location || 'New location',
      manager: form.manager || 'Unassigned',
      status: form.status,
      }),
    }).then((created) => {
      setWarehouseRows((current) => [{ ...created, stockUnits: 0, stockValue: 0, transfers: 0, productCount: 0 }, ...current]);
      setForm(initialWarehouseForm);
      setFormOpen(false);
    }).catch((err) => alert(err?.message || 'Unable to create warehouse.'));
  }

  return (
    <ModuleLayout
      title="Warehouses"
      subtitle="Operational visibility across storage locations, inventory value, transfer activity, and warehouse performance."
      allowedRoles={['owner', 'admin', 'manager', 'warehouse_staff']}
      headerActions={
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200"
        >
          Add warehouse
        </button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Warehouses" value={warehouseRows.length} subtitle="Active locations" accent="emerald" />
          <SummaryCard label="Stock units" value={totalUnits.toLocaleString()} subtitle="Across all stores" accent="sky" />
          <SummaryCard label="Inventory value" value={`$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} subtitle="Current cost basis" accent="amber" />
          <SummaryCard label="Transfers" value={totalTransfers} subtitle="Recent movement" accent="violet" />
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔎</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search warehouse, manager or location"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">All statuses</option>
              <option value="Active">Active</option>
              <option value="Standby">Standby</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Warehouse</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Manager</th>
                  <th className="px-4 py-3 font-semibold">Stock units</th>
                  <th className="px-4 py-3 font-semibold">Stock value</th>
                  <th className="px-4 py-3 font-semibold">Sales</th>
                  <th className="px-4 py-3 font-semibold">Purchases</th>
                  <th className="px-4 py-3 font-semibold">Transfers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredWarehouses.map((warehouse) => (
                  <tr key={warehouse.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{warehouse.name}</div>
                      <div className="text-xs text-slate-500">{warehouse.code}</div>
                    </td>
                    <td className="px-4 py-4">{warehouse.location}</td>
                    <td className="px-4 py-4">{warehouse.manager}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{toNumber(warehouse.stockUnits).toLocaleString()}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">${toNumber(warehouse.stockValue).toLocaleString()}</td>
                    <td className="px-4 py-4">${toNumber(warehouse.sales).toLocaleString()}</td>
                    <td className="px-4 py-4">${toNumber(warehouse.purchases).toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">{toNumber(warehouse.transfers)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Warehouse movement</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Transfer activity</h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Live</span>
            </div>

            <div className="space-y-3">
              {recentTransfers.length ? recentTransfers.map((transfer) => (
                <div key={transfer.id || transfer.transferId || `${transfer.from}-${transfer.to}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <p className="font-semibold text-slate-900">{transfer.product || transfer.item || 'Stock transfer'}</p>
                    <p className="text-xs text-slate-500">{transfer.from || 'Source'} → {transfer.to || 'Destination'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{toNumber(transfer.qty).toLocaleString()} units</p>
                    <p className="text-xs text-slate-500">{transfer.status || 'Pending'}</p>
                  </div>
                </div>
              )) : <div className="text-sm text-slate-500">No recent transfers available.</div>}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Warehouse performance</p>
            <div className="mt-5 space-y-4">
              {filteredWarehouses.length ? filteredWarehouses.map((warehouse) => {
                const maxValue = Math.max(...warehouseRows.map((row) => toNumber(row.sales)), 1);
                const salesValue = toNumber(warehouse.sales);
                return (
                  <div key={warehouse.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{warehouse.name}</span>
                      <span className="font-semibold text-slate-900">${salesValue.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${(salesValue / maxValue) * 100}%` }} />
                    </div>
                  </div>
                );
              }) : <div className="text-sm text-slate-500">No warehouse performance data available.</div>}
            </div>
          </section>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form onSubmit={handleCreateWarehouse} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Warehouse master</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Create warehouse</h3>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Close</button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block">Code</span>
                <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
              </label>
              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block">Status</span>
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <option value="Active">Active</option>
                  <option value="Standby">Standby</option>
                </select>
              </label>
              <label className="block text-sm text-slate-600 md:col-span-2">
                <span className="mb-1.5 block">Warehouse name</span>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
              </label>
              <label className="block text-sm text-slate-600 md:col-span-2">
                <span className="mb-1.5 block">Location</span>
                <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
              </label>
              <label className="block text-sm text-slate-600 md:col-span-2">
                <span className="mb-1.5 block">Manager</span>
                <input value={form.manager} onChange={(event) => setForm({ ...form, manager: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</button>
              <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">Save warehouse</button>
            </div>
          </form>
        </div>
      )}
    </ModuleLayout>
  );
}

function SummaryCard({ label, value, subtitle, accent }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${colors[accent]}`}>{subtitle}</span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}
