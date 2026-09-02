'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const defaultExpenseForm = {
  ref: '',
  category: 'Rent',
  description: '',
  amount: '',
  warehouseId: '',
  department: 'Operations',
  paymentMethod: 'Bank Transfer',
  employee: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'Recorded',
};

export default function ExpensesPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [warehouse, setWarehouse] = useState('all');
  const [category, setCategory] = useState('all');
  const [expenseRecords, setExpenseRecords] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(defaultExpenseForm);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      const response = await apiFetch('/expenses?page=1&limit=200');
      const data = response?.data ?? response ?? [];
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      setExpenseRecords(items);
    } catch (err) {
      console.error(err);
      setExpenseRecords([]);
    }
  }

  async function loadWarehouses() {
    try {
      const response = await apiFetch('/warehouses?page=1&limit=200').catch(() => apiFetch('/pos/warehouses'));
      const data = response?.data ?? response ?? [];
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      setWarehouses(items);
      setForm((current) => current.warehouseId || !items.length
        ? current
        : { ...current, warehouseId: String(items[0]._id || items[0].id) });
    } catch (err) {
      console.error(err);
      setWarehouses([]);
    }
  }

  useEffect(() => {
    loadData();
    loadWarehouses();
  }, []);

  const warehouseExpenseBreakdown = useMemo(() => {
    const uniqueWarehouses = Array.from(new Set(expenseRecords.map((item) => item.warehouse).filter(Boolean)));
    return uniqueWarehouses.map((warehouseName) => ({
      warehouse: warehouseName,
      total: expenseRecords.filter((expense) => expense.warehouse === warehouseName).reduce((sum, item) => sum + Number(item.amount || 0), 0),
      categories: [
        { name: 'Rent', value: expenseRecords.filter((expense) => expense.warehouse === warehouseName && expense.category === 'Rent').reduce((sum, item) => sum + Number(item.amount || 0), 0) },
        { name: 'Electricity', value: expenseRecords.filter((expense) => expense.warehouse === warehouseName && expense.category === 'Electricity').reduce((sum, item) => sum + Number(item.amount || 0), 0) },
        { name: 'Maintenance', value: expenseRecords.filter((expense) => expense.warehouse === warehouseName && expense.category === 'Maintenance').reduce((sum, item) => sum + Number(item.amount || 0), 0) },
        { name: 'Transportation', value: expenseRecords.filter((expense) => expense.warehouse === warehouseName && expense.category === 'Transportation').reduce((sum, item) => sum + Number(item.amount || 0), 0) },
        { name: 'Other', value: expenseRecords.filter((expense) => expense.warehouse === warehouseName && expense.category === 'Other').reduce((sum, item) => sum + Number(item.amount || 0), 0) },
      ],
    }));
  }, [expenseRecords]);

  const filteredExpenses = useMemo(() => {
    return expenseRecords.filter((item) => {
      const matchesQuery = !query || [item.ref, item.category, item.employee, item.warehouse, item.description].join(' ').toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === 'all' || item.status === status;
      const matchesWarehouse = warehouse === 'all' || item.warehouse === warehouse;
      const matchesCategory = category === 'all' || item.category === category;
      return matchesQuery && matchesStatus && matchesWarehouse && matchesCategory;
    });
  }, [expenseRecords, query, status, warehouse, category]);

  const totalExpense = filteredExpenses.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const approvedAmount = filteredExpenses.filter((item) => item.status === 'Approved').reduce((sum, item) => sum + toNumber(item.amount), 0);
  const pendingAmount = filteredExpenses.filter((item) => item.status === 'Pending').reduce((sum, item) => sum + toNumber(item.amount), 0);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.ref.trim() || !form.category || !form.warehouseId || !form.amount || Number(form.amount) <= 0) {
      alert('Reference, category, warehouse and amount are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ref: form.ref.trim(),
        category: form.category,
        description: form.description.trim(),
        amount: Number(form.amount),
        warehouseId: form.warehouseId,
        warehouse: warehouses.find((item) => String(item._id || item.id) === String(form.warehouseId))?.name || '',
        department: form.department,
        paymentMethod: form.paymentMethod,
        employee: form.employee.trim() || 'Operations',
        date: form.date || new Date().toISOString().slice(0, 10),
        status: form.status,
      };

      const created = await apiFetch('/expenses', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setExpenseRecords((current) => [created, ...current]);
      setForm({
        ...defaultExpenseForm,
        warehouseId: warehouses[0] ? String(warehouses[0]._id || warehouses[0].id) : '',
      });
      setIsFormOpen(false);
    } catch (err) {
      console.error('Failed to create expense', err);
      alert(err?.message || 'Unable to save expense.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModuleLayout
      title="Expenses"
      subtitle="Monitor operational and warehouse spending, approvals, and cost control across departments."
      allowedRoles={['owner', 'accountant']}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Total expense" value={`$${toNumber(totalExpense).toLocaleString()}`} accent="rose" />
          <SummaryCard label="Approved" value={`$${toNumber(approvedAmount).toLocaleString()}`} accent="emerald" />
          <SummaryCard label="Pending" value={`$${toNumber(pendingAmount).toLocaleString()}`} accent="amber" />
          <SummaryCard label="Warehouse count" value={new Set(filteredExpenses.map((item) => item.warehouse)).size.toString()} accent="sky" />
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Filters</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">Expense analytics</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search expense, employee or warehouse"
                className="min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
              />
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <option value="all">All statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Recorded">Recorded</option>
              </select>
              <select value={warehouse} onChange={(event) => setWarehouse(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <option value="all">All warehouses</option>
                {warehouses.map((warehouseItem) => (
                  <option key={warehouseItem.id || warehouseItem._id || warehouseItem.name} value={warehouseItem.name || warehouseItem.warehouseName}>{warehouseItem.name || warehouseItem.warehouseName}</option>
                ))}
              </select>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <option value="all">All categories</option>
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Electricity">Electricity</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Transportation">Transportation</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Transaction list</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Expense records</h3>
              </div>
              <button type="button" onClick={() => setIsFormOpen(true)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">Add expense</button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Warehouse</th>
                    <th className="px-4 py-3 font-semibold">Employee</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredExpenses.length ? filteredExpenses.map((item) => (
                    <tr key={item.id || item.ref || item.category}>
                      <td className="px-4 py-3 font-medium text-slate-700">{item.id || item.ref || 'EXP'}</td>
                      <td className="px-4 py-3">{item.category || 'General'}</td>
                      <td className="px-4 py-3">{item.warehouse || 'Main Warehouse'}</td>
                      <td className="px-4 py-3">{item.employee || 'N/A'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">${toNumber(item.amount).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[item.status] || 'bg-slate-100 text-slate-700'}`}>
                          {item.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-10 text-center text-sm text-slate-500">No expenses match the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Warehouse spend</p>
              <div className="mt-4 space-y-4">
                {warehouseExpenseBreakdown.length ? warehouseExpenseBreakdown.map((warehouseRow) => (
                  <div key={warehouseRow.warehouse}>
                    <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                      <span className="font-medium text-slate-800">{warehouseRow.warehouse}</span>
                      <span className="font-semibold text-slate-900">${toNumber(warehouseRow.total).toLocaleString()}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" style={{ width: `${(toNumber(warehouseRow.total) / Math.max(1, ...warehouseExpenseBreakdown.map((item) => toNumber(item.total)))) * 100}%` }} />
                    </div>
                  </div>
                )) : <div className="text-sm text-slate-500">No warehouse expense data available.</div>}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Category mix</p>
              <div className="mt-4 space-y-3">
                {['Rent', 'Electricity', 'Maintenance', 'Transportation', 'Other'].map((categoryName, index) => {
                  const value = warehouseExpenseBreakdown.reduce((sum, item) => sum + toNumber(item.categories.find((entry) => entry.name === categoryName)?.value), 0);
                  const maxValue = Math.max(...warehouseExpenseBreakdown.flatMap((item) => item.categories.map((entry) => toNumber(entry.value))), 1);
                  return (
                    <div key={categoryName}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-slate-600">{categoryName}</span>
                        <span className="font-semibold text-slate-900">${toNumber(value).toLocaleString()}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${(value / maxValue) * 100}%`, background: ['#10b981', '#38bdf8', '#f59e0b', '#a78bfa', '#f87171'][index] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Operational cost</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Add expense</h3>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Close</button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block font-medium">Expense reference</span>
                <input value={form.ref} onChange={(event) => setForm((current) => ({ ...current, ref: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white" placeholder="EXP-101" />
              </label>
              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block font-medium">Status</span>
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white">
                  <option value="Recorded">Recorded</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                </select>
              </label>
              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block font-medium">Category</span>
                <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white">
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block font-medium">Amount</span>
                <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white" placeholder="0.00" />
              </label>
              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block font-medium">Warehouse</span>
                <select required value={form.warehouseId} onChange={(event) => setForm((current) => ({ ...current, warehouseId: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white">
                  <option value="">Select warehouse</option>
                  {warehouses.map((warehouseItem) => (
                    <option key={warehouseItem.id || warehouseItem._id || warehouseItem.name} value={warehouseItem._id || warehouseItem.id}>{warehouseItem.name || warehouseItem.warehouseName}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block font-medium">Department</span>
                <input value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white" placeholder="Operations" />
              </label>
              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block font-medium">Employee</span>
                <input value={form.employee} onChange={(event) => setForm((current) => ({ ...current, employee: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white" placeholder="Maya Khan" />
              </label>
              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block font-medium">Payment method</span>
                <select value={form.paymentMethod} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white">
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </label>
              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block font-medium">Date</span>
                <input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white" />
              </label>
              <label className="block text-sm text-slate-600 md:col-span-2">
                <span className="mb-1.5 block font-medium">Description</span>
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-sky-500 focus:bg-white" placeholder="Brief description of the expense" />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving...' : 'Save expense'}</button>
            </div>
          </form>
        </div>
      )}
    </ModuleLayout>
  );
}

function SummaryCard({ label, value, accent }) {
  const palette = {
    rose: 'bg-rose-50 text-rose-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    sky: 'bg-sky-50 text-sky-700',
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${palette[accent]}`}>Live</span>
      </div>
      <p className="mt-5 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

const statusClasses = {
  Approved: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-700',
  Recorded: 'bg-sky-100 text-sky-700',
};
