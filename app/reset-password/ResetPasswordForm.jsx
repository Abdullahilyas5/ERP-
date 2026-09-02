'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '../lib/api.client';

export default function ResetPasswordForm() {
  const search = useSearchParams();
  const router = useRouter();

  const token = search.get('token');
  const email = search.get('email');
  const invalidLink = !token || !email;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          token,
          newPassword: password,
        }),
      });

      setMessage(res.message || 'Password reset successful. Redirecting to sign in...');

      setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch (err) {
      setError(err.message || 'We could not reset your password. Please request a new link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" /><div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" /></div>
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-600/20">A</div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Set a new password</h1><p className="mt-2 text-sm text-slate-500">Choose a strong password you don&apos;t use elsewhere.</p></div>
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          {(invalidLink || error) && <p role="alert" className="mb-5 rounded-lg border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm text-rose-600">{invalidLink ? 'This reset link is incomplete or invalid. Request a new one to continue.' : error}</p>}
          {message && <p role="status" className="mb-5 rounded-lg border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">{message}</p>}
          <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-slate-700">New password <span className="font-normal text-slate-400">(minimum 8 characters)</span></label>
          <div className="relative"><input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading || !token || !email} className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-16 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50" /><button type="button" onClick={() => setShowPassword((value) => !value)} disabled={loading || !token || !email} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 transition hover:text-emerald-600">{showPassword ? 'Hide' : 'Show'}</button></div>
          <label htmlFor="confirm-password" className="mb-2 mt-5 block text-sm font-medium text-slate-700">Confirm new password</label>
          <input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} disabled={loading || !token || !email} className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50" />
          <button type="submit" disabled={loading || !token || !email} className="mt-5 flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Saving password...' : 'Save new password'}</button>
          <p className="mt-6 text-center text-sm text-slate-500"><Link href="/login" className="font-semibold text-emerald-600 transition hover:text-emerald-700">Back to sign in</Link></p>
        </form>
      </div>
    </main>
  );
}
