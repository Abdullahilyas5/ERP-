'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

const statusClasses = {
  Approved: 'bg-emerald-100 text-emerald-700',
  'In Transit': 'bg-sky-100 text-sky-700',
  Pending: 'bg-amber-100 text-amber-700',
  Completed: 'bg-violet-100 text-violet-700',
  Rejected: 'bg-rose-100 text-rose-700',
  Scheduled: 'bg-slate-100 text-slate-700',
  Received: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-rose-100 text-rose-700',
};

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export default function StockTransfersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [stockTransferRecords, setStockTransferRecords] = useState([]);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [draftTransfer, setDraftTransfer] = useState({
    productId: '',
    fromWarehouse: '',
    toWarehouse: '',
    quantity: '1',
    reason: 'Stock replenishment',
  });
  const [page, setPage] = useState(1);
  const [totalTransferCount, setTotalTransferCount] = useState(0);
  const [backendTotalPages, setBackendTotalPages] = useState(1);
  const [transferError, setTransferError] = useState('');
  const pageSize = 8;

  useEffect(() => {
    async function loadData() {
      try {
        const [transferResponse, warehouseResponse, productResponse] = await Promise.all([
          apiFetch(`/stock-transfers?page=${page}&limit=${pageSize}`),
          apiFetch('/warehouses?page=1&limit=200').catch(() => apiFetch('/pos/warehouses')),
          apiFetch('/products?page=1&limit=200'),
        ]);
        const transferData = transferResponse?.items ?? transferResponse?.data?.items ?? transferResponse?.data ?? transferResponse ?? [];
        const transferItems = Array.isArray(transferData?.items) ? transferData.items : Array.isArray(transferData) ? transferData : [];
        const warehouseData = warehouseResponse?.items ?? warehouseResponse?.data?.items ?? warehouseResponse?.data ?? warehouseResponse ?? [];
        const productData = productResponse?.items ?? productResponse?.data?.items ?? productResponse?.data ?? productResponse ?? [];
        setStockTransferRecords(transferItems);
        setTotalTransferCount(Number(transferData?.total ?? transferItems.length ?? 0));
        setBackendTotalPages(Math.max(1, Number((transferData?.totalPages ?? Math.ceil((transferData?.total ?? transferItems.length) / pageSize)) || 1)));
        setWarehouseOptions(Array.isArray(warehouseData) ? warehouseData.map((warehouse) => ({
          id: warehouse.id || warehouse._id || warehouse.code,
          name: warehouse.name || warehouse.warehouseName || warehouse.code || 'Warehouse',
        })) : []);
        setProductOptions(Array.isArray(productData) ? productData.map((product) => ({
          id: product.id || product._id || product.sku,
          name: product.name || product.productName || 'Product',
          sku: product.sku || product.code || '',
        })) : []);
      } catch (err) {
        console.error(err);
        setStockTransferRecords([]);
        setWarehouseOptions([]);
        setProductOptions([]);
      }
    }

    loadData();
  }, [page]);

  const normalizedTransfers = useMemo(() => {
    return stockTransferRecords.map((transfer, index) => {
      const transferId = transfer.transferId || transfer.id || transfer._id || `TR-${index + 1}`;
      const productName = transfer.item || transfer.product || transfer.name || 'Stock transfer';
      const fromWarehouse = transfer.from || transfer.fromWarehouse || transfer.fromWarehouseName || transfer.fromWarehouseId?.name || 'Unknown warehouse';
      const toWarehouse = transfer.to || transfer.toWarehouse || transfer.toWarehouseName || transfer.toWarehouseId?.name || 'Unknown warehouse';
      const qty = toNumber(transfer.qty ?? transfer.quantity);
      const unitPrice = toNumber(transfer.unitPrice ?? transfer.productPrice ?? transfer.price);
      const value = toNumber(transfer.value ?? transfer.amount ?? qty * unitPrice);
      const status = transfer.status || 'Pending';
      const movedAt = transfer.movedAt || transfer.transferDate || (transfer.createdAt ? new Date(transfer.createdAt).toLocaleString() : '—');
      const requestedBy = transfer.requestedBy || transfer.createdBy || transfer.createdByName || 'System';

      return {
        ...transfer,
        id: transferId,
        product: productName,
        from: fromWarehouse,
        to: toWarehouse,
        qty,
        value,
        status,
        movedAt,
        requestedBy,
      };
    });
  }, [stockTransferRecords]);

  const filteredTransfers = useMemo(() => {
    return normalizedTransfers.filter((transfer) => {
      const searchableText = [transfer.id, transfer.product, transfer.from, transfer.to].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !search || searchableText.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
      const matchesWarehouse =
        warehouseFilter === 'all' ||
        transfer.from === warehouseFilter ||
        transfer.to === warehouseFilter;

      return matchesSearch && matchesStatus && matchesWarehouse;
    });
  }, [normalizedTransfers, search, statusFilter, warehouseFilter]);

  const totalQty = filteredTransfers.reduce((sum, item) => sum + toNumber(item.qty), 0);
  const totalValue = filteredTransfers.reduce((sum, item) => sum + toNumber(item.value), 0);
  const totalPages = Math.max(backendTotalPages, Math.ceil(filteredTransfers.length / pageSize));
  const paginatedTransfers = filteredTransfers.slice((page - 1) * pageSize, page * pageSize);

  async function handleCreateTransfer(event) {
    event.preventDefault();
    setTransferError('');

    if (!draftTransfer.productId || !draftTransfer.fromWarehouse || !draftTransfer.toWarehouse) {
      setTransferError('Select a product, source warehouse, destination warehouse, and a quantity greater than zero.');
      return;
    }

    if (draftTransfer.fromWarehouse === draftTransfer.toWarehouse) {
      setTransferError('Source and destination warehouses must be different.');
      return;
    }

    const selectedProduct = productOptions.find((product) => product.id === draftTransfer.productId) || productOptions[0];
    const sourceWarehouse = warehouseOptions.find((warehouse) => warehouse.id === draftTransfer.fromWarehouse) || warehouseOptions[0];
    const destinationWarehouse = warehouseOptions.find((warehouse) => warehouse.id === draftTransfer.toWarehouse) || warehouseOptions[1] || warehouseOptions[0];

    const payload = {
      productId: selectedProduct?.id || draftTransfer.productId,
      product: selectedProduct?.name || 'Product',
      fromWarehouseId: sourceWarehouse?.id || draftTransfer.fromWarehouse,
      toWarehouseId: destinationWarehouse?.id || draftTransfer.toWarehouse,
      from: sourceWarehouse?.name || draftTransfer.fromWarehouse,
      to: destinationWarehouse?.name || draftTransfer.toWarehouse,
      qty: toNumber(draftTransfer.quantity),
      reason: draftTransfer.reason || 'Stock replenishment',
      status: 'Completed',
      requestedBy: 'ERP User',
    };

    try {
      await apiFetch('/stock-transfers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const refreshed = await apiFetch(`/stock-transfers?page=1&limit=${pageSize}`);
      const refreshedData = refreshed?.data ?? refreshed;
      setStockTransferRecords(Array.isArray(refreshedData?.items) ? refreshedData.items : []);
      setTotalTransferCount(Number(refreshedData?.total ?? 0));
      setBackendTotalPages(Math.max(1, Number(refreshedData?.totalPages ?? 1)));
      setDraftTransfer({ productId: '', fromWarehouse: '', toWarehouse: '', quantity: '1', reason: 'Stock replenishment' });
      setIsTransferModalOpen(false);
      setPage(1);
    } catch (error) {
      console.error('Failed to create transfer', error);
      setTransferError(error.message || 'Unable to create stock transfer.');
    }
  }

  return (
    <ModuleLayout
      title="Stock Transfers"
      subtitle="Monitor internal stock movement between warehouses and retail locations."
      allowedRoles={['owner', 'admin', 'manager', 'warehouse_staff']}
      headerActions={
        <button
          type="button"
          onClick={() => setIsTransferModalOpen(true)}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:from-emerald-500 hover:to-teal-500"
        >
          New transfer
        </button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Transfers" value={Number(filteredTransfers.length || 0)} subtitle="Current filter" accent="emerald" />
          <SummaryCard label="Units moved" value={Number(totalQty || 0).toLocaleString()} subtitle="Across visible routes" accent="sky" />
          <SummaryCard label="Value moved" value={`$${Number(totalValue || 0).toLocaleString()}`} subtitle="Inventory value" accent="amber" />
          <SummaryCard label="Pending" value={filteredTransfers.filter((item) => item.status === 'Pending').length} subtitle="Awaiting approval" accent="rose" />
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔎</span>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search transfer ID, product or warehouse..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All statuses</option>
                <option value="Approved">Approved</option>
                <option value="In Transit">In Transit</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={warehouseFilter}
                onChange={(event) => {
                  setWarehouseFilter(event.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All warehouses</option>
                {warehouseOptions.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Transfer</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Route</th>
                  <th className="px-4 py-3 font-semibold">Qty</th>
                  <th className="px-4 py-3 font-semibold">Value</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Requested by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                      No transfer records match the active filters.
                    </td>
                  </tr>
                ) : (
                  paginatedTransfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">{transfer.id}</div>
                        <div className="text-xs text-slate-500">{transfer.movedAt}</div>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-800">{transfer.product}</td>
                      <td className="px-4 py-4">
                        <div>{transfer.from}</div>
                        <div className="text-xs text-slate-500">→ {transfer.to}</div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{transfer.qty}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">${Number(transfer.value || 0).toLocaleString()}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[transfer.status] || 'bg-slate-100 text-slate-600'}`}>
                          {transfer.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{transfer.requestedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredTransfers.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
              <span>
                Showing {Math.min((page - 1) * pageSize + 1, filteredTransfers.length)}-{Math.min(page * pageSize, filteredTransfers.length)} of {filteredTransfers.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-medium text-slate-700">{page}/{totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form onSubmit={handleCreateTransfer} className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Warehouse transfer</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">New stock transfer</h3>
              </div>
              <button type="button" onClick={() => setIsTransferModalOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Close</button>
            </div>
            {transferError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{transferError}</p>}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-slate-600 md:col-span-2">
                <span className="mb-1.5 block">Product</span>
                <select
                  value={draftTransfer.productId}
                  onChange={(event) => setDraftTransfer((current) => ({ ...current, productId: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                >
                  <option value="">Select product</option>
                  {productOptions.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block">From warehouse</span>
                <select
                  value={draftTransfer.fromWarehouse}
                  onChange={(event) => setDraftTransfer((current) => ({ ...current, fromWarehouse: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                >
                  <option value="">Select source</option>
                  {warehouseOptions.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block">To warehouse</span>
                <select
                  value={draftTransfer.toWarehouse}
                  onChange={(event) => setDraftTransfer((current) => ({ ...current, toWarehouse: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                >
                  <option value="">Select destination</option>
                  {warehouseOptions.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block">Quantity</span>
                <input
                  type="number"
                  min="1"
                  value={draftTransfer.quantity}
                  onChange={(event) => setDraftTransfer((current) => ({ ...current, quantity: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                />
              </label>

              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block">Reason</span>
                <input
                  value={draftTransfer.reason}
                  onChange={(event) => setDraftTransfer((current) => ({ ...current, reason: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setIsTransferModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</button>
              <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">Save transfer</button>
            </div>
          </form>
        </div>
      )}
    </ModuleLayout>
  );
}

function SummaryCard({ label, value, subtitle, accent }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[accent]}`}>{subtitle}</span>
      </div>
      <p className="mt-5 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
