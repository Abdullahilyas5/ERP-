/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';
import { useToast } from '../components/ToastProvider';
import { AlertTriangle, CheckCircle2, DollarSign, Package, Plus, RefreshCw, Search, X, Zap } from 'lucide-react';

export default function InventoryPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('catalogue'); // 'catalogue' | 'alerts' | 'transactions' | 'transfers'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalStockUnits: 0,
    totalValuation: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    healthyCount: 0,
  });
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transfers, setTransfers] = useState([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');

  // Adjustment Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState(null);

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [overviewRes, productsRes, transactionsRes] = await Promise.all([
        apiFetch('/inventory').catch(() => ({})),
        apiFetch('/products?page=1&limit=1000').catch(() => ({ items: [] })),
        apiFetch('/inventory/transactions?limit=50').catch(() => ({ transactions: [] })),
      ]);
      const productItems = Array.isArray(productsRes) ? productsRes : (productsRes?.items || []);

      if (overviewRes?.summary) {
        setSummary(overviewRes.summary);
      } else if (productItems.length) {
        // Fallback calculations if summary isn't provided
        const totalUnits = productItems.reduce((acc, p) => acc + (p.stock || 0), 0);
        const totalVal = productItems.reduce((acc, p) => acc + ((p.stock || 0) * (p.price || 0)), 0);
        const low = productItems.filter(p => (p.stock || 0) <= (p.reorderLevel || 0) && (p.stock || 0) > 0).length;
        const oos = productItems.filter(p => (p.stock || 0) <= 0).length;
        setSummary({
          totalProducts: productItems.length,
          totalStockUnits: totalUnits,
          totalValuation: totalVal,
          lowStockCount: low,
          outOfStockCount: oos,
          healthyCount: Math.max(0, productItems.length - low - oos),
        });
      }

      setProducts(productItems);
      setAlerts(overviewRes?.alerts || []);
      setTransactions(transactionsRes?.transactions || overviewRes?.recentTransactions || []);
      setTransfers(
        Array.isArray(overviewRes?.transfers) && overviewRes.transfers.length > 0
          ? overviewRes.transfers
          : (transactionsRes?.transactions || overviewRes?.recentTransactions || []).filter((tx) => tx.type === 'transfer')
      );
    } catch (err) {
      console.error('Failed to load inventory data:', err);
      toast.error('Load Error', 'Failed to fetch some inventory data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Unique categories for filter dropdown
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchQuery ||
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;

      let matchStatus = true;
      const stock = Number(p.stock || 0);
      const reorder = Number(p.reorderLevel || 0);
      if (selectedStockStatus === 'In Stock') matchStatus = stock > reorder;
      else if (selectedStockStatus === 'Low Stock') matchStatus = stock > 0 && stock <= reorder;
      else if (selectedStockStatus === 'Out of Stock') matchStatus = stock <= 0;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedStockStatus]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (transactionTypeFilter === 'all') return transactions;
    return transactions.filter((t) => t.type === transactionTypeFilter);
  }, [transactions, transactionTypeFilter]);

  const [catalogPage, setCatalogPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const pageSize = 8;

  const catalogPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const transactionPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedProducts = filteredProducts.slice((catalogPage - 1) * pageSize, catalogPage * pageSize);
  const paginatedTransactions = filteredTransactions.slice((transactionPage - 1) * pageSize, transactionPage * pageSize);

  function handleOpenAdjust(product = null) {
    setSelectedProductForAdjust(product || (products.length > 0 ? products[0] : null));
    setAdjustModalOpen(true);
  }

  function handleAdjustSuccess() {
    setAdjustModalOpen(false);
    setSelectedProductForAdjust(null);
    toast.success('Stock Adjusted', 'Inventory levels have been successfully updated.');
    loadData(true);
  }

  return (
    <ModuleLayout
      title="Inventory Management"
      subtitle="Real-time stock tracking, valuation, automated reorder triggers, and audit logs."
      allowedRoles={['owner', 'admin', 'manager', 'warehouse_staff']}
      headerActions={
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            title="Refresh Inventory"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => handleOpenAdjust(null)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Adjust Stock</span>
          </button>
        </div>
      }
    >
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Inventory Value"
          value={`$${Number(summary.totalValuation || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${summary.totalStockUnits?.toLocaleString() || 0} total units`}
          accent="emerald"
          icon={DollarSign}
        />
        <StatCard
          label="Total Active SKUs"
          value={summary.totalProducts || products.length}
          subtitle={`${summary.healthyCount || 0} healthy stock`}
          accent="sky"
          icon={Package}
        />
        <StatCard
          label="Low Stock Items"
          value={summary.lowStockCount || alerts.filter(a => a.stock > 0).length}
          subtitle="At or below reorder level"
          accent="amber"
          icon={AlertTriangle}
          highlight={summary.lowStockCount > 0}
        />
        <StatCard
          label="Out of Stock"
          value={summary.outOfStockCount || alerts.filter(a => (a.stock || 0) <= 0).length}
          subtitle="Requires immediate restock"
          accent="rose"
          icon={AlertTriangle}
          highlight={summary.outOfStockCount > 0}
        />
      </div>

      {/* Tabs Navigation */}
      <div className="mt-8 flex border-b border-slate-200">
        <TabButton
          active={activeTab === 'catalogue'}
          onClick={() => setActiveTab('catalogue')}
          label="Stock Catalogue"
          count={products.length}
        />
        <TabButton
          active={activeTab === 'alerts'}
          onClick={() => setActiveTab('alerts')}
          label="Reorder Alerts"
          count={alerts.length}
          badgeColor={alerts.length > 0 ? 'bg-amber-100 text-amber-800' : ''}
        />
        <TabButton
          active={activeTab === 'transactions'}
          onClick={() => setActiveTab('transactions')}
          label="Audit Log & History"
          count={transactions.length}
        />
        <TabButton
          active={activeTab === 'transfers'}
          onClick={() => setActiveTab('transfers')}
          label="Stock Movements"
          count={transfers.length}
        />
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Tab 1: Catalogue */}
        {activeTab === 'catalogue' && (
          <section className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search by product name, SKU or category..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCatalogPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Category:</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCatalogPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status:</label>
                  <select
                    value={selectedStockStatus}
                    onChange={(e) => {
                      setSelectedStockStatus(e.target.value);
                      setCatalogPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="All">All Statuses</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="max-h-[34rem] overflow-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                    <tr>
                      <th className="px-5 py-3.5">Product & SKU</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Stock Level</th>
                      <th className="px-5 py-3.5">Reorder Point</th>
                      <th className="px-5 py-3.5">Unit Price</th>
                      <th className="px-5 py-3.5">Total Valuation</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Loading inventory catalogue...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          No products found matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedProducts.map((p) => {
                        const stock = Number(p.stock || 0);
                        const reorder = Number(p.reorderLevel || 0);
                        const price = Number(p.price || 0);
                        const val = stock * price;
                        
                        let statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        let statusText = 'In Stock';
                        if (stock <= 0) {
                          statusColor = 'bg-rose-50 text-rose-700 border-rose-200';
                          statusText = 'Out of Stock';
                        } else if (stock <= reorder) {
                          statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
                          statusText = 'Low Stock';
                        }

                        // Percentage indicator of stock against reorder level
                        const ratio = reorder > 0 ? Math.min(100, Math.round((stock / (reorder * 2)) * 100)) : 100;
                        const barColor = stock <= 0 ? 'bg-rose-500' : stock <= reorder ? 'bg-amber-500' : 'bg-emerald-500';

                        return (
                          <tr key={p._id} className="transition hover:bg-slate-50/70">
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-900">{p.name}</p>
                              <p className="mt-0.5 text-xs font-mono text-slate-400">{p.sku || 'No SKU'}</p>
                            </td>
                            <td className="px-5 py-4 font-medium text-slate-700">
                              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs">
                                {p.category || 'General'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <span className="w-12 font-bold text-slate-900">{stock}</span>
                                <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                                  <div className={`h-full ${barColor}`} style={{ width: `${ratio}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {reorder} units
                            </td>
                            <td className="px-5 py-4 font-medium text-slate-700">
                              ${price.toFixed(2)}
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-900">
                              ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}>
                                {statusText}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => handleOpenAdjust(p)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
                              >
                                <Zap className="h-3.5 w-3.5" />
                                <span>Adjust</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
                <span>Showing {filteredProducts.length} of {products.length} total items</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCatalogPage((current) => Math.max(1, current - 1))}
                    disabled={catalogPage === 1}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{catalogPage} / {catalogPages}</span>
                  <button
                    type="button"
                    onClick={() => setCatalogPage((current) => Math.min(catalogPages, current + 1))}
                    disabled={catalogPage >= catalogPages}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: Reorder Alerts */}
        {activeTab === 'alerts' && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-900">
              <div className="flex items-center gap-2 font-semibold">
                <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Reorder & Replenishment Monitor</span>
              </div>
              <p className="mt-1 text-xs text-amber-800">
                The following products have dropped to or below their safe reorder thresholds. Immediate replenishment is advised to avoid stockouts.
              </p>
            </div>

            {alerts.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h4 className="mt-4 text-lg font-bold text-slate-800">All Stock Levels Healthy</h4>
                <p className="mt-1 text-sm text-slate-500">No products are currently at or below their reorder points.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {alerts.map((alert) => {
                  const stock = Number(alert.stock || 0);
                  const reorder = Number(alert.reorderLevel || 0);
                  const isOut = stock <= 0;
                  const deficit = Math.max(0, reorder - stock);
                  const suggestedOrder = deficit > 0 ? deficit + reorder : reorder;

                  return (
                    <div
                      key={alert._id}
                      className={`relative flex flex-col justify-between rounded-3xl border p-5 shadow-sm transition ${
                        isOut ? 'border-rose-200 bg-rose-50/30' : 'border-amber-200 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                              {alert.category || 'General'}
                            </span>
                            <h4 className="mt-2 text-base font-bold text-slate-900">{alert.name}</h4>
                            <p className="text-xs font-mono text-slate-400">SKU: {alert.sku}</p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              isOut ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isOut ? 'OUT OF STOCK' : 'LOW STOCK'}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-center">
                          <div>
                            <p className="text-xs text-slate-400 uppercase">Current Stock</p>
                            <p className={`mt-0.5 text-lg font-extrabold ${isOut ? 'text-rose-600' : 'text-amber-600'}`}>
                              {stock} units
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 uppercase">Reorder Point</p>
                            <p className="mt-0.5 text-lg font-bold text-slate-700">{reorder} units</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span>Unit Price: ${Number(alert.price || 0).toFixed(2)}</span>
                          <span>Suggested Order: <strong className="text-slate-800">{suggestedOrder} pcs</strong></span>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
                        <button
                          onClick={() => handleOpenAdjust(alert)}
                          className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-emerald-500"
                        >
                          Quick Restock
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Transactions & Audit Logs */}
        {activeTab === 'transactions' && (
          <section className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Inventory Transaction Audit Log</h4>
                <p className="text-xs text-slate-500">Detailed record of stock adjustments, receipts, and movements</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Type:</label>
                <select
                  value={transactionTypeFilter}
                  onChange={(e) => {
                    setTransactionTypeFilter(e.target.value);
                    setTransactionPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="adjustment">Stock Adjustments</option>
                  <option value="receipt">Purchase Receipts</option>
                  <option value="sale">Sales</option>
                  <option value="transfer">Stock Transfers</option>
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Date & Time</th>
                      <th className="px-5 py-3.5">Product</th>
                      <th className="px-5 py-3.5">Transaction Type</th>
                      <th className="px-5 py-3.5">Stock Delta</th>
                      <th className="px-5 py-3.5">Before → After</th>
                      <th className="px-5 py-3.5">Reason / Note</th>
                      <th className="px-5 py-3.5">Responsible</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No transaction records found.
                        </td>
                      </tr>
                    ) : (
                      paginatedTransactions.map((tx) => {
                        const qty = Number(tx.qty || 0);
                        const isPositive = qty > 0;
                        const prod = tx.productId || {};
                        const user = tx.createdBy || {};

                        let badgeBg = 'bg-slate-100 text-slate-700';
                        if (tx.type === 'adjustment') badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-200 border';
                        else if (tx.type === 'receipt') badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200 border';
                        else if (tx.type === 'sale') badgeBg = 'bg-sky-50 text-sky-700 border-sky-200 border';
                        else if (tx.type === 'transfer') badgeBg = 'bg-amber-50 text-amber-700 border-amber-200 border';

                        const prevStock = tx.metadata?.previousStock;
                        const nextStock = tx.metadata?.newStock;

                        return (
                          <tr key={tx._id} className="transition hover:bg-slate-50/70">
                            <td className="px-5 py-3.5 text-xs text-slate-500">
                              {new Date(tx.createdAt).toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-slate-900">{prod.name || 'Unknown Product'}</p>
                              <p className="text-xs font-mono text-slate-400">{prod.sku || ''}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${badgeBg}`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-bold">
                              <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                                {isPositive ? `+${qty}` : qty} units
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-xs font-medium text-slate-700">
                              {prevStock !== undefined && nextStock !== undefined ? (
                                <span>{prevStock} → <strong>{nextStock}</strong></span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-600">
                              {tx.notes || tx.metadata?.reason || 'Adjustment'}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-500">
                              {user.name || user.email || 'System'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {filteredTransactions.length > 0 && (
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
                  <span>Showing {filteredTransactions.length} total transaction records</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTransactionPage((current) => Math.max(1, current - 1))}
                      disabled={transactionPage === 1}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{transactionPage} / {transactionPages}</span>
                    <button
                      type="button"
                      onClick={() => setTransactionPage((current) => Math.min(transactionPages, current + 1))}
                      disabled={transactionPage >= transactionPages}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tab 4: Transfers */}
        {activeTab === 'transfers' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <h4 className="font-bold text-slate-900">Warehouse & Store Stock Movements</h4>
                <p className="text-xs text-slate-500">Recent inventory transfers between locations</p>
              </div>
            </div>

            {transfers.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                <p>No recent stock transfer movements found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {transfers.map((move) => {
                  const firstItem = Array.isArray(move.items) ? move.items[0] : null;
                  const product = move.productId || move.product || {};
                  const movementName = move.item || firstItem?.name || product.name || firstItem?.sku || product.sku || 'Item Movement';
                  const movementQty = Number(move.qty || firstItem?.qty || product.qty || (Array.isArray(move.items) ? move.items.reduce((sum, item) => sum + Number(item.qty || 0), 0) : 0));
                  return (
                  <div key={move._id || move.transferId} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900">{movementName}</h4>
                        <p className="text-xs text-slate-400">{move.transferId || product.sku || ''}{move.transferId || product.sku ? ' · ' : ''}Qty: {movementQty} units</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        {move.status || 'Completed'}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Origin:</span>
                        <strong className="text-slate-800">{move.from || 'Main Warehouse'}</strong>
                      </div>
                      <div className="mt-1.5 flex justify-between">
                        <span>Destination:</span>
                        <strong className="text-slate-800">{move.to || 'Retail Floor'}</strong>
                      </div>
                    </div>

                    <div className="mt-3 text-right text-[11px] text-slate-400">
                      {move.createdAt ? new Date(move.createdAt).toLocaleString() : 'Date unavailable'}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {adjustModalOpen && (
        <StockAdjustmentModal
          products={products}
          selectedProduct={selectedProductForAdjust}
          onClose={() => setAdjustModalOpen(false)}
          onSuccess={handleAdjustSuccess}
        />
      )}
    </ModuleLayout>
  );
}

function StatCard({ label, value, subtitle, accent, icon: Icon, highlight }) {
  const accentStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
        highlight ? 'ring-2 ring-amber-400/50' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl border text-sm ${accentStyles[accent]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, count, badgeColor }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
        active
          ? 'border-emerald-600 text-emerald-700'
          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            badgeColor || (active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600')
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function StockAdjustmentModal({ products, selectedProduct, onClose, onSuccess }) {
  const [productId, setProductId] = useState(selectedProduct?._id || (products[0]?._id || ''));
  const [mode, setMode] = useState('delta'); // 'delta' (add/subtract) or 'set' (exact)
  const [adjustType, setAdjustType] = useState('add'); // 'add' or 'subtract'
  const [quantity, setQuantity] = useState(1);
  const [exactStock, setExactStock] = useState(Number(selectedProduct?.stock || products[0]?.stock || 0));
  const [reason, setReason] = useState('Cycle Count / Inventory Audit');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Active product calculation
  const currentProduct = products.find((p) => p._id === productId) || selectedProduct || {};
  const currentStock = Number(currentProduct.stock || 0);

  function handleProductChange(nextProductId) {
    setProductId(nextProductId);
    const nextProduct = products.find((p) => p._id === nextProductId) || selectedProduct || {};
    setExactStock(Number(nextProduct.stock || 0));
  }

  // Projected stock preview
  let projectedStock = currentStock;
  let effectiveDelta = 0;
  if (mode === 'set') {
    projectedStock = Math.max(0, Number(exactStock || 0));
    effectiveDelta = projectedStock - currentStock;
  } else {
    const qtyNum = Math.max(0, Number(quantity || 0));
    if (adjustType === 'add') {
      projectedStock = currentStock + qtyNum;
      effectiveDelta = qtyNum;
    } else {
      projectedStock = Math.max(0, currentStock - qtyNum);
      effectiveDelta = -qtyNum;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!productId) return setError('Please select a product.');
    if (mode === 'delta' && (!quantity || Number(quantity) <= 0)) {
      return setError('Adjustment quantity must be greater than 0.');
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        productId,
        qty: mode === 'set' ? exactStock : (adjustType === 'add' ? Number(quantity) : -Number(quantity)),
        mode,
        reason,
        notes: notes.trim() ? `${reason}: ${notes.trim()}` : reason,
      };

      await apiFetch('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      onSuccess();
    } catch (err) {
      setError(err.message || 'Stock adjustment failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Adjust Inventory Stock</h3>
            <p className="text-xs text-slate-500">Record stock increase, write-offs, or audit changes</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Product Select */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Select Product</label>
            <select
              value={productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
            >
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku || 'No SKU'}) — Current Stock: {p.stock}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Banner */}
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm">
            <div>
              <span className="text-xs text-slate-500">Current On-Hand Stock:</span>
              <p className="font-extrabold text-slate-900">{currentStock} units</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Reorder Threshold:</span>
              <p className="font-bold text-slate-700">{currentProduct.reorderLevel || 0} units</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Adjustment Method</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('delta')}
                className={`rounded-xl border py-2 text-xs font-bold transition ${
                  mode === 'delta'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                +/- Add or Deduct Stock
              </button>
              <button
                type="button"
                onClick={() => setMode('set')}
                className={`rounded-xl border py-2 text-xs font-bold transition ${
                  mode === 'set'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                = Set Exact Count
              </button>
            </div>
          </div>

          {/* Delta Mode Controls */}
          {mode === 'delta' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Action</label>
                <div className="mt-1 flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`flex-1 rounded-lg py-1 text-xs font-bold transition ${
                      adjustType === 'add' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600'
                    }`}
                  >
                    + Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('subtract')}
                    className={`flex-1 rounded-lg py-1 text-xs font-bold transition ${
                      adjustType === 'subtract' ? 'bg-rose-600 text-white shadow' : 'text-slate-600'
                    }`}
                  >
                    - Deduct
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">New Exact Stock Count</label>
              <input
                type="number"
                min="0"
                value={exactStock}
                onChange={(e) => setExactStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          {/* Reason Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Reason for Adjustment</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
            >
              <option value="Cycle Count / Inventory Audit">Cycle Count / Inventory Audit</option>
              <option value="Damaged / Expired Goods">Damaged / Expired Goods</option>
              <option value="Direct Supplier Delivery">Direct Supplier Delivery</option>
              <option value="Customer Return">Customer Return</option>
              <option value="Internal Shrinkage / Loss">Internal Shrinkage / Loss</option>
              <option value="Catalog Data Correction">Catalog Data Correction</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Notes / Reference (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Batch #4092, Shelf inspection"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Projected Result Card */}
          <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5">
            <div>
              <p className="text-xs font-semibold text-emerald-800">Projected New Stock</p>
              <p className="text-xs text-slate-500">
                Change: <strong className={effectiveDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {effectiveDelta >= 0 ? `+${effectiveDelta}` : effectiveDelta} units
                </strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-900">{projectedStock}</span>
              <span className="text-xs text-emerald-700"> units</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {submitting ? 'Applying Adjustment...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
