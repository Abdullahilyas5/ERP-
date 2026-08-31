'use client';

import { useState } from 'react';
import { apiFetch } from '../lib/api.client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setStatus(res.message || 'If that email exists, a reset link has been sent.');
    } catch (err) {
      setStatus(err.message || 'Request failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold">Reset your password</h3>
        <p className="mb-4 text-sm text-slate-500">Enter your account email and we'll send a link to reset your password.</p>
        <label className="block text-sm text-slate-600">Email</label>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} className="mb-3 w-full rounded-md border px-3 py-2" />
        {status && <p className="mb-3 text-sm text-slate-600">{status}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-md bg-emerald-600 px-4 py-2 text-white">{loading ? 'Sending...' : 'Send reset link'}</button>
      </form>
    </div>
  );
}
