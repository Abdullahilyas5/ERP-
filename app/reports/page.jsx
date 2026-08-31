'use client';

import { useEffect, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch('/reports');
      setReport(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, []);

  return (
    <ModuleLayout title="Reports" subtitle="Run analytical and operational reports." allowedRoles={['owner', 'admin', 'manager']}>
      <section className="mt-2">
        {loading ? <div className="p-6">Loading...</div> : (
          <div className="grid gap-4">
            <article className="rounded-2xl border bg-white p-4">
              <h4 className="font-bold">Sales Summary</h4>
              <p className="text-sm text-slate-500 mt-2">Total: {report?.salesSummary?.total ?? '—'} ({report?.salesSummary?.period})</p>
            </article>

            <article className="rounded-2xl border bg-white p-4">
              <h4 className="font-bold">Inventory Summary</h4>
              <p className="text-sm text-slate-500 mt-2">Items low: {report?.inventorySummary?.itemsLow ?? '—'}</p>
            </article>

            <article className="rounded-2xl border bg-white p-4">
              <h4 className="font-bold">Financial Summary</h4>
              <p className="text-sm text-slate-500 mt-2">Payable: {report?.financeSummary?.payable ?? '—'} · Receivable: {report?.financeSummary?.receivable ?? '—'}</p>
            </article>

            <article className="rounded-2xl border bg-white p-4">
              <h4 className="font-bold">Payments by method</h4>
              {report?.paymentMethods && report.paymentMethods.length > 0 ? (
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {report.paymentMethods.map(pm => (
                    <li key={pm._id} className="flex justify-between">
                      <span>{pm._id || 'Unknown'}</span>
                      <span className="font-semibold">${Number(pm.total||0).toFixed(2)} · {pm.count} payments</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No payment method data available.</p>
              )}
            </article>
          </div>
        )}
      </section>
    </ModuleLayout>
  );
}
