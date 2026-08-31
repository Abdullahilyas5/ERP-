'use client';

import { useEffect, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch('/customers');
      setCustomers(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, []);

  function openNew(){ setEditing({}); setFormOpen(true); }
  function openEdit(c){ setEditing(c); setFormOpen(true); }

  async function handleDelete(id){ if(!confirm('Delete customer?')) return; await apiFetch(`/customers/${id}`, { method: 'DELETE' }); load(); }

  return (
    <ModuleLayout title="Customers" subtitle="Maintain member data, loyalty rewards, and buying behavior." allowedRoles={['owner', 'admin', 'manager', 'cashier']} headerActions={<button onClick={openNew} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">New customer</button>}>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total members" value={customers.length} change="+11.2%" accent="violet" />
        <SummaryCard label="Loyalty points awarded" value="8.2K" change="This month" accent="emerald" />
        <SummaryCard label="Repeat buyers" value="72%" change="4.5% uplift" accent="sky" />
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        {loading ? <div className="p-6">Loading...</div> : customers.map((customer) => (
          <article key={customer._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-lg font-bold text-violet-700">
                  {customer.name?.charAt(0) ?? '?'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{customer.name}</h3>
                  <p className="text-sm text-slate-500">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{customer.tier}</span>
                <button onClick={()=>openEdit(customer)} className="rounded-md border px-3 py-1 text-sm">Edit</button>
                <button onClick={()=>handleDelete(customer._id)} className="rounded-md border px-3 py-1 text-sm text-rose-600">Delete</button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric label="Spend" value={`$${Number(customer.spend||0).toFixed(2)}`} />
              <Metric label="Visits" value={customer.visits || 0} />
              <Metric label="Loyalty" value={customer.loyalty || 0} />
            </div>
          </article>
        ))}
      </section>

      {formOpen && <CustomerForm initial={editing} onClose={()=>{setFormOpen(false); setEditing(null); load();}} />}
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

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function CustomerForm({ initial = {}, onClose = ()=>{} }){
  const [form, setForm] = useState({ name: initial.name||'', email: initial.email||'', phone: initial.phone||'', address: initial.address||'', tier: initial.tier||'Bronze' });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e){
    e.preventDefault(); setSaving(true);
    try{
      if(initial && initial._id) await apiFetch(`/customers/${initial._id}`, { method: 'PUT', body: JSON.stringify(form) });
      else await apiFetch('/customers', { method: 'POST', body: JSON.stringify(form) });
      onClose();
    }catch(err){ alert(err.message||'Save failed'); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-bold">{initial && initial._id ? 'Edit customer' : 'Add customer'}</h3>
        <label className="block text-sm text-slate-600">Name</label>
        <input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} className="mb-3 w-full rounded-md border px-3 py-2" />
        <label className="block text-sm text-slate-600">Email</label>
        <input value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} className="mb-3 w-full rounded-md border px-3 py-2" />
        <label className="block text-sm text-slate-600">Phone</label>
        <input value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} className="mb-3 w-full rounded-md border px-3 py-2" />
        <label className="block text-sm text-slate-600">Tier</label>
        <select value={form.tier} onChange={(e)=>setForm({...form, tier:e.target.value})} className="mb-3 w-full rounded-md border px-3 py-2">
          <option>Bronze</option>
          <option>Silver</option>
          <option>Gold</option>
          <option>Platinum</option>
        </select>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-md bg-emerald-600 px-4 py-2 text-white">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
