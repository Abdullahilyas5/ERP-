'use client';

import { useEffect, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch('/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openNew() { setEditing({}); setFormOpen(true); }
  function openEdit(p) { setEditing(p); setFormOpen(true); }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return;
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <ModuleLayout title="Products" subtitle="Manage your catalogue" allowedRoles={['owner', 'admin', 'manager', 'cashier']} headerActions={<button onClick={openNew} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Add product</button>}>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Products" value={products.length} change="Live" accent="emerald" />
        <SummaryCard label="Units in stock" value={products.reduce((s,p)=>s+(p.stock||0),0)} change="Across all items" accent="sky" />
        <SummaryCard label="Low stock" value={products.filter(p=>p.stock<=p.reorderLevel).length} change="Needs review" accent="amber" />
      </div>

      <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
        <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.7fr] gap-4 bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          <span>Product</span>
          <span>Category</span>
          <span>Stock</span>
          <span>Price</span>
          <span>Actions</span>
        </div>

        {loading ? <div className="p-6">Loading...</div> : products.map((product) => (
          <div key={product._id} className="grid grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.7fr] gap-4 border-t border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
            <div>
              <p className="font-semibold text-slate-900">{product.name}</p>
              <p className="mt-1 text-xs text-slate-500">{product.sku}</p>
            </div>
            <span>{product.category}</span>
            <span>{product.stock}</span>
            <span>${Number(product.price || 0).toFixed(2)}</span>
            <span className="flex gap-2">
              <button onClick={()=>openEdit(product)} className="rounded-md border px-3 py-1 text-sm">Edit</button>
              <button onClick={()=>handleDelete(product._id)} className="rounded-md border px-3 py-1 text-sm text-rose-600">Delete</button>
            </span>
          </div>
        ))}
      </section>

      {formOpen && <ProductForm initial={editing} onClose={()=>{setFormOpen(false); setEditing(null); load();}} />}
    </ModuleLayout>
  );
}

function SummaryCard({ label, value, change, accent }) {
  const colors = { emerald: 'bg-emerald-50 text-emerald-700', sky: 'bg-sky-50 text-sky-700', amber: 'bg-amber-50 text-amber-700' };
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

function ProductForm({ initial = {}, onClose = ()=>{} }) {
  const [form, setForm] = useState({ sku: initial.sku || '', name: initial.name || '', category: initial.category || '', price: initial.price || 0, stock: initial.stock || 0, reorderLevel: initial.reorderLevel || 0 });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial && initial._id) {
        await apiFetch(`/products/${initial._id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await apiFetch('/products', { method: 'POST', body: JSON.stringify(form) });
      }
      onClose();
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-bold">{initial && initial._id ? 'Edit product' : 'Add product'}</h3>
        <label className="block text-sm text-slate-600">SKU</label>
        <input value={form.sku} onChange={(e)=>setForm({...form, sku:e.target.value})} className="mb-3 w-full rounded-md border px-3 py-2" />
        <label className="block text-sm text-slate-600">Name</label>
        <input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} className="mb-3 w-full rounded-md border px-3 py-2" />
        <label className="block text-sm text-slate-600">Category</label>
        <input value={form.category} onChange={(e)=>setForm({...form, category:e.target.value})} className="mb-3 w-full rounded-md border px-3 py-2" />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-slate-600">Price</label>
            <input type="number" step="0.01" value={form.price} onChange={(e)=>setForm({...form, price:parseFloat(e.target.value)})} className="mb-3 w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-slate-600">Stock</label>
            <input type="number" value={form.stock} onChange={(e)=>setForm({...form, stock:parseInt(e.target.value||0)})} className="mb-3 w-full rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-slate-600">Reorder</label>
            <input type="number" value={form.reorderLevel} onChange={(e)=>setForm({...form, reorderLevel:parseInt(e.target.value||0)})} className="mb-3 w-full rounded-md border px-3 py-2" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-md bg-emerald-600 px-4 py-2 text-white">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
