'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

const emptyForm = {
  sku: '',
  name: '',
  category: 'Groceries',
  unit: 'Unit',
  warehouseId: '',
  warehouseName: '',
  costPrice: 0,
  sellingPrice: 0,
  markupPercent: 0,
  marginPercent: 0,
  stock: 0,
  reorderLevel: 10,
  status: 'In Stock',
};

function generateSuggestedSku(category, existingProducts) {
  const prefix = (category || 'GEN').toString().slice(0, 3).toUpperCase();
  const numbers = existingProducts
    .map((product) => Number(String(product.sku).replace(/\D/g, '')) || 0)
    .filter(Boolean);
  const nextNumber = Math.max(0, ...numbers) + 1;
  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}

function computePricingValues(costPrice, sellingPrice) {
  const safeCost = Number(costPrice) || 0;
  const safeSelling = Number(sellingPrice) || 0;
  const markup = safeCost > 0 ? ((safeSelling - safeCost) / safeCost) * 100 : 0;
  const margin = safeSelling > 0 ? ((safeSelling - safeCost) / safeSelling) * 100 : 0;

  return {
    markupPercent: Number.isFinite(markup) ? markup : 0,
    marginPercent: Number.isFinite(margin) ? margin : 0,
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [productResponse, warehouseResponse] = await Promise.all([
          apiFetch('/products?page=1&limit=200'),
          apiFetch('/warehouses?page=1&limit=200').catch(() => apiFetch('/pos/warehouses')),
        ]);
        const nextProducts = productResponse?.items ?? productResponse?.data ?? productResponse ?? [];
        const nextWarehouses = warehouseResponse?.items ?? warehouseResponse?.data?.items ?? warehouseResponse?.data ?? warehouseResponse ?? [];
        if (Array.isArray(nextProducts)) setProducts(nextProducts);
        if (Array.isArray(nextWarehouses)) setWarehouses(nextWarehouses);
      } catch (err) {
        console.error(err);
        setProducts([]);
        setWarehouses([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !search ||
        [product.name, product.sku, product.category, product.warehouseName]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesWarehouse = warehouseFilter === 'all' || String(product.warehouseId?._id || product.warehouseId || '') === String(warehouseFilter);
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesWarehouse && matchesCategory;
    });
  }, [products, search, warehouseFilter, categoryFilter]);

  const totalUnits = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const lowStockCount = products.filter((product) => Number(product.stock || 0) <= Number(product.reorderLevel || 0)).length;
  const averageMargin =
    products.length > 0
      ? products.reduce((sum, product) => sum + Number(product.marginPercent || 0), 0) / products.length
      : 0;

  function openNewProduct() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      sku: generateSuggestedSku(emptyForm.category, products),
    });
    setFormOpen(true);
  }

  function openEditProduct(product) {
    setEditingId(product._id || product.id);
    setForm({
      ...product,
      warehouseId: String(product.warehouseId?._id || product.warehouseId || ''),
      warehouseName: product.warehouseName || '',
      costPrice: Number(product.costPrice || 0),
      sellingPrice: Number(product.sellingPrice || product.price || 0),
      markupPercent: Number(product.markupPercent || 0),
      marginPercent: Number(product.marginPercent || 0),
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleFieldChange(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === 'category' && !editingId && !current.sku) {
        next.sku = generateSuggestedSku(value, products);
      }

      if (field === 'costPrice' || field === 'sellingPrice') {
        const pricing = computePricingValues(next.costPrice, next.sellingPrice);
        next.markupPercent = pricing.markupPercent;
        next.marginPercent = pricing.marginPercent;
      }

      return next;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    const selectedWarehouse = warehouses.find((warehouse) => String(warehouse._id || warehouse.id) === String(form.warehouseId));
    if (!form.warehouseId || !selectedWarehouse) {
      alert('Select an active warehouse before saving the product.');
      return;
    }
    const payload = {
      ...form,
      ...(editingId ? {} : {}),
      sku: form.sku || generateSuggestedSku(form.category, products),
      warehouseName: selectedWarehouse.name,
      costPrice: Number(form.costPrice || 0),
      sellingPrice: Number(form.sellingPrice || 0),
      stock: Number(form.stock || 0),
      reorderLevel: Number(form.reorderLevel || 0),
      status: Number(form.stock || 0) <= Number(form.reorderLevel || 0) ? 'Low Stock' : 'In Stock',
    };

    const pricing = computePricingValues(payload.costPrice, payload.sellingPrice);
    payload.markupPercent = pricing.markupPercent;
    payload.marginPercent = pricing.marginPercent;
    payload.price = payload.sellingPrice;

    (async () => {
      try {
        const response = await apiFetch(editingId ? `/products/${editingId}` : '/products', {
          method: editingId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        });
        setProducts((current) => editingId
          ? current.map((product) => String(product._id || product.id) === String(editingId) ? response : product)
          : [response, ...current]);
        closeForm();
      } catch (err) {
        console.error('Failed to save product', err);
        alert(err?.message || 'Unable to save product.');
      }
    })();
  }

  function handleDelete(id) {
    if (!confirm('Delete this product from the catalogue?')) return;
    apiFetch(`/products/${id}`, { method: 'DELETE' })
      .then(() => setProducts((current) => current.filter((product) => String(product._id || product.id) !== String(id))))
      .catch((err) => alert(err?.message || 'Unable to delete product.'));
  }

  return (
    <ModuleLayout
      title="Products"
      subtitle="Catalogue management, SKU control, pricing, margin tracking, and warehouse-linked stock visibility."
      allowedRoles={['owner', 'admin', 'manager', 'cashier']}
      headerActions={
        <button
          type="button"
          onClick={openNewProduct}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:from-emerald-500 hover:to-teal-500"
        >
          Add product
        </button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Products" value={products.length} subtitle="Active SKUs" accent="emerald" />
          <SummaryCard label="Units in stock" value={totalUnits.toLocaleString()} subtitle="Across all warehouses" accent="sky" />
          <SummaryCard label="Low stock" value={lowStockCount} subtitle="Need reorder" accent="amber" />
          <SummaryCard label="Avg. margin" value={`${averageMargin.toFixed(1)}%`} subtitle="Net product margin" accent="violet" />
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔎</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products, SKU or warehouse"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={warehouseFilter}
                onChange={(event) => setWarehouseFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="all">All warehouses</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="all">All categories</option>
                {[...new Set(products.map((product) => product.category))].map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Warehouse</th>
                  <th className="px-4 py-3 font-semibold">Unit</th>
                  <th className="px-4 py-3 font-semibold text-right">Cost</th>
                  <th className="px-4 py-3 font-semibold text-right">Selling</th>
                  <th className="px-4 py-3 font-semibold text-right">Margin</th>
                  <th className="px-4 py-3 font-semibold text-right">Stock</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                      No products match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{product.name}</div>
                        <div className="text-xs text-slate-500">{product.category}</div>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-700">{product.sku}</td>
                      <td className="px-4 py-4 text-slate-700">{product.warehouseName || product.warehouseId?.name || 'Unassigned'}</td>
                      <td className="px-4 py-4 text-slate-700">{product.unit || 'Unit'}</td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-900">${Number(product.costPrice || 0).toFixed(2)}</td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-900">${Number(product.sellingPrice || product.price || 0).toFixed(2)}</td>
                      <td className="px-4 py-4 text-right font-semibold text-emerald-600">{Number(product.marginPercent || 0).toFixed(1)}%</td>
                      <td className="px-4 py-4 text-right">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${Number(product.stock || 0) <= Number(product.reorderLevel || 0) ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => openEditProduct(product)} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                          <button type="button" onClick={() => handleDelete(product.id)} className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Product master data</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">{editingId ? 'Edit product' : 'Add product'}</h3>
              </div>
              <button type="button" onClick={closeForm} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Close</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="SKU">
                  <input
                    value={form.sku}
                    onChange={(event) => handleFieldChange('sku', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </Field>
                <Field label="Product name">
                  <input
                    value={form.name}
                    onChange={(event) => handleFieldChange('name', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </Field>
                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={(event) => handleFieldChange('category', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
                  >
                    {['Groceries', 'Bakery', 'Dairy', 'Meat', 'Fruit', 'Beverages', 'Household', 'Personal Care', 'Frozen', 'Canned Goods'].map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Unit">
                  <select
                    value={form.unit}
                    onChange={(event) => handleFieldChange('unit', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
                  >
                    {['Unit', 'Kg', 'Litre', 'Box', 'Bag', 'Bottle', 'Pack', 'Loaf', 'Carton'].map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Warehouse">
                  <select
                    value={form.warehouseId}
                    onChange={(event) => {
                      const warehouse = warehouses.find((item) => String(item.id || item._id) === event.target.value);
                      handleFieldChange('warehouseId', event.target.value);
                      handleFieldChange('warehouseName', warehouse?.name || '');
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
                  >
                    {warehouses.map((warehouse) => (
                      <option key={warehouse._id || warehouse.id} value={warehouse._id || warehouse.id}>{warehouse.name || warehouse.warehouseName}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Stock status">
                  <select
                    value={form.status}
                    onChange={(event) => handleFieldChange('status', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </Field>
                <Field label="Cost price">
                  <input
                    type="number"
                    step="0.01"
                    value={form.costPrice}
                    onChange={(event) => handleFieldChange('costPrice', Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </Field>
                <Field label="Selling price">
                  <input
                    type="number"
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={(event) => handleFieldChange('sellingPrice', Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </Field>
                <Field label="Markup (%)">
                  <input
                    type="number"
                    step="0.01"
                    value={form.markupPercent}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600"
                  />
                </Field>
                <Field label="Margin (%)">
                  <input
                    type="number"
                    step="0.01"
                    value={form.marginPercent}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600"
                  />
                </Field>
                <Field label="Current stock">
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(event) => handleFieldChange('stock', Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </Field>
                <Field label="Minimum stock">
                  <input
                    type="number"
                    value={form.reorderLevel}
                    onChange={(event) => handleFieldChange('reorderLevel', Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </Field>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button type="button" onClick={closeForm} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</button>
                <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700">
                  Save product
                </button>
              </div>
            </form>
          </div>
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
    violet: 'bg-violet-50 text-violet-700',
  };

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
