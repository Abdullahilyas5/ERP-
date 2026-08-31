'use client';

import { useEffect, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

export default function ExpensesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch('/expenses');
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, []);

  return (
    <ModuleLayout title="Expenses" subtitle="Track and approve operational expenses." allowedRoles={['owner', 'accountant']}>
      <section className="mt-2">
        {loading ? <div className="p-6">Loading...</div> : (
          <div className="grid gap-4">
            {items.length === 0 && <div className="p-6 text-sm text-slate-500">No expenses recorded.</div>}
            {items.map((e) => (
              <article key={e._id || e.ref} className="rounded-2xl border bg-white p-4">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-bold">{e.category}</h4>
                    <p className="text-sm text-slate-500">Ref: {e.ref} · {e.month}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${Number(e.amount||0).toFixed(2)}</p>
                    <p className="text-xs text-slate-500">{e.status}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </ModuleLayout>
  );
}
