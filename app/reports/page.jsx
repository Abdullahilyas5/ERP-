'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export default function ReportsPage() {
  const [selectedRange, setSelectedRange] = useState('month');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [warehouseData, setWarehouseData] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [stockMovement, setStockMovement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productPage, setProductPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await apiFetch(`/reports?range=${selectedRange}${selectedWarehouse !== 'all' ? `&warehouse=${encodeURIComponent(selectedWarehouse)}` : ''}`);
        const data = response?.data ?? response ?? {};
        const rawWarehouseData = Array.isArray(data.warehouseData) ? data.warehouseData : Array.isArray(data.warehousePerformanceData) ? data.warehousePerformanceData : [];
        const normalizedWarehouseData = rawWarehouseData.map((item) => ({
          name: item?.name || item?.warehouse || 'Warehouse',
          warehouse: item?.warehouse || item?.name || 'Warehouse',
          revenue: toNumber(item?.revenue ?? item?.sales ?? item?.value ?? 0),
          margin: toNumber(item?.margin ?? item?.profitMargin ?? 0),
          expenses: toNumber(item?.expenses ?? item?.cost ?? 0),
        }));
        const normalizedProductData = (Array.isArray(data.productPerformance) ? data.productPerformance : []).map((item) => ({
          name: item?.name || item?.product || 'Product',
          sales: toNumber(item?.sales ?? item?.units ?? item?.value ?? 0),
          value: toNumber(item?.value ?? item?.revenue ?? 0),
        }));
        const normalizedCategoryData = (Array.isArray(data.categoryPerformance) ? data.categoryPerformance : []).map((item) => ({
          name: item?.name || item?.category || item?.label || 'Category',
          value: toNumber(item?.value ?? item?.share ?? item?.amount ?? 0),
        }));
        const rawTrend = Array.isArray(data.salesTrend)
          ? data.salesTrend
          : Array.isArray(data.revenueTrend)
            ? data.revenueTrend
            : [];
        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const normalizedTrendData = rawTrend.map((item, index) => {
          if (typeof item === 'number') {
            return { label: monthLabels[index] || `P${index + 1}`, value: item };
          }
          return {
            label: item?.label || item?.month || monthLabels[index] || `P${index + 1}`,
            value: toNumber(item?.value ?? item?.revenue ?? item?.amount ?? 0),
          };
        });

        setWarehouseData(normalizedWarehouseData);
        setProductPerformance(normalizedProductData);
        setCategoryPerformance(normalizedCategoryData);
        setSalesTrend(normalizedTrendData);
        setStockMovement(Array.isArray(data.stockMovement) ? data.stockMovement : []);
        setProductPage(1);
        setCategoryPage(1);
        setActivityPage(1);
      } catch (err) {
        console.error(err);
        setWarehouseData([]);
        setProductPerformance([]);
        setCategoryPerformance([]);
        setSalesTrend([]);
        setStockMovement([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedRange, selectedWarehouse]);

  const filteredWarehouseData = useMemo(() => {
    if (selectedWarehouse === 'all') return warehouseData;
    return warehouseData.filter((item) => (item.warehouse || item.name) === selectedWarehouse);
  }, [warehouseData, selectedWarehouse]);

  const totalRevenue = filteredWarehouseData.reduce((sum, item) => sum + toNumber(item.revenue), 0);
  const netSales = totalRevenue;
  const avgMargin = filteredWarehouseData.length
    ? filteredWarehouseData.reduce((sum, item) => sum + toNumber(item.margin), 0) / filteredWarehouseData.length
    : 0;
  const topProduct = productPerformance[0]?.name || 'N/A';
  const pageSize = 5;
  const visibleProducts = productPerformance.slice((productPage - 1) * pageSize, productPage * pageSize);
  const visibleCategories = categoryPerformance.slice((categoryPage - 1) * pageSize, categoryPage * pageSize);
  const visibleActivity = stockMovement.slice((activityPage - 1) * pageSize, activityPage * pageSize);
  const categoryTotal = categoryPerformance.reduce((sum, item) => sum + toNumber(item.value), 0);
  const revenueChartMax = Math.max(...salesTrend.map((item) => toNumber(item.value)), 1);
  const revenueChartPoints = salesTrend.map((point, index) => ({
    ...point,
    x: salesTrend.length > 1 ? 56 + (index * 688) / (salesTrend.length - 1) : 400,
    y: 238 - (toNumber(point.value) / revenueChartMax) * 190,
  }));
  const revenueChartLine = revenueChartPoints.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <ModuleLayout
      title="Reports & Analytics"
      subtitle="Operational performance, sales trends, and inventory insights across the business."
      allowedRoles={['owner', 'admin', 'manager']}
      headerActions={
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedRange}
            onChange={(event) => setSelectedRange(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="quarter">Quarter</option>
          </select>

          <select
            value={selectedWarehouse}
            onChange={(event) => setSelectedWarehouse(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All warehouses</option>
            {warehouseData.map((item) => (
              <option key={item.warehouse || item.name} value={item.warehouse || item.name}>{item.warehouse || item.name}</option>
            ))}
          </select>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <SummaryCard label="Revenue" value={`$${(totalRevenue / 1000).toFixed(1)}K`} subtitle="Gross sales" accent="emerald" />
          <SummaryCard label="Net sales" value={`$${(netSales / 1000).toFixed(1)}K`} subtitle="Recorded paid sales" accent="sky" />
          <SummaryCard label="Avg margin" value={`${avgMargin.toFixed(1)}%`} subtitle="Storewide" accent="violet" />
          <SummaryCard label="Top product" value={topProduct} subtitle="Best seller" accent="amber" />
        </div>

        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)]">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sales trend</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Revenue performance</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Live data</span>
            </div>

            <div data-testid="revenue-performance-chart" className="min-h-[240px] min-w-0">
              {loading ? (
                <div className="flex h-60 items-center justify-center text-sm text-slate-500">Loading revenue performance...</div>
              ) : salesTrend.length > 0 ? (
                <svg viewBox="0 0 800 290" className="h-60 w-full overflow-visible" role="img" aria-label="Revenue performance trend">
                  {[0, 25, 50, 75, 100].map((percentage) => {
                    const y = 238 - (percentage / 100) * 190;
                    return (
                      <g key={percentage}>
                        <line x1="56" x2="744" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 5" />
                        <text x="46" y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="11">{Math.round((revenueChartMax * percentage) / 100).toLocaleString()}</text>
                      </g>
                    );
                  })}
                  <line x1="56" x2="744" y1="238" y2="238" stroke="#cbd5e1" />
                  <polyline points={revenueChartLine} fill="none" stroke="#059669" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  {revenueChartPoints.map((point) => (
                    <g key={`${point.label}-${point.x}`}>
                      <circle cx={point.x} cy={point.y} r="6" fill="white" stroke="#059669" strokeWidth="4" />
                      <text x={point.x} y={point.y - 14} textAnchor="middle" fill="#334155" fontSize="11" fontWeight="600">{toNumber(point.value).toLocaleString()}</text>
                      <text x={point.x} y="263" textAnchor="middle" fill="#64748b" fontSize="11">{point.label}</text>
                    </g>
                  ))}
                </svg>
              ) : (
                <div className="flex h-60 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500">No sales trend data available.</div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sales by category</p>
            <div className="mt-6 space-y-4">
              {visibleCategories.length > 0 ? visibleCategories.map((item) => {
                const share = categoryTotal > 0 ? (toNumber(item.value) / categoryTotal) * 100 : 0;
                return (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{item.name}</span>
                    <span className="font-semibold text-slate-900">{share.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${Math.min(share, 100)}%` }} />
                  </div>
                </div>
                );
              }) : <div className="text-sm text-slate-500">No category performance data available.</div>}
            </div>
            <Pagination page={categoryPage} pageSize={pageSize} total={categoryPerformance.length} onChange={setCategoryPage} />
          </section>
        </div>

        <div className="grid min-w-0 gap-5 xl:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Top products</p>
              <span className="text-xs text-slate-400">{productPerformance.length} total</span>
            </div>
            <div className="mt-5 space-y-4">
              {visibleProducts.length > 0 ? visibleProducts.map((product) => (
                <div key={product.name} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">#{Number(product.sales || 0)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{product.name}</p>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" style={{ width: `${Math.min((Number(product.sales || 0) / Math.max(...productPerformance.map((item) => Number(item.sales || 0)), 1)) * 100, 100)}%` }} />
                    </div>

                  </div>
                </div>
              )) : <div className="text-sm text-slate-500">No product performance data available.</div>}
            </div>
            <Pagination page={productPage} pageSize={pageSize} total={productPerformance.length} onChange={setProductPage} />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Stock movement</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Recent inventory activity</h3>
              </div>
              <span className="text-right text-xs text-slate-500">{stockMovement.length} records</span>
            </div>
            {stockMovement.length === 0 ? (
              <p className="text-sm text-slate-500">No stock movement recorded.</p>
            ) : (
              <div className="grid max-h-[32rem] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                {visibleActivity.map((movement) => {
                  const qty = toNumber(movement.qty);
                  return (
                    <div key={movement._id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <div>
                        <p className="font-medium text-slate-800">{movement.productId?.name || movement.product?.name || movement.item || 'Inventory item'}</p>
                        <p className="text-xs capitalize text-slate-500">{movement.type || movement.status || 'movement'} · {movement.notes || movement.reason || 'Recorded movement'}</p>
                      </div>
                      <span className={`font-semibold ${qty >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{qty >= 0 ? '+' : ''}{qty}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <Pagination page={activityPage} pageSize={pageSize} total={stockMovement.length} onChange={setActivityPage} />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Warehouse performance</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredWarehouseData.length > 0 ? filteredWarehouseData.map((item) => (
                <div key={item.warehouse || item.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{item.warehouse || item.name}</p>
                    <span className="text-xs font-semibold text-emerald-700">{Number(item.margin || 0).toFixed(1)}% margin</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">${(Number(item.revenue || 0) / 1000).toFixed(1)}K</p>
                      <p className="text-xs text-slate-500">Revenue</p>
                    </div>
                    <div className="h-16 w-28 overflow-hidden rounded-xl bg-white">
                      <div className="h-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${Math.min(Math.max(Number(item.revenue || 0) / Math.max(...filteredWarehouseData.map((warehouse) => Number(warehouse.revenue || 0)), 1) * 100, 6), 100)}%` }} />
                    </div>
                  </div>
                </div>
              )) : <div className="text-sm text-slate-500">No warehouse data available for the selected range.</div>}
            </div>
          </section>
        </div>
      </div>
    </ModuleLayout>
  );
}

function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
        <button type="button" disabled={page === totalPages} onClick={() => onChange(page + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, subtitle, accent }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
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
