'use client';

import { useMemo, useState, useEffect } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';

export default function PosPage() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const PAYMENT_METHODS = ['Cash','Card','Mobile Wallet','Bank Transfer','Cheque','Other'];
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await apiFetch('/products');
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await apiFetch('/customers');
        setCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load customers:', err);
      }
    }

    loadCustomers();
  }, []);

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item._id === product._id
      );

      if (existing) {
        return currentCart.map((item) =>
          item._id === product._id
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
          item._id === productId
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

  const cartItemCount = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  async function handleCheckout() {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      setCheckoutLoading(true);

      const payload = {
        items: cart.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
        })),
        channel: paymentMethod,
        customer: selectedCustomer || null,
      };

      const response = await apiFetch('/sales', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      alert(
        `Sale completed successfully${
          response?.invoiceId
            ? `: ${response.invoiceId}`
            : ''
        }`
      );

      setCart([]);

      const updatedProducts = await apiFetch('/products');
      setProducts(
        Array.isArray(updatedProducts)
          ? updatedProducts
          : []
      );
    } catch (err) {
      console.error('Checkout failed:', err);
      alert(err?.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <ModuleLayout
      title="POS"
      subtitle="Process quick purchases and manage the customer checkout flow."
      allowedRoles={['owner', 'admin', 'cashier']}
      headerActions={
        <button
          type="button"
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
        >
          Open drawer
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Products */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Products
              </p>

              <h3 className="mt-1 text-xl font-bold text-slate-900">
                Quick sale
              </h3>
            </div>

            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
              {products.length} items
            </span>
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
              products.map((product) => (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => addToCart(product)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-sky-200 hover:bg-sky-50"
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
        <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Cart
              </p>
 
              <h3 className="mt-1 text-xl font-bold text-slate-900">
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
                  key={item._id}
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
                        adjustQuantity(item._id, -1)
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
                        adjustQuantity(item._id, 1)
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
          <button
            type="button"
            onClick={handleCheckout}
            disabled={
              cart.length === 0 || checkoutLoading
            }
            className="mt-6 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkoutLoading
              ? 'Processing...'
              : 'Complete checkout'}
          </button>
        </aside>
      </div>
    </ModuleLayout>
  );
}

