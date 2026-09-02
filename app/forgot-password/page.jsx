'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../lib/api.client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const normalizedEmail = email.trim();
    setMessage('');
    setError('');
    if (!normalizedEmail) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: normalizedEmail }) });
      setMessage(res.message || 'If that email exists, a reset link has been sent.');
    } catch (err) {
      setError(err.message || 'We could not send the reset link. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-600/20">A</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Forgot your password?</h1>
          <p className="mt-2 text-sm text-slate-500">We&apos;ll email you a secure link to set a new password.</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} placeholder="you@example.com" className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50" />
          {error && <p role="alert" className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm text-rose-600">{error}</p>}
          {message && <p role="status" className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">{message}</p>}
          <button type="submit" disabled={loading} className="mt-5 flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Sending link...' : 'Send reset link'}</button>
          <p className="mt-6 text-center text-sm text-slate-500"><Link href="/login" className="font-semibold text-emerald-600 transition hover:text-emerald-700">Back to sign in</Link></p>
        </form>
      </div>
    </main>
  );
}
