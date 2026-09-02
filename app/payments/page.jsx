'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

const methods = ['Cash', 'Card', 'Bank Transfer', 'Digital Wallet', 'Cheque'];
const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};
const defaultForm = {
  type: 'Customer Payment',
  direction: 'incoming',
  party: '',
  ref: '',
  amount: '',
  method: 'Card',
  status: 'Pending',
  warehouseId: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
};

export default function PaymentsPage() {
  const [requestedPayment] = useState(() => (
    typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('payment') || ''
  ));
  const [records, setRecords] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [query, setQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [paymentResponse, warehouseResponse] = await Promise.all([
          apiFetch('/payments?page=1&limit=200'),
          apiFetch('/warehouses?page=1&limit=200'),
        ]);
        const paymentData = paymentResponse?.items ?? paymentResponse?.records ?? paymentResponse?.data ?? paymentResponse ?? [];
        const nextRecords = Array.isArray(paymentData) ? paymentData : paymentData.records ?? [];
        const nextAccounts = paymentResponse?.accounts ?? paymentData.accounts ?? [];
        const nextWarehouses = warehouseResponse?.items ?? warehouseResponse?.data ?? warehouseResponse ?? [];
        const normalizedRecords = nextRecords.map((record, index) => ({
          id: record.id || record.paymentId || record._id || `PAY-${index + 1}`,
          type: record.type || 'Customer Payment',
          direction: record.direction || (record.amount >= 0 ? 'incoming' : 'outgoing'),
          party: record.party || record.customer || record.supplier || record.name || 'Walk-in customer',
          ref: record.ref || record.reference || record.invoiceReference || record.invoice || 'N/A',
          amount: Number(record.amount || 0),
          method: record.method || 'Cash',
          status: record.status || 'Pending',
          warehouse: record.warehouse || record.warehouseName || (Array.isArray(nextWarehouses) ? nextWarehouses.find((item) => item.id === record.warehouseId || item._id === record.warehouseId)?.name : '') || 'Main Warehouse',
          warehouseId: record.warehouseId || record.warehouse || 'WH-CENTRAL',
          date: record.date || record.createdAt || new Date().toISOString().slice(0, 10),
          notes: record.notes || '',
          cashAccount: record.cashAccount || 'Main Business Bank',
          accountType: record.accountType || 'Bank',
          createdBy: record.createdBy || 'ERP Admin',
        }));
        setRecords(Array.isArray(normalizedRecords) ? normalizedRecords : []);
        setAccounts(Array.isArray(nextAccounts) ? nextAccounts : []);
        setWarehouses(Array.isArray(nextWarehouses) ? nextWarehouses : []);
        if (Array.isArray(nextWarehouses) && nextWarehouses.length) {
          setForm((current) => current.warehouseId ? current : {
            ...current,
            warehouseId: String(nextWarehouses[0]._id || nextWarehouses[0].id),
          });
        }
        setSelectedRecord(normalizedRecords.find((record) => record.id === requestedPayment || record.ref === requestedPayment) || normalizedRecords[0] || null);
      } catch (err) {
        console.error(err);
        setRecords([]);
        setAccounts([]);
        setWarehouses([]);
        setSelectedRecord(null);
      }
    }

    loadData();
  }, [requestedPayment]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesQuery =
        !query ||
        [record.id, record.party, record.ref, record.type, record.warehouse, record.method]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesDirection = directionFilter === 'all' || record.direction === directionFilter;
      const matchesMethod = methodFilter === 'all' || record.method === methodFilter;
      const matchesWarehouse = warehouseFilter === 'all' || record.warehouseId === warehouseFilter || record.warehouse === warehouseFilter;
      return matchesQuery && matchesDirection && matchesMethod && matchesWarehouse;
    });
  }, [records, query, directionFilter, methodFilter, warehouseFilter]);

  const summary = useMemo(() => {
    const totalPayments = records.length;
    const moneyReceived = records.filter((record) => record.direction === 'incoming').reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const moneyPaid = records.filter((record) => record.direction === 'outgoing').reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const pendingPayments = records.filter((record) => record.status === 'Pending').reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const refunds = records.filter((record) => (record.type || '').toLowerCase().includes('refund')).reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const receivables = records.filter((record) => record.direction === 'incoming' && record.status !== 'Completed').reduce((sum, record) => sum + Number(record.amount || 0), 0);
    const payables = records.filter((record) => record.direction === 'outgoing' && record.status !== 'Completed').reduce((sum, record) => sum + Number(record.amount || 0), 0);

    return { totalPayments, moneyReceived, moneyPaid, pendingPayments, refunds, receivables, payables };
  }, [records]);

  const paymentMethodChart = useMemo(() => {
    const totals = {};
    records.forEach((record) => {
      totals[record.method] = (totals[record.method] || 0) + Number(record.amount || 0);
    });
    return Object.entries(totals).map(([method, total]) => ({ method, total }));
  }, [records]);

  const cashFlowTrend = useMemo(() => {
    const grouped = {};
    records.forEach((record) => {
      const date = new Date(record.date);
      if (Number.isNaN(date.getTime())) return;
      const month = date.toLocaleString('en-US', { month: 'short' });
      if (!grouped[month]) grouped[month] = { month, incoming: 0, outgoing: 0, sort: date.getTime() };
      grouped[month][record.direction === 'outgoing' ? 'outgoing' : 'incoming'] += toNumber(record.amount);
      grouped[month].sort = Math.min(grouped[month].sort, date.getTime());
    });
    return Object.values(grouped)
      .sort((a, b) => a.sort - b.sort)
      .map((item) => ({ month: item.month, incoming: item.incoming, outgoing: item.outgoing }));
  }, [records]);

  async function handleAddPayment(event) {
    event.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;
    setSaving(true);
    const warehouse = warehouses.find((item) => item.id === form.warehouseId || item._id === form.warehouseId) || warehouses[0] || { name: 'Main Warehouse', id: 'WH-CENTRAL' };
    const payload = {
      type: form.type,
      direction: form.direction,
      party: form.party || 'Walk-in customer',
      ref: form.ref || `REF-${String(Date.now()).slice(-6)}`,
      amount: Number(form.amount || 0),
      method: form.method,
      status: form.status,
      warehouse: warehouse.name || 'Main Warehouse',
      warehouseId: warehouse.id || warehouse._id || 'WH-CENTRAL',
      date: form.date,
      notes: form.notes,
      cashAccount: form.method === 'Cash' ? 'Store Cash Drawer' : 'Main Business Bank',
      accountType: form.method === 'Cash' ? 'Cash' : 'Bank',
    };

    try {
      const created = await apiFetch('/payments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const nextRecord = {
        ...payload,
        id: created.paymentId || created._id || payload.ref,
      };
      setRecords((current) => [nextRecord, ...current]);
      setSelectedRecord(nextRecord);
      setForm(defaultForm);
    } catch (error) {
      console.error('Failed to record payment', error);
      alert(error?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModuleLayout
      title="Payments"
      subtitle="Centralized cash management, receivables, supplier settlements, expenses, refunds, and ERP payment reconciliation."
      allowedRoles={['owner', 'admin', 'cashier', 'manager', 'accountant']}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Total payments" value={summary.totalPayments} subtitle="Transactions" accent="emerald" />
          <SummaryCard label="Money received" value={`$${summary.moneyReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} subtitle="Inbound" accent="sky" />
          <SummaryCard label="Money paid" value={`$${summary.moneyPaid.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} subtitle="Outbound" accent="rose" />
          <SummaryCard label="Pending" value={`$${summary.pendingPayments.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} subtitle="Awaiting settlement" accent="amber" />
        </div>

        <div className="space-y-6">
          <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">New transaction</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">{saving ? 'Saving...' : 'Record payment'}</h3>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Type">
                  <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                    <option value="Customer Payment">Customer Payment</option>
                    <option value="Supplier Payment">Supplier Payment</option>
                    <option value="POS Payment">POS Payment</option>
                    <option value="Customer Advance">Customer Advance</option>
                    <option value="Supplier Advance">Supplier Advance</option>
                    <option value="Expense Payment">Expense Payment</option>
                    <option value="Refund">Refund</option>
                    <option value="Other Income">Other Income</option>
                    <option value="Other Payment">Other Payment</option>
                  </select>
                </Field>
                <Field label="Direction">
                  <select value={form.direction} onChange={(event) => setForm((current) => ({ ...current, direction: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                    <option value="incoming">Incoming</option>
                    <option value="outgoing">Outgoing</option>
                  </select>
                </Field>
                <Field label="Party / customer">
                  <input value={form.party} onChange={(event) => setForm((current) => ({ ...current, party: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
                </Field>
                <Field label="Reference">
                  <input value={form.ref} onChange={(event) => setForm((current) => ({ ...current, ref: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
                </Field>
                <Field label="Amount">
                  <input type="number" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
                </Field>
                <Field label="Method">
                  <select value={form.method} onChange={(event) => setForm((current) => ({ ...current, method: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                    {methods.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Warehouse">
                  <select value={form.warehouseId} onChange={(event) => setForm((current) => ({ ...current, warehouseId: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id || warehouse._id || warehouse.name} value={warehouse.id || warehouse._id || warehouse.name}>{warehouse.name || warehouse.warehouseName}</option>
                    ))}
                  </select>                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Failed">Failed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </Field>
              </div>

              <Field label="Date">
                <input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
              </Field>

              <Field label="Notes">
                <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
              </Field>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setForm(defaultForm)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Reset</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700">Save payment</button>
              </div>
            </form>
          </section>

          <section className="min-w-0 rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ledger</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Payment transactions</h3>
              </div>

              <div className="grid w-full min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <input aria-label="Search payments" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search party or reference" className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 xl:min-w-[220px]" />
                <select aria-label="Filter by direction" value={directionFilter} onChange={(event) => setDirectionFilter(event.target.value)} className="min-w-0 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700"><option value="all">All directions</option><option value="incoming">Incoming</option><option value="outgoing">Outgoing</option></select>
                <select aria-label="Filter by method" value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)} className="min-w-0 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700"><option value="all">All methods</option>{methods.map((method) => <option key={method} value={method}>{method}</option>)}</select>
                <select aria-label="Filter by warehouse" value={warehouseFilter} onChange={(event) => setWarehouseFilter(event.target.value)} className="min-w-0 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700"><option value="all">All warehouses</option>{warehouses.map((warehouse) => <option key={warehouse.id || warehouse._id || warehouse.name} value={warehouse.id || warehouse._id || warehouse.name}>{warehouse.name || warehouse.warehouseName}</option>)}</select>
              </div>
            </div>

            <div className="grid min-w-0 gap-4 p-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(240px,0.7fr)]">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full table-fixed text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="w-[34%] px-3 py-3 font-semibold">Party</th>
                      <th className="w-[22%] px-3 py-3 font-semibold">Type</th>
                      <th className="w-[22%] px-3 py-3 font-semibold">Amount</th>
                      <th className="w-[22%] px-3 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} onClick={() => setSelectedRecord(record)} className={`cursor-pointer hover:bg-slate-50 ${record.id === requestedPayment || record.ref === requestedPayment ? 'bg-emerald-50' : ''}`}>
                        <td className="px-3 py-4">
                          <div className="font-medium text-slate-800">{record.party}</div>
                          <div className="text-xs text-slate-500">{record.ref}</div>
                        </td>
                        <td className="px-3 py-4 text-slate-700">{record.type}</td>
                        <td className="px-3 py-4 font-semibold text-slate-900">${Number(record.amount || 0).toFixed(2)}</td>
                        <td className="px-3 py-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${record.status === 'Received' || record.status === 'Approved' || record.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : record.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>{record.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Payment detail</p>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div><span className="text-slate-500">ID:</span> <span className="font-semibold text-slate-900">{selectedRecord?.id}</span></div>
                  <div><span className="text-slate-500">Party:</span> <span className="font-semibold text-slate-900">{selectedRecord?.party}</span></div>
                  <div><span className="text-slate-500">Amount:</span> <span className="font-semibold text-slate-900">${Number(selectedRecord?.amount || 0).toFixed(2)}</span></div>
                  <div><span className="text-slate-500">Method:</span> <span className="font-semibold text-slate-900">{selectedRecord?.method}</span></div>
                  <div><span className="text-slate-500">Status:</span> <span className="font-semibold text-slate-900">{selectedRecord?.status}</span></div>
                  <div><span className="text-slate-500">Warehouse:</span> <span className="font-semibold text-slate-900">{selectedRecord?.warehouse}</span></div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Cash flow</p>
            <div className="mt-5 flex h-56 items-end gap-3 overflow-hidden">
              {cashFlowTrend.map((point) => (
                <div key={point.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex h-40 w-full items-end justify-center gap-1">
                    <div className="w-1/2 rounded-t-xl bg-emerald-500" style={{ height: `${Math.min((point.incoming / 50000) * 100, 100)}%` }} />
                    <div className="w-1/2 rounded-t-xl bg-slate-300" style={{ height: `${Math.min((point.outgoing / 50000) * 100, 100)}%` }} />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">{point.month}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Payment methods</p>
            <div className="mt-6 space-y-4">
              {paymentMethodChart.length > 0 ? paymentMethodChart.map((item) => (
                <div key={item.method}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{item.method}</span>
                    <span className="font-semibold text-slate-900">${Number(item.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" style={{ width: `${Math.min((Number(item.total || 0) / Math.max(paymentMethodChart.reduce((sum, entry) => sum + Number(entry.total || 0), 0), 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              )) : <div className="text-sm text-slate-500">No payment method data available.</div>}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Cash & bank accounts</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">Account balances</h3>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {accounts.map((account) => (
              <div key={account.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{account.name}</p>
                    <p className="text-xs text-slate-500">{account.type}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{toNumber(account?.balance) >= 0 ? 'Positive' : 'Negative'}</span>
                </div>
                <p className="mt-4 text-2xl font-bold text-slate-900">${toNumber(account?.balance).toLocaleString()}</p>
                <div className="mt-4 space-y-2 text-xs text-slate-500">
                  <div className="flex justify-between"><span>Total received</span><span className="font-semibold text-slate-700">${toNumber(account?.totalReceived).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Total paid</span><span className="font-semibold text-slate-700">${toNumber(account?.totalPaid).toLocaleString()}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ModuleLayout>
  );
}

function SummaryCard({ label, value, subtitle, accent }) {
  const colors = { emerald: 'bg-emerald-50 text-emerald-700', sky: 'bg-sky-50 text-sky-700', rose: 'bg-rose-50 text-rose-700', amber: 'bg-amber-50 text-amber-700' };
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${colors[accent]}`}>{subtitle}</span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
