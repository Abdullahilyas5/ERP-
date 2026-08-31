'use client';

import { useEffect, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

export default function FinancialReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch('/reports');
      setReport(data.financeSummary || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, []);

  return (
    <ModuleLayout title="Financial Reports" subtitle="Profit & Loss, Balance and financial metrics.">
      <section className="mt-2">
        {loading ? <div className="p-6">Loading...</div> : (
          <div className="grid gap-4">
            <article className="rounded-2xl border bg-white p-4">
              <h4 className="font-bold">Profit & Loss (summary)</h4>
              <p className="text-sm text-slate-500 mt-2">Payable: {report.payable ?? '—'}</p>
              <p className="text-sm text-slate-500 mt-1">Receivable: {report.receivable ?? '—'}</p>
            </article>

            <article className="rounded-2xl border bg-white p-4">
              <h4 className="font-bold">Cashflow</h4>
              <p className="text-sm text-slate-500 mt-2">(Placeholder) Add time-range filters to generate cashflow.</p>
            </article>
          </div>
        )}
      </section>
    </ModuleLayout>
  );
}
