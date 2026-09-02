'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch, getStoredUser } from '../lib/api.client';

export default function PosPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const PAYMENT_METHODS = ['Cash','Card','Mobile Wallet','Bank Transfer','Cheque','Other'];
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashReceived, setCashReceived] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loadError, setLoadError] = useState('');
  const [completedSale, setCompletedSale] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerFloat, setDrawerFloat] = useState('');
  const [drawerState] = useState(() => {
    if (typeof window === 'undefined') return { balance: 0, action: 'open' };
    const savedDrawer = window.localStorage.getItem('pos-drawer');
    if (!savedDrawer) return { balance: 0, action: 'open' };
    try {
      const parsed = JSON.parse(savedDrawer);
      return { balance: Number(parsed.balance) || 0, action: parsed.isOpen ? 'close' : 'open' };
    } catch (err) {
      console.error('Failed to restore cash drawer state:', err);
      return { balance: 0, action: 'open' };
    }
  });
  const [drawerBalance, setDrawerBalance] = useState(drawerState.balance);
  const [drawerAction, setDrawerAction] = useState(drawerState.action);
  const [currentUser] = useState(() => getStoredUser());
  const drawerIsOpen = drawerAction === 'close';

  useEffect(() => {
    window.localStorage.setItem('pos-drawer', JSON.stringify({
      balance: drawerBalance,
      isOpen: drawerIsOpen,
    }));
  }, [drawerBalance, drawerIsOpen]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await apiFetch('/pos/items');
        const items = Array.isArray(data) ? data : (data?.items || []);
        setProducts(items);
      } catch (err) {
        console.error('Failed to load products:', err);
        setLoadError(err?.message || 'Unable to load products.');
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function loadWarehouses() {
      try {
        const data = await apiFetch('/pos/warehouses');
        const items = Array.isArray(data) ? data : (data?.items || []);
        setWarehouses(items);
        if (items.length === 1) setWarehouseId(String(items[0]._id));
      } catch (err) {
        console.error('Failed to load POS branches:', err);
        setLoadError(err?.message || 'Unable to load POS branches.');
      }
    }
    loadWarehouses();
  }, []);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await apiFetch('/customers?page=1&limit=200');
        const customerData = data?.data ?? data;
        setCustomers(Array.isArray(customerData?.items) ? customerData.items : Array.isArray(customerData) ? customerData : []);
      } catch (err) {
        console.error('Failed to load customers:', err);
        setLoadError(err?.message || 'Unable to load customers.');
      }
    }

    loadCustomers();
  }, []);

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => String(item._id || item.id || item.sku) === String(product._id || product.id || product.sku)
      );

      if (existing) {
        return currentCart.map((item) =>
          String(item._id || item.id || item.sku) === String(product._id || product.id || product.sku)
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  const adjustQuantity = (productId, delta) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          String(item._id || item.id || item.sku) === String(productId)
            ? {
                ...item,
                quantity: Math.max(0, item.quantity + delta),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
  }, [cart]);

  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  const changeDue = Math.max(0, Number(cashReceived || 0) - total);

  const cartItemCount = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  async function handleCheckout() {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }
    if (!warehouseId) {
      alert('Select the branch handling this sale.');
      return;
    }
    if (paymentMethod === 'Cash' && !drawerIsOpen) {
      alert('Open the cash drawer before accepting a cash checkout.');
      return;
    }

    try {
      setCheckoutLoading(true);

      const payload = {
        items: cart.map((item) => ({
          productId: item._id || item.id,
          sku: item.sku,
          name: item.name,
          price: Number(item.price || item.sellingPrice || 0),
          costPrice: Number(item.costPrice || 0),
          quantity: item.quantity,
        })),
        channel: paymentMethod,
        paymentMethod,
        customer: selectedCustomer || null,
        customerName: customers.find((entry) => String(entry._id || entry.id) === String(selectedCustomer))?.name || '',
        cashReceived: paymentMethod === 'Cash' ? Number(cashReceived || 0) : total,
        warehouseId,
        warehouseName: warehouses.find((warehouse) => String(warehouse._id) === String(warehouseId))?.name || '',
        cashierName: currentUser?.name || currentUser?.email || 'Current cashier',
      };

      const response = await apiFetch('/pos/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCart([]);
      setCashReceived('');
      setCompletedSale(response);
      if (paymentMethod === 'Cash') setDrawerBalance((balance) => balance + Number(cashReceived || 0));

      const updatedProducts = await apiFetch('/pos/items');
      setProducts(Array.isArray(updatedProducts) ? updatedProducts : (updatedProducts?.items || []));
    } catch (err) {
      console.error('Checkout failed:', err);
      alert(err?.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }

  }

  function invoiceHtml(sale) {
    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
    }[character]));
    const rows = (sale.items || []).map((item) => `<tr><td>${escapeHtml(item.name || item.sku)}</td><td>${item.quantity}</td><td>$${Number(item.price || 0).toFixed(2)}</td><td>$${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</td></tr>`).join('');
    return `<!doctype html><html><head><title>${escapeHtml(sale.invoiceId)} - Invoice</title><style>body{font:14px Arial,sans-serif;color:#172033;max-width:720px;margin:40px auto;padding:0 24px}h1{margin:0 0 4px}header{display:flex;justify-content:space-between;border-bottom:2px solid #172033;padding-bottom:20px;margin-bottom:24px}.muted{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;padding:10px 6px;border-bottom:1px solid #e2e8f0}th:nth-child(n+2),td:nth-child(n+2){text-align:right}.summary{margin:24px 0 0 auto;width:260px}.summary div{display:flex;justify-content:space-between;padding:6px 0}.total{border-top:2px solid #172033;font-size:18px;font-weight:bold;margin-top:8px;padding-top:12px!important}@media print{body{margin:0}}</style></head><body><header><div><h1>Supermarket ERP</h1><div class="muted">Customer invoice</div></div><div><strong>${escapeHtml(sale.invoiceId)}</strong><br><span class="muted">${new Date(sale.createdAt || Date.now()).toLocaleString()}</span></div></header><p><strong>Branch:</strong> ${escapeHtml(sale.warehouse || 'Selected POS branch')}<br><strong>Customer:</strong> ${escapeHtml(sale.customerName || 'Walk-in Customer')}<br><strong>Cashier:</strong> ${escapeHtml(sale.metadata?.cashierName || currentUser?.name || currentUser?.email || 'Current cashier')}<br><strong>Payment:</strong> ${escapeHtml(sale.paymentMethod || paymentMethod)}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="summary"><div><span>Subtotal</span><span>$${Number(sale.subtotal || 0).toFixed(2)}</span></div><div><span>Tax</span><span>$${Number(sale.tax || 0).toFixed(2)}</span></div><div class="total"><span>Total</span><span>$${Number(sale.total || 0).toFixed(2)}</span></div></div><p class="muted">Thank you for your purchase.</p></body></html>`;
  }

  function printInvoice() {
    if (!completedSale) return;
    const invoiceWindow = window.open('', '_blank', 'width=760,height=900');
    if (!invoiceWindow) return alert('Please allow pop-ups to print the invoice.');
    invoiceWindow.document.write(`${invoiceHtml(completedSale)}<script>window.onload=function(){window.print();}</script>`);
    invoiceWindow.document.close();
  }

  function downloadInvoice() {
    if (!completedSale) return;
    const blob = new Blob([invoiceHtml(completedSale)], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${completedSale.invoiceId || 'invoice'}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const visibleProducts = products.filter((product) => {
    const matchesSearch = !search || [product.name, product.sku, product.barcode].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || product.category === category;
    return matchesSearch && matchesCategory;
  });
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];

  return (
    <ModuleLayout
      title="POS"
      subtitle="Process quick purchases and manage the customer checkout flow."
      allowedRoles={['owner', 'admin', 'cashier']}
      headerActions={
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
        >
          Open drawer
        </button>
      }
    >
      {loadError && (
        <div role="alert" className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>{loadError}</span>
          <button type="button" onClick={() => window.location.reload()} className="rounded-lg border border-amber-300 bg-white px-3 py-2 font-semibold hover:bg-amber-100">Retry</button>
        </div>
      )}
      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Checkout context">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Cashier</p>
            <p className="mt-1 font-semibold text-slate-900">{currentUser?.name || currentUser?.email || 'Current cashier'}</p>
            <p className="text-xs text-slate-500">Register #01 · {drawerIsOpen ? 'Open' : 'Closed'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Customer</p>
            <p className="mt-1 font-semibold text-slate-900">
              {customers.find((customer) => String(customer._id || customer.id) === String(selectedCustomer))?.name || 'Walk-in / Guest'}
            </p>
            <p className="text-xs text-slate-500">Purchasing on this checkout</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Branch</p>
            <p className="mt-1 font-semibold text-slate-900">
              {warehouses.find((warehouse) => String(warehouse._id) === String(warehouseId))?.name || 'Select branch'}
            </p>
            <p className="text-xs text-slate-500">Stock and payment location</p>
          </div>
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        {/* Products */}
        <section aria-labelledby="pos-catalog-title" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Products
              </p>

              <h3 id="pos-catalog-title" className="mt-1 text-xl font-bold text-slate-900">
                Quick sale
              </h3>
            </div>

            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
              {products.length} items
            </span>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="pos-product-search">Search products</label>
            <input id="pos-product-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, SKU or barcode" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100" />
            <label className="sr-only" htmlFor="pos-category">Filter category</label>
            <select id="pos-category" value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {loading ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                No products available.
              </div>
            ) : (
              visibleProducts.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">No products match your search or category.</div>
              ) : visibleProducts.map((product) => (
                <button
                  key={product._id || product.id || product.sku}
                  type="button"
                  disabled={Number(product.stock || 0) <= 0}
                  onClick={() => addToCart(product)}
                  className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">
                      {product.name}
                    </p>

                    <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                      + Add
                    </span>
                  </div>

                  <p className="mt-3 text-lg font-bold text-slate-900">
                    ${Number(product.price || 0).toFixed(2)}
                  </p>

                  {product.stock !== undefined && (
                    <p className="mt-1 text-xs text-slate-500">
                      Stock: {product.stock}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </section>

        {/* Cart */}
        <aside aria-labelledby="pos-cart-title" className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm xl:sticky xl:top-6 xl:self-start">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Cart
              </p>
 
              <h3 id="pos-cart-title" className="mt-1 text-xl font-bold text-slate-900">
                Current sale
              </h3>
            </div>
 
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {cartItemCount} items
            </span>
          </div>

          <div className="mb-4">
            <label className="text-sm text-slate-600">Customer</label>
            <div className="mt-2 flex gap-2">
              <select value={selectedCustomer || ''} onChange={(e)=>setSelectedCustomer(e.target.value)} className="rounded-md border px-3 py-2">
                <option value="">Walk-in / Guest</option>
                {customers.map(c=> <option key={c._id||c.id} value={c._id||c.id}>{c.name}</option>)}
              </select>
              <button type="button" onClick={()=>setAddingCustomer(true)} className="rounded-md border px-3 py-2 text-sm">Add</button>
            </div>

            {paymentMethod === 'Cash' && (
              <div className="mb-4 grid grid-cols-2 gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                <label className="text-sm font-medium text-slate-700">
                  Cash received
                  <input type="number" min="0" step="0.01" value={cashReceived} onChange={(event) => setCashReceived(event.target.value)} placeholder={total.toFixed(2)} className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
                </label>
                <div>
                  <p className="text-sm font-medium text-slate-700">Change due</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">${changeDue.toFixed(2)}</p>
                </div>
              </div>
            )}

            {addingCustomer && (
              <div className="mt-3 rounded-2xl bg-white p-3">
                <label className="text-sm text-slate-600">Name</label>
                <input value={newCustomerName} onChange={(e)=>setNewCustomerName(e.target.value)} className="mt-2 w-full rounded-md border px-3 py-2" />
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={async ()=>{
                    if(!newCustomerName.trim()) return alert('Enter name');
                    try{
                      const created = await apiFetch('/customers', { method: 'POST', body: JSON.stringify({ name: newCustomerName.trim() }) });
                      setCustomers(prev=>[...prev, created]);
                      setSelectedCustomer(created._id||created.id);
                      setNewCustomerName('');
                      setAddingCustomer(false);
                    }catch(err){ alert(err?.message||'Failed'); }
                  }} className="rounded-md bg-emerald-600 px-3 py-2 text-white">Save</button>
                  <button type="button" onClick={()=>{ setAddingCustomer(false); setNewCustomerName(''); }} className="rounded-md border px-3 py-2">Cancel</button>
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="text-sm text-slate-600">Payment method</label>
            <div className="mt-2 flex gap-2 flex-wrap">
              {PAYMENT_METHODS.map(m=> (
                <button key={m} type="button" onClick={()=>setPaymentMethod(m)} className={`rounded-full px-3 py-1 text-sm ${paymentMethod===m? 'bg-emerald-600 text-white' : 'border bg-white'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {cart.length === 0 ? (
              <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">
                No items in the cart yet.
              </p>
            ) : (
              cart.map((item) => (
                <div
                  key={item._id || item.id || item.sku}
                  className="flex items-center justify-between rounded-2xl bg-white p-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {item.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      $
                      {Number(item.price || 0).toFixed(2)}
                      {' '}each
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        adjustQuantity(item._id || item.id || item.sku, -1)
                      }
                      className="h-7 w-7 rounded-full bg-slate-100 text-lg text-slate-700 transition hover:bg-slate-200"
                    >
                      −
                    </button>

                    <span className="min-w-5 text-center text-sm font-semibold text-slate-900">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        adjustQuantity(item._id || item.id || item.sku, 1)
                      }
                      className="h-7 w-7 rounded-full bg-slate-100 text-lg text-slate-700 transition hover:bg-slate-200"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          <div className="mt-6 space-y-3 rounded-2xl bg-white p-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm text-slate-600">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout */}
          <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label htmlFor="pos-warehouse" className="text-sm font-semibold text-slate-800">
              Checkout warehouse
              <select id="pos-warehouse" value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} className="mt-2 w-full rounded-xl border border-sky-200 bg-white px-3 py-3 text-sm text-slate-700" required>
                <option value="">Select warehouse or branch</option>
                {warehouses.map((warehouse) => <option key={warehouse._id} value={warehouse._id}>{warehouse.name} ({warehouse.code})</option>)}
              </select>
              {!warehouses.length && <span className="mt-1 block text-xs font-normal text-amber-700">No active warehouses are available.</span>}
            </label>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={
                cart.length === 0 || checkoutLoading || !warehouseId || (paymentMethod === 'Cash' && Number(cashReceived || 0) < total)
              }
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {checkoutLoading ? 'Processing...' : 'Complete checkout'}
            </button>
          </div>
          {completedSale && (
            <div role="status" className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
              <p className="font-semibold">Checkout complete · {completedSale.invoiceId}</p>
              <p className="mt-1">${Number(completedSale.total || 0).toFixed(2)} recorded as {paymentMethod}.</p>
              <button type="button" onClick={printInvoice} className="mt-3 mr-2 rounded-xl border border-emerald-300 bg-white px-3 py-2 font-semibold text-emerald-800 hover:bg-emerald-100">Print invoice</button>
              <button type="button" onClick={downloadInvoice} className="mt-3 mr-2 rounded-xl border border-emerald-300 bg-white px-3 py-2 font-semibold text-emerald-800 hover:bg-emerald-100">Download invoice</button>
              <button type="button" onClick={() => router.push(`/payments?payment=${encodeURIComponent(completedSale.paymentId || completedSale.invoiceId)}`)} className="mt-3 rounded-xl bg-emerald-700 px-3 py-2 font-semibold text-white hover:bg-emerald-800">View payment record</button>
            </div>
          )}
        </aside>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Cash drawer</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Drawer status</h3>
              </div>
              <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Close</button>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">{drawerIsOpen ? 'Drawer is open.' : 'Drawer is closed.'}</p>
              <p className="mt-1">Current cash balance: ${Number(drawerBalance).toFixed(2)}</p>
            </div>

            <div className="mt-5 flex gap-3">
              <div className="flex-1">
                <label htmlFor="drawer-float" className="text-xs font-semibold text-slate-600">{drawerAction === 'open' ? 'Opening float' : 'Closing cash counted'}</label>
                <input id="drawer-float" type="number" min="0" step="0.01" value={drawerFloat} onChange={(event) => setDrawerFloat(event.target.value)} placeholder="0.00" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              </div>
              <button type="button" onClick={() => {
                const amount = Number(drawerFloat);
                if (!Number.isFinite(amount) || amount < 0) return alert('Enter a valid cash amount.');
                setDrawerBalance(amount);
                setDrawerFloat('');
                setDrawerAction(drawerAction === 'open' ? 'close' : 'open');
                setDrawerOpen(false);
              }} className="self-end rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white">{drawerAction === 'open' ? 'Open drawer' : 'Close drawer'}</button>
              <button type="button" onClick={() => setDrawerOpen(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </ModuleLayout>
  );
}
