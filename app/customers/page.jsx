'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

const defaultForm = {
  customerCode: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  taxNumber: '',
  creditLimit: 0,
  outstandingBalance: 0,
  status: 'Active',
};

function generateCustomerCode() {
  return `C-${Date.now().toString().slice(-8)}`;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  async function load(nextPage = page) {
    setLoading(true);
    try {
      const payload = await apiFetch(`/customers?page=${nextPage}&limit=${pageSize}`);
      const data = payload?.data ?? payload;
      const nextItems = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      const nextTotal = Number(data?.total ?? nextItems.length ?? 0);
      setCustomers(nextItems);
      setTotalCustomers(nextTotal);
      setTotalPages(Math.max(1, Number((data?.totalPages ?? Math.ceil(nextTotal / pageSize)) || 1)));
    } catch (err) {
      console.error(err);
      setCustomers([]);
      setTotalCustomers(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Loading data keeps the table synchronized with the selected page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        [customer.name, customer.customerCode, customer.email, customer.phone]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, query, statusFilter]);

  const totalOutstanding = customers.reduce((sum, customer) => sum + Number(customer.outstandingBalance || 0), 0);
  const activeCount = customers.filter((customer) => customer.status === 'Active').length;

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(customer) {
    setEditing(customer);
    setFormOpen(true);
  }

  async function handleDelete(id) {
    if (!confirm('Delete customer?')) return;
    try {
      await apiFetch(`/customers/${id}`, { method: 'DELETE' });
      setCustomers((current) => current.filter((customer) => customer.id !== id && customer._id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <ModuleLayout
      title="Customers"
      subtitle="Customer profiles, credit limits, balances, and account status across the business."
      allowedRoles={['owner', 'admin', 'manager', 'cashier']}
      headerActions={<button onClick={openNew} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">New customer</button>}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total customers" value={totalCustomers || customers.length} change="Live CRM" accent="violet" />
        <SummaryCard label="Active accounts" value={activeCount} change="Current status" accent="emerald" />
        <SummaryCard label="Outstanding" value={`$${totalOutstanding.toLocaleString()}`} change="Receivables" accent="sky" />
      </div>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="Search customer, code, email or phone"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 md:max-w-xs"
          />
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Credit limit</th>
                <th className="px-4 py-3 font-semibold">Top spent</th>
                <th className="px-4 py-3 font-semibold">Last order</th>
                <th className="px-4 py-3 font-semibold">Last order date</th>
                <th className="px-4 py-3 font-semibold">Outstanding</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-500">Loading...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-500">No customers match the active filters.</td></tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id || customer._id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{customer.name}</div>
                      <div className="text-xs text-slate-500">{customer.address || 'No address'}</div>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-700">{customer.customerCode || customer.id}</td>
                    <td className="px-4 py-4">
                      <div>{customer.phone}</div>
                      <div className="text-xs text-slate-500">{customer.email}</div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">${Number(customer.creditLimit || 0).toLocaleString()}</td>
                    <td className="px-4 py-4 font-semibold text-emerald-700">${Number(customer.totalSpent || 0).toLocaleString()}</td>
                    <td className="px-4 py-4 text-xs font-medium text-slate-700">{customer.lastOrder || 'No orders yet'}</td>
                    <td className="px-4 py-4 text-xs text-slate-500">{customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">${Number(customer.outstandingBalance || 0).toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${customer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : customer.status === 'Blocked' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                        {customer.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => openEdit(customer)} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                        <button type="button" onClick={() => handleDelete(customer.id || customer._id)} className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            <span>{filteredCustomers.length === 0 ? 'Showing 0 customers' : `Showing page ${page} of ${totalPages}`}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50">Previous</button>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </section>

      {formOpen && <CustomerForm initial={editing || { ...defaultForm, customerCode: generateCustomerCode() }} onClose={() => { setFormOpen(false); setEditing(null); load(); }} />}
    </ModuleLayout>
  );
}

function SummaryCard({ label, value, change, accent }) {
  const colors = {
    violet: 'bg-violet-50 text-violet-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-4 flex items-end justify-between">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[accent]}`}>{change}</span>
      </div>
    </div>
  );
}

function CustomerForm({ initial = defaultForm, onClose = () => {} }) {
  const [form, setForm] = useState({
    customerCode: initial.customerCode || '',
    name: initial.name || '',
    phone: initial.phone || '',
    email: initial.email || '',
    address: initial.address || '',
    taxNumber: initial.taxNumber || '',
    creditLimit: initial.creditLimit || 0,
    outstandingBalance: initial.outstandingBalance || 0,
    status: initial.status || 'Active',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, creditLimit: Number(form.creditLimit || 0), outstandingBalance: Number(form.outstandingBalance || 0) };
      if (initial && (initial._id || initial.id)) {
        await apiFetch(`/${initial._id ? 'customers' : 'customers'}/${initial._id || initial.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/customers', { method: 'POST', body: JSON.stringify(payload) });
      }
      onClose();
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-lg">
        <h3 className="mb-5 text-xl font-bold text-slate-900">{initial && (initial._id || initial.id) ? 'Edit customer' : 'Add customer'}</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-slate-600">
            <span className="mb-1.5 block">Customer code</span>
           <div className="flex gap-2">
             <input value={form.customerCode} onChange={(event) => setForm({ ...form, customerCode: event.target.value })} className="min-w-0 flex-1 rounded-xl border px-3 py-2.5" placeholder="Auto-generated if blank" />
             <button type="button" onClick={() => setForm({ ...form, customerCode: generateCustomerCode() })} className="rounded-xl border border-violet-200 px-3 text-xs font-semibold text-violet-700">Auto</button>
           </div>
          </label>
          <label className="block text-sm text-slate-600">
            <span className="mb-1.5 block">Status</span>
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="w-full rounded-xl border px-3 py-2.5">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Blocked">Blocked</option>
            </select>
          </label>
          <label className="block text-sm text-slate-600 md:col-span-2">
            <span className="mb-1.5 block">Full name</span>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border px-3 py-2.5" />
          </label>
          <label className="block text-sm text-slate-600">
            <span className="mb-1.5 block">Phone</span>
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="w-full rounded-xl border px-3 py-2.5" />
          </label>
          <label className="block text-sm text-slate-600">
            <span className="mb-1.5 block">Email</span>
            <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border px-3 py-2.5" />
          </label>
          <label className="block text-sm text-slate-600 md:col-span-2">
            <span className="mb-1.5 block">Address</span>
            <textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="min-h-20 w-full rounded-xl border px-3 py-2.5" />
          </label>
          <label className="block text-sm text-slate-600">
            <span className="mb-1.5 block">Tax number</span>
            <input value={form.taxNumber} onChange={(event) => setForm({ ...form, taxNumber: event.target.value })} className="w-full rounded-xl border px-3 py-2.5" />
          </label>
          <label className="block text-sm text-slate-600">
            <span className="mb-1.5 block">Credit limit</span>
            <input type="number" value={form.creditLimit} onChange={(event) => setForm({ ...form, creditLimit: Number(event.target.value) })} className="w-full rounded-xl border px-3 py-2.5" />
          </label>
          <label className="block text-sm text-slate-600">
            <span className="mb-1.5 block">Outstanding balance</span>
            <input type="number" value={form.outstandingBalance} onChange={(event) => setForm({ ...form, outstandingBalance: Number(event.target.value) })} className="w-full rounded-xl border px-3 py-2.5" />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white">{saving ? 'Saving...' : 'Save customer'}</button>
        </div>
      </form>
    </div>
  );
}
