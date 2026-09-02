'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

export default function SalesPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const pageSize = 10;

  async function load(currentPage = page) {
    setLoading(true);
    try {
      const response = await apiFetch(`/sales?page=${currentPage}&limit=${pageSize}`);
      const payload = response?.items ? response : response?.data ?? [];
      const records = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
      setTransactions(records);
      setTotalSales(Number(payload?.total ?? records.length ?? 0));
      setTotalPages(Math.max(1, Number((payload?.totalPages ?? Math.ceil((payload?.total ?? records.length) / pageSize)) || 1)));
    } catch (err) {
      console.error(err);
      setTransactions([]);
      setTotalSales(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(page); }, [page]);

  const paidCount = useMemo(() => transactions.filter((t) => t.status === 'Paid').length, [transactions]);
  const pendingCount = useMemo(() => transactions.filter((t) => t.status === 'Pending').length, [transactions]);

  return (
    <ModuleLayout title="Sales" subtitle="Review transaction flow, revenue mix, and performance by channel." allowedRoles={['owner', 'admin', 'manager', 'cashier']}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Transactions" value={totalSales || transactions.length} change="Recent" accent="emerald" />
        <SummaryCard label="Total" value={transactions.reduce((sum, item) => sum + Number(item.total || 0), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} change="This period" accent="rose" />
        <SummaryCard label="Paid" value={paidCount} change="Completed" accent="emerald" />
        <SummaryCard label="Pending" value={pendingCount} change="Needs attention" accent="rose" />
      </div>

      <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
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
              {loading ? (
                <tr><td className="p-6 text-sm text-slate-500">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-sm text-slate-500">No sales found.</td></tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction._id || transaction.invoiceId || transaction.id} className="text-sm text-slate-700">
                    <td className="px-4 py-4 font-semibold text-slate-900">{transaction.invoiceId || transaction.id || '—'}</td>
                    <td className="px-4 py-4">{transaction.items?.length || 0}</td>
                    <td className="px-4 py-4">${Number(transaction.total || 0).toFixed(2)}</td>
                    <td className="px-4 py-4">{transaction.channel || transaction.paymentMethod || '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${transaction.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : transaction.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {transaction.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50">Previous</button>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
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
