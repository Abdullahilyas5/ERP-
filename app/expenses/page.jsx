'use client';

import { useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { expenseRecords, warehouseCatalog } from '../data/erp-data';

const warehouseExpenseBreakdown = warehouseCatalog.map((warehouse) => ({
  warehouse: warehouse.name,
  total: expenseRecords.filter((expense) => expense.warehouse === warehouse.name).reduce((sum, item) => sum + item.amount, 0),
  categories: [
    { name: 'Rent', value: expenseRecords.filter((expense) => expense.warehouse === warehouse.name && expense.category === 'Rent').reduce((sum, item) => sum + item.amount, 0) },
    { name: 'Electricity', value: expenseRecords.filter((expense) => expense.warehouse === warehouse.name && expense.category === 'Electricity').reduce((sum, item) => sum + item.amount, 0) },
    { name: 'Maintenance', value: expenseRecords.filter((expense) => expense.warehouse === warehouse.name && expense.category === 'Maintenance').reduce((sum, item) => sum + item.amount, 0) },
    { name: 'Transportation', value: expenseRecords.filter((expense) => expense.warehouse === warehouse.name && expense.category === 'Transportation').reduce((sum, item) => sum + item.amount, 0) },
    { name: 'Other', value: expenseRecords.filter((expense) => expense.warehouse === warehouse.name && expense.category === 'Other').reduce((sum, item) => sum + item.amount, 0) },
  ],
}));

export default function ExpensesPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [warehouse, setWarehouse] = useState('all');
  const [category, setCategory] = useState('all');

  const filteredExpenses = useMemo(() => {
    return expenseRecords.filter((item) => {
      const matchesQuery = !query || [item.id, item.category, item.employee, item.warehouse, item.description].join(' ').toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === 'all' || item.status === status;
      const matchesWarehouse = warehouse === 'all' || item.warehouse === warehouse;
      const matchesCategory = category === 'all' || item.category === category;
      return matchesQuery && matchesStatus && matchesWarehouse && matchesCategory;
    });
  }, [query, status, warehouse, category]);

  const totalExpense = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  const approvedAmount = filteredExpenses.filter((item) => item.status === 'Approved').reduce((sum, item) => sum + item.amount, 0);
  const pendingAmount = filteredExpenses.filter((item) => item.status === 'Pending').reduce((sum, item) => sum + item.amount, 0);

  return (
    <ModuleLayout
      title="Expenses"
      subtitle="Monitor operational and warehouse spending, approvals, and cost control across departments."
      allowedRoles={['owner', 'admin', 'manager']}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Total expense" value={`$${totalExpense.toLocaleString()}`} accent="rose" />
          <SummaryCard label="Approved" value={`$${approvedAmount.toLocaleString()}`} accent="emerald" />
          <SummaryCard label="Pending" value={`$${pendingAmount.toLocaleString()}`} accent="amber" />
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
                <option value="Reviewed">Reviewed</option>
              </select>
              <select value={warehouse} onChange={(event) => setWarehouse(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <option value="all">All warehouses</option>
                <option value="Central Warehouse">Central Warehouse</option>
                <option value="Downtown Store">Downtown Store</option>
                <option value="Airport Branch">Airport Branch</option>
                <option value="North Hub">North Hub</option>
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
              <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">Add expense</button>
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
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-slate-700">{item.id}</td>
                      <td className="px-4 py-3">{item.category}</td>
                      <td className="px-4 py-3">{item.warehouse}</td>
                      <td className="px-4 py-3">{item.employee}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">${item.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[item.status] || 'bg-slate-100 text-slate-700'}`}>
                          {item.status}
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
                {warehouseExpenseBreakdown.map((warehouseRow) => (
                  <div key={warehouseRow.warehouse}>
                    <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                      <span className="font-medium text-slate-800">{warehouseRow.warehouse}</span>
                      <span className="font-semibold text-slate-900">${warehouseRow.total.toLocaleString()}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" style={{ width: `${(warehouseRow.total / 15000) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Category mix</p>
              <div className="mt-4 space-y-3">
                {['Rent', 'Electricity', 'Maintenance', 'Transportation', 'Other'].map((categoryName, index) => {
                  const value = warehouseExpenseBreakdown.reduce((sum, item) => sum + (item.categories.find((entry) => entry.name === categoryName)?.value || 0), 0);
                  return (
                    <div key={categoryName}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-slate-600">{categoryName}</span>
                        <span className="font-semibold text-slate-900">${value.toLocaleString()}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${(value / 22000) * 100}%`, background: ['#10b981', '#38bdf8', '#f59e0b', '#a78bfa', '#f87171'][index] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
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
  Reviewed: 'bg-sky-100 text-sky-700',
};
