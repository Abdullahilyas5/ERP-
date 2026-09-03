'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const saleChange = (sale) => sale.changeDue == null ? Math.max(0, Number(sale.paidAmount || 0) - Number(sale.total || 0)) : sale.changeDue;
const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function SalesPage() {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({ period: 'all', customer: '', cashier: '' });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedSaleLoading, setSelectedSaleLoading] = useState(false);
  const [selectedSaleError, setSelectedSaleError] = useState('');
  const pageSize = 10;

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    if (filters.customer) params.set('customer', filters.customer);
    if (filters.cashier) params.set('cashier', filters.cashier);
    if (filters.period !== 'all') {
      const from = new Date();
      if (filters.period === 'today') from.setHours(0, 0, 0, 0);
      if (filters.period === '7d') from.setDate(from.getDate() - 6);
      if (filters.period === '30d') from.setDate(from.getDate() - 29);
      params.set('from', dateKey(from));
      params.set('to', dateKey(new Date()));
    }
    return params.toString();
  }, [filters, page]);

  useEffect(() => {
    let active = true;
    apiFetch(`/sales?${query}`).then((payload) => {
      if (!active) return;
      setTransactions(payload?.items || []);
      setTotalSales(Number(payload?.total || 0));
      setTotalPages(Math.max(1, Number(payload?.totalPages || 1)));
    }).catch(() => active && setTransactions([])).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [query]);

  useEffect(() => {
    apiFetch('/customers?page=1&limit=200').then((payload) => {
      const data = payload?.data ?? payload;
      setCustomers(data?.items || data || []);
    }).catch(() => setCustomers([]));
  }, []);

  const cashiers = [...new Set(transactions.map((sale) => sale.cashierName || sale.metadata?.cashierName).filter(Boolean))];
  const paidCount = transactions.filter((sale) => sale.status === 'Paid').length;

  function updateFilter(name, value) {
    setPage(1);
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function viewSale(sale) {
    setSelectedSale(sale);
    setSelectedSaleError('');
    setSelectedSaleLoading(true);
    try {
      const detail = await apiFetch(`/sales/${encodeURIComponent(sale._id || sale.invoiceId)}`);
      setSelectedSale(detail);
    } catch (error) {
      setSelectedSale(sale);
      setSelectedSaleError(error?.message || 'Unable to load the complete sale details.');
    } finally {
      setSelectedSaleLoading(false);
    }
  }

  function invoiceHtml(sale) {
    const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
    const rows = (sale.items || []).map((item) => `<tr><td>${escape(item.name || item.sku)}</td><td>${item.quantity}</td><td>${money(item.price)}</td><td>${money(Number(item.price) * Number(item.quantity))}</td></tr>`).join('');
    const cashier = sale.cashierName || sale.metadata?.cashierName || '—';
    return `<!doctype html><html><head><title>${escape(sale.invoiceId)} - Receipt</title><style>body{font:14px Arial;max-width:720px;margin:40px auto;padding:0 24px;color:#172033}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{text-align:left;padding:8px;border-bottom:1px solid #ddd}th:nth-child(n+2),td:nth-child(n+2){text-align:right}.summary{margin:20px 0 0 auto;width:240px}.summary div{display:flex;justify-content:space-between;padding:5px}.total{font-weight:bold;border-top:2px solid #172033;padding-top:10px}@media print{body{margin:0}}</style></head><body><h1>Supermarket ERP</h1><p><strong>${escape(sale.invoiceId)}</strong><br>${sale.createdAt ? new Date(sale.createdAt).toLocaleString() : '—'}<br>Cashier: ${escape(cashier)}<br>Customer: ${escape(sale.customerName || 'Walk-in Customer')}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="summary"><div><span>Subtotal</span><span>${money(sale.subtotal)}</span></div><div><span>Tax</span><span>${money(sale.tax)}</span></div><div class="total"><span>Total</span><span>${money(sale.total)}</span></div><div><span>Paid</span><span>${money(sale.paidAmount)}</span></div><div><span>Change due</span><span>${money(saleChange(sale))}</span></div></div></body></html>`;
  }

  function printSale(sale) {
    const popup = window.open('', '_blank', 'width=760,height=900');
    if (!popup) return;
    popup.document.write(`${invoiceHtml(sale)}<script>window.onload=function(){window.print();}</script>`);
    popup.document.close();
  }

  function downloadSale(sale) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([invoiceHtml(sale)], { type: 'text/html' }));
    link.download = `${sale.invoiceId || 'sale'}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <ModuleLayout title="Sales" subtitle="Review transaction flow, revenue mix, and performance by channel." allowedRoles={['owner', 'admin', 'manager', 'cashier']}>
      <div className="mb-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <label className="text-sm font-semibold text-slate-600">Period<select value={filters.period} onChange={(e) => updateFilter('period', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-normal"><option value="all">All time</option><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select></label>
        <label className="text-sm font-semibold text-slate-600">Customer<select value={filters.customer} onChange={(e) => updateFilter('customer', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-normal"><option value="">All customers</option>{customers.map((customer) => <option key={customer._id || customer.id} value={customer._id || customer.id}>{customer.name}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-600">Cashier<input list="cashier-options" value={filters.cashier} onChange={(e) => updateFilter('cashier', e.target.value)} placeholder="All cashiers" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" /><datalist id="cashier-options">{cashiers.map((cashier) => <option key={cashier} value={cashier} />)}</datalist></label>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-3"><SummaryCard label="Transactions" value={totalSales} /><SummaryCard label="Paid" value={paidCount} /><SummaryCard label="Total" value={money(transactions.reduce((sum, sale) => sum + Number(sale.total || 0), 0))} /></div>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-left"><thead className="bg-slate-100"><tr>{['Invoice','Date / Cashier','Customer','Items','Amount','Paid / Change','Status','Actions'].map((heading) => <th key={heading} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-200">{loading ? <tr><td colSpan={8} className="p-6 text-sm text-slate-500">Loading...</td></tr> : transactions.length === 0 ? <tr><td colSpan={8} className="p-6 text-center text-sm text-slate-500">No sales found.</td></tr> : transactions.map((sale) => <tr key={sale._id || sale.invoiceId} className="text-sm text-slate-700"><td className="px-4 py-4 font-semibold text-slate-900">{sale.invoiceId || '—'}</td><td className="px-4 py-4">{new Date(sale.createdAt).toLocaleString()}<br /><span className="text-xs text-slate-500">{sale.cashierName || sale.metadata?.cashierName || '—'}</span></td><td className="px-4 py-4">{sale.customerName || 'Walk-in Customer'}</td><td className="px-4 py-4">{sale.items?.length || 0} line items</td><td className="px-4 py-4">{money(sale.total)}</td><td className="px-4 py-4">{money(sale.paidAmount)}<br /><span className="text-xs text-slate-500">Change: {money(saleChange(sale))}</span></td><td className="px-4 py-4">{sale.status || 'Paid'}</td><td className="px-4 py-4">      <button type="button" onClick={() => viewSale(sale)} className="rounded-lg border border-slate-200 px-2 py-1 font-medium hover:border-emerald-300 hover:text-emerald-700">View all items</button></td></tr>)}</tbody></table></div>{totalPages > 1 && <div className="flex justify-between border-t border-slate-100 px-4 py-3 text-sm"><span>Page {page} of {totalPages}</span><div><button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="mr-2 rounded-lg border px-3 py-1 disabled:opacity-50">Previous</button><button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-3 py-1 disabled:opacity-50">Next</button></div></div>}</section>
      {selectedSale && <SaleModal sale={selectedSale} loading={selectedSaleLoading} error={selectedSaleError} onClose={() => setSelectedSale(null)} onPrint={() => printSale(selectedSale)} onDownload={() => downloadSale(selectedSale)} />}
    </ModuleLayout>
  );
}

function SummaryCard({ label, value }) { return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-bold text-slate-900">{value}</p></div>; }
function SaleModal({ sale, loading, error, onClose, onPrint, onDownload }) {
  const items = sale.items || [];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="sale-detail-title">
    <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Sale details</p><h2 id="sale-detail-title" className="mt-1 text-2xl font-bold text-slate-900">{sale.invoiceId || 'Sale'}</h2></div>
        <button type="button" onClick={onClose} aria-label="Close sale details" className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button>
      </div>
      <div className="overflow-y-auto px-6 py-5">
        {loading && <p role="status" className="mb-4 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-700">Loading all sale items...</p>}
        {error && <p role="alert" className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">{error}</p>}
        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-3"><div><span className="block text-xs text-slate-500">Date / time</span><strong>{sale.createdAt ? new Date(sale.createdAt).toLocaleString() : '—'}</strong></div><div><span className="block text-xs text-slate-500">Customer</span><strong>{sale.customerName || 'Walk-in Customer'}</strong></div><div><span className="block text-xs text-slate-500">Cashier</span><strong>{sale.cashierName || sale.metadata?.cashierName || '—'}</strong></div></div>
        <div className="mt-6"><h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Items ({items.length})</h3><div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Item</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Unit price</th><th className="px-4 py-3 text-right">Line total</th></tr></thead><tbody className="divide-y divide-slate-100">{items.length ? items.map((item, index) => <tr key={item._id || item.id || item.sku || index}><td className="px-4 py-3 font-medium text-slate-900">{item.name || item.sku || 'Unnamed item'}{item.sku && item.name && <span className="ml-2 text-xs text-slate-400">{item.sku}</span>}</td><td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td><td className="px-4 py-3 text-right text-slate-600">{money(item.price)}</td><td className="px-4 py-3 text-right font-semibold text-slate-900">{money(Number(item.price) * Number(item.quantity))}</td></tr>) : <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No line items recorded.</td></tr>}</tbody></table></div></div>
        <div className="mt-5 ml-auto max-w-xs space-y-2 border-t border-slate-200 pt-4 text-sm"><div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{money(sale.subtotal)}</span></div><div className="flex justify-between text-slate-600"><span>Tax</span><span>{money(sale.tax)}</span></div><div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900"><span>Total</span><span>{money(sale.total)}</span></div><div className="flex justify-between text-slate-600"><span>Paid amount</span><span>{money(sale.paidAmount)}</span></div><div className="flex justify-between text-slate-600"><span>Change due</span><span>{money(saleChange(sale))}</span></div></div>
      </div>
      <div className="flex gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4"><button type="button" onClick={onPrint} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Print</button><button type="button" onClick={onDownload} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100">Download</button></div>
    </div>
  </div>;
}
