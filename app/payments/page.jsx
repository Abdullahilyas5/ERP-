'use client';

import { useEffect, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ vendor:'', ref:'', amount:'', dueDate:'', method:'Bank Transfer', notes:'' });
  const METHODS = ['Bank Transfer','Card','Cash','Cheque','Mobile Wallet','Other'];

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch('/payments');
      setPayments(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, []);

  async function handleCreate(e){
    e.preventDefault();
    if(!form.vendor || !form.ref || !form.amount) return alert('vendor, ref and amount required');
    try{
      setCreating(true);
      const created = await apiFetch('/payments', { method: 'POST', body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
      setPayments(prev=>[created, ...prev]);
      setForm({ vendor:'', ref:'', amount:'', dueDate:'', method:'Bank Transfer', notes:'' });
    }catch(err){ alert(err?.message||'Create failed'); }
    finally{ setCreating(false); }
  }

  return (
    <ModuleLayout title="Payments" subtitle="Manage vendor payments, scheduling and approval." allowedRoles={['owner', 'accountant']}>
      <section className="mt-2 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 md:col-span-1">
          <h4 className="font-bold">Record payment</h4>
          <form onSubmit={handleCreate} className="mt-3 space-y-3">
            <input value={form.vendor} onChange={(e)=>setForm({...form, vendor:e.target.value})} placeholder="Vendor" className="w-full rounded-md border px-3 py-2" />
            <input value={form.ref} onChange={(e)=>setForm({...form, ref:e.target.value})} placeholder="Reference" className="w-full rounded-md border px-3 py-2" />
            <input value={form.amount} onChange={(e)=>setForm({...form, amount:e.target.value})} placeholder="Amount" type="number" step="0.01" className="w-full rounded-md border px-3 py-2" />
            <input value={form.dueDate} onChange={(e)=>setForm({...form, dueDate:e.target.value})} placeholder="Due date" type="date" className="w-full rounded-md border px-3 py-2" />
            <select value={form.method} onChange={(e)=>setForm({...form, method:e.target.value})} className="w-full rounded-md border px-3 py-2">
              {METHODS.map(m=> <option key={m}>{m}</option>)}
            </select>
            <textarea value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} placeholder="Notes" className="w-full rounded-md border px-3 py-2" />
            <div className="flex gap-2">
              <button type="submit" disabled={creating} className="rounded-md bg-emerald-600 px-3 py-2 text-white">Save</button>
              <button type="button" onClick={()=>setForm({ vendor:'', ref:'', amount:'', dueDate:'', method:'Bank Transfer', notes:'' })} className="rounded-md border px-3 py-2">Reset</button>
            </div>
          </form>
        </div>

        <div className="md:col-span-2">
          {loading ? <div className="p-6">Loading...</div> : (
            <div className="grid gap-4">
              {payments.length === 0 && <div className="p-6 text-sm text-slate-500">No payments recorded.</div>}
              {payments.map((p) => (
                <article key={p._id || p.ref} className="rounded-2xl border bg-white p-4">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-bold">{p.vendor}</h4>
                      <p className="text-sm text-slate-500">Ref: {p.ref} · Method: {p.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${Number(p.amount||0).toFixed(2)}</p>
                      <p className="text-xs text-slate-500">{p.status}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </ModuleLayout>
  );
}
