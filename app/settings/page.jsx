'use client';

import { useState } from 'react';
import { ModuleLayout } from '../components/ModuleLayout';
import { apiFetch } from '../lib/api.client';
import { useAuth } from '../components/AuthProvider';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = await apiFetch('/auth/me', { method: 'PUT', body: JSON.stringify(form) });
      if (payload.user) setUser(payload.user);
      setForm((current) => ({ ...current, currentPassword: '', newPassword: '' }));
      setMessage('Your profile was updated.');
    } catch (error) {
      setMessage(error.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModuleLayout title="My settings" subtitle="Update your personal details and password. Access and permissions remain owner-controlled.">
      <form onSubmit={submit} className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Name<input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
          <label className="text-sm font-medium text-slate-700">Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
          <label className="text-sm font-medium text-slate-700">Current password<input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
          <label className="text-sm font-medium text-slate-700">New password<input type="password" minLength={8} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button disabled={saving} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save changes'}</button>
          {message && <span className="text-sm text-slate-600">{message}</span>}
        </div>
      </form>
    </ModuleLayout>
  );
}
