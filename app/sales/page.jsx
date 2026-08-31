'use client';

import { useEffect, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

export default function SalesPage() {
  const [overview, setOverview] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load(){ setLoading(true); try{ const res = await apiFetch('/sales'); setTransactions(res.transactions || res); }catch(err){ console.error(err); } finally{ setLoading(false); } }

  useEffect(()=>{ load(); },[]);

  return (
    <ModuleLayout title="Sales" subtitle="Review transaction flow, revenue mix, and performance by channel." allowedRoles={['owner', 'admin', 'manager', 'cashier']}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Observability: server currently returns limited overview via /dashboard */}
        <SummaryCard label="Transactions" value={transactions.length} change="Recent" accent="emerald" />
        <SummaryCard label="Total" value="—" change="This period" accent="rose" />
        <SummaryCard label="Paid" value={transactions.filter(t=>t.status==='Paid').length} change="Completed" accent="emerald" />
        <SummaryCard label="Pending" value={transactions.filter(t=>t.status==='Pending').length} change="Needs attention" accent="rose" />
      </div>

      <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Invoice</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Items</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Amount</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Channel</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? <tr><td className="p-6">Loading...</td></tr> : transactions.map((transaction) => (
                <tr key={transaction._id} className="text-sm text-slate-700">
                  <td className="px-4 py-4 font-semibold text-slate-900">{transaction.invoiceId}</td>
                  <td className="px-4 py-4">{transaction.items?.length || 0}</td>
                  <td className="px-4 py-4">${Number(transaction.total||0).toFixed(2)}</td>
                  <td className="px-4 py-4">{transaction.channel}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${transaction.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : transaction.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </ModuleLayout>
  );
}

function SummaryCard({ label, value, change, accent }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[accent]}`}>{change}</span>
      </div>
      <p className="mt-5 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
