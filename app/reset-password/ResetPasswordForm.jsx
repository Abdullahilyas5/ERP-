'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '../lib/api.client';

export default function ResetPasswordForm() {
  const search = useSearchParams();
  const router = useRouter();

  const token = search.get('token');
  const email = search.get('email');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setStatus('Invalid reset link.');
    }
  }, [token, email]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 6) {
      return setStatus('Password must be at least 6 characters');
    }

    if (password !== confirm) {
      return setStatus('Passwords do not match');
    }

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

      setStatus(res.message || 'Password reset successful');

      setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch (err) {
      setStatus(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 className="mb-4 text-lg font-bold">
          Set a new password
        </h3>

        {status && (
          <p className="mb-3 text-sm text-slate-600">
            {status}
          </p>
        )}

        <label className="block text-sm text-slate-600">
          New password
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3 w-full rounded-md border px-3 py-2"
        />

        <label className="block text-sm text-slate-600">
          Confirm password
        </label>

        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mb-4 w-full rounded-md border px-3 py-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-emerald-600 px-4 py-2 text-white"
        >
          {loading ? 'Saving...' : 'Save new password'}
        </button>
      </form>
    </div>
  );
}