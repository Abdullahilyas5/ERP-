'use client';

import { useEffect, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

export default function StockTransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch('/stock-transfers');
      setTransfers(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, []);

  return (
    <ModuleLayout title="Stock Transfers" subtitle="Manage inter-location stock movements.">
      <section className="mt-2">
        {loading ? <div className="p-6">Loading...</div> : (
          <div className="grid gap-4">
            {transfers.length === 0 && <div className="p-6 text-sm text-slate-500">No stock transfers recorded.</div>}
            {transfers.map((t) => (
              <article key={t._id || t.id} className="rounded-2xl border bg-white p-4">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-bold">{t.item || t.name}</h4>
                    <p className="text-sm text-slate-500">From: {t.from} → To: {t.to}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Qty: {t.qty}</p>
                    <p className="text-xs text-slate-500">{t.status}</p>
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
